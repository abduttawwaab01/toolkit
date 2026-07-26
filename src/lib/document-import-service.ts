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
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

function createTipTapImage(base64: string): Record<string, unknown> {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [],
      },
      {
        type: "image",
        attrs: { src: base64, alt: "Uploaded image" },
      },
      {
        type: "paragraph",
        content: [],
      },
    ],
  };
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
  return {
    content: createTipTapParagraph(html.replace(/<[^>]+>/g, "").trim() || "Imported DOCX content"),
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
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  return {
    content: createTipTapParagraph(fullText.trim() || "Imported PDF content"),
    format: "rich",
    title: file.name.replace(/\.[^.]+$/, ""),
    mimeType: "application/pdf",
    sourceType: "file-pdf",
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
