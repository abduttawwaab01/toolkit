import type { DocumentFormat } from "@/types/document";

const SUPPORTED_IMPORTS: Record<string, { format: DocumentFormat; label: string }> = {
  "application/pdf": { format: "rich", label: "PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { format: "rich", label: "DOCX" },
  "application/msword": { format: "rich", label: "DOC" },
  "text/plain": { format: "text", label: "Text" },
  "text/markdown": { format: "markdown", label: "Markdown" },
  "text/html": { format: "html", label: "HTML" },
  "text/rtf": { format: "rich", label: "RTF" },
  "application/rtf": { format: "rich", label: "RTF" },
  "image/png": { format: "rich", label: "Image" },
  "image/jpeg": { format: "rich", label: "Image" },
  "image/webp": { format: "rich", label: "Image" },
  "image/gif": { format: "rich", label: "Image" },
  "image/svg+xml": { format: "rich", label: "Image" },
};

const EXT_MAP: Record<string, { mime: string; format: DocumentFormat; label: string }> = {
  pdf: { mime: "application/pdf", format: "rich", label: "PDF" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", format: "rich", label: "DOCX" },
  doc: { mime: "application/msword", format: "rich", label: "DOC" },
  txt: { mime: "text/plain", format: "text", label: "Text" },
  md: { mime: "text/markdown", format: "markdown", label: "Markdown" },
  html: { mime: "text/html", format: "html", label: "HTML" },
  htm: { mime: "text/html", format: "html", label: "HTML" },
  rtf: { mime: "text/rtf", format: "rich", label: "RTF" },
  odt: { mime: "application/vnd.oasis.opendocument.text", format: "rich", label: "ODT" },
  png: { mime: "image/png", format: "rich", label: "Image" },
  jpg: { mime: "image/jpeg", format: "rich", label: "Image" },
  jpeg: { mime: "image/jpeg", format: "rich", label: "Image" },
  webp: { mime: "image/webp", format: "rich", label: "Image" },
  gif: { mime: "image/gif", format: "rich", label: "Image" },
  svg: { mime: "image/svg+xml", format: "rich", label: "Image" },
};

export interface ImportResult {
  content: string | Record<string, unknown>;
  format: DocumentFormat;
  title: string;
  mimeType: string;
  sourceType: string;
  pageCount?: number;
  originalFormat?: string;
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function detectMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return EXT_MAP[ext]?.mime || "text/plain";
}

function createTipTapParagraph(text: string): Record<string, unknown> {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

function createTipTapImage(base64: string): Record<string, unknown> {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [] },
      { type: "image", attrs: { src: base64, alt: "Uploaded image" } },
      { type: "paragraph", content: [] },
    ],
  };
}

function createRichDoc(nodes: Record<string, unknown>[]): Record<string, unknown> {
  if (nodes.length === 0) nodes.push({ type: "paragraph" });
  return { type: "doc", content: nodes };
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
}

interface LineGroup {
  y: number;
  items: TextItem[];
  fontSize: number;
  fontName: string;
  text: string;
  x: number;
}

function groupItemsIntoLines(items: TextItem[], pageHeight: number): LineGroup[] {
  if (!items || items.length === 0) return [];
  const lines: LineGroup[] = [];
  const EPSILON = 3;

  const sorted = [...items].sort((a, b) => {
    if (Math.abs(b.y - a.y) > EPSILON) return b.y - a.y;
    return a.x - b.x;
  });

  let currentLine: TextItem[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (Math.abs(curr.y - prev.y) <= EPSILON) {
      currentLine.push(curr);
    } else {
      const lineX = Math.min(...currentLine.map((t) => t.x));
      const lineText = currentLine
        .sort((a, b) => a.x - b.x)
        .map((t) => t.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const maxFont = currentLine.reduce(
        (max, t) => (t.fontSize && t.fontSize > max ? t.fontSize : max),
        0,
      );
      lines.push({
        y: prev.y,
        items: currentLine,
        fontSize: maxFont,
        fontName: currentLine[0]?.fontName || "",
        text: lineText,
        x: lineX,
      });
      currentLine = [curr];
    }
  }

  if (currentLine.length > 0) {
    const lineX = Math.min(...currentLine.map((t) => t.x));
    const lineText = currentLine
      .sort((a, b) => a.x - b.x)
      .map((t) => t.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const maxFont = currentLine.reduce(
      (max, t) => (t.fontSize && t.fontSize > max ? t.fontSize : max),
      0,
    );
    lines.push({
      y: sorted[sorted.length - 1].y,
      items: currentLine,
      fontSize: maxFont,
      fontName: currentLine[0]?.fontName || "",
      text: lineText,
      x: lineX,
    });
  }

  return lines.sort((a, b) => b.y - a.y);
}

function detectStructure(lines: LineGroup[]): Record<string, unknown>[] {
  if (lines.length === 0) return [{ type: "paragraph" }];

  const fontSizes = lines
    .map((l) => l.fontSize)
    .filter((s) => s > 0);
  const avgFontSize =
    fontSizes.length > 0
      ? fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length
      : 12;
  const headingThreshold = avgFontSize * 1.35;

  const nodes: Record<string, unknown>[] = [];
  const sorted = [...lines].sort((a, b) => b.y - a.y);
  let prevY: number | null = null;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
    if (text) {
      nodes.push({ type: "paragraph", content: [{ type: "text", text }] });
    }
    paragraphBuffer = [];
  }

  for (const line of sorted) {
    const gap = prevY !== null ? prevY - line.y : 0;
    const isHeading =
      line.fontSize > 0 &&
      (line.fontSize >= headingThreshold || line.fontName?.toLowerCase().includes("bold"));

    if (isHeading && paragraphBuffer.length > 0) {
      flushParagraph();
    }

    if (isHeading) {
      flushParagraph();
      const level =
        line.fontSize >= avgFontSize * 2
          ? 1
          : line.fontSize >= avgFontSize * 1.6
            ? 2
            : 3;
      nodes.push({
        type: "heading",
        attrs: { level: Math.min(level, 3) },
        content: [{ type: "text", text: line.text }],
      });
    } else if (gap > 12 && paragraphBuffer.length > 0) {
      flushParagraph();
      paragraphBuffer.push(line.text);
    } else {
      paragraphBuffer.push(line.text);
    }

    prevY = line.y;
  }

  flushParagraph();
  return nodes;
}

async function parseTxt(file: File): Promise<ImportResult> {
  const text = await readFileAsText(file);
  return {
    content: text,
    format: "text",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "text/plain",
    sourceType: "file-txt",
  };
}

async function parseMd(file: File): Promise<ImportResult> {
  const text = await readFileAsText(file);
  return {
    content: text,
    format: "markdown",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "text/markdown",
    sourceType: "file-md",
  };
}

async function parseHtml(file: File): Promise<ImportResult> {
  const text = await readFileAsText(file);
  return {
    content: text,
    format: "html",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "text/html",
    sourceType: "file-html",
  };
}

async function parseDocx(file: File): Promise<ImportResult> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  const nodes: Record<string, unknown>[] = [];

  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let lastIndex = 0;
  const sections: { type: string; level?: number; text: string; index: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    sections.push({ type: "heading", level: Math.min(level, 3), text, index: match.index });
  }

  const paraRegex = /<p[^>]*>(.*?)<\/p>/gi;
  while ((match = paraRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) sections.push({ type: "paragraph", text, index: match.index });
  }

  const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
  let listItems: string[] = [];
  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) listItems.push(text);
  }

  sections.sort((a, b) => a.index - b.index);

  for (const s of sections) {
    if (s.type === "heading") {
      nodes.push({
        type: "heading",
        attrs: { level: s.level || 1 },
        content: [{ type: "text", text: s.text }],
      });
    } else {
      nodes.push({
        type: "paragraph",
        content: [{ type: "text", text: s.text }],
      });
    }
  }

  if (listItems.length > 0 && nodes.length === 0) {
    nodes.push({
      type: "bulletList",
      content: listItems.map((text) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      })),
    });
  }

  return {
    content: createRichDoc(nodes),
    format: "rich",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sourceType: "file-docx",
  };
}

async function parsePdf(file: File): Promise<ImportResult> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allNodes: Record<string, unknown>[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: TextItem[] = content.items.map((item: any) => ({
      str: item.str,
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
      width: item.width || 0,
      height: item.height || 0,
      fontName: item.fontName || "",
      fontSize: Number(item.fontSize?.replace("px", "") || item.height || 12),
    }));

    const lines = groupItemsIntoLines(items, viewport.height);
    const pageNodes = detectStructure(lines);

    if (pageNum > 1 && pageNodes.length > 0) {
      allNodes.push({ type: "horizontalRule" });
    }

    allNodes.push(...pageNodes);
  }

  return {
    content: createRichDoc(allNodes),
    format: "rich",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "application/pdf",
    sourceType: "file-pdf",
    pageCount: pdf.numPages,
    originalFormat: "PDF",
  };
}

async function parseImage(file: File): Promise<ImportResult> {
  const base64 = await readFileAsBase64(file);
  return {
    content: createTipTapImage(base64),
    format: "rich",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: file.type,
    sourceType: "file-image",
  };
}

export function getSupportedFileTypes(): string {
  return Object.keys(EXT_MAP)
    .map((ext) => `.${ext}`)
    .join(", ");
}

export function isFileSupported(file: File): boolean {
  const mime = detectMimeType(file);
  if (SUPPORTED_IMPORTS[mime]) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return !!EXT_MAP[ext];
}

export function getFileLabel(file: File): string {
  const mime = detectMimeType(file);
  const match = SUPPORTED_IMPORTS[mime] || EXT_MAP[file.name.split(".").pop()?.toLowerCase() || ""];
  return match?.label || "Unknown";
}

export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = detectMimeType(file);

  if (isImageFile(mime)) return parseImage(file);
  if (mime === "application/pdf" || ext === "pdf") return parsePdf(file);
  if (mime.includes("openxmlformats") || ext === "docx") return parseDocx(file);
  if (mime === "text/markdown" || ext === "md") return parseMd(file);
  if (mime === "text/html" || ext === "html" || ext === "htm") return parseHtml(file);
  if (mime === "text/plain" || ext === "txt") return parseTxt(file);

  return parseTxt(file);
}
