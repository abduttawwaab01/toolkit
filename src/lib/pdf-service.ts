import type { VisualTextItem, VisualPage, VisualEdit } from "@/types/document";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

function buildTextItemId(pageNumber: number, index: number, text: string): string {
  return `p${pageNumber}_i${index}_${text.slice(0, 16).replace(/\s/g, "_")}`;
}

export async function getPdfMetadata(pdfBytes: ArrayBuffer): Promise<{ pageCount: number; title?: string }> {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) }).promise;
  const metadata = await pdf.getMetadata().catch(() => null);
  return {
    pageCount: pdf.numPages,
    title: (metadata?.info as any)?.Title || undefined,
  };
}

export async function extractTextItems(pdfBytes: ArrayBuffer, pageNumber: number): Promise<{ items: VisualTextItem[]; width: number; height: number }> {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  const items: VisualTextItem[] = content.items
    .filter((item: any) => "str" in item && item.str && item.str.trim().length > 0)
    .map((item: any, index: number) => {
      const tx = item.transform;
      const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) || Math.abs(item.height) || 12;
      return {
        id: buildTextItemId(pageNumber, index, item.str),
        text: item.str,
        x: tx[4],
        y: tx[5],
        width: item.width,
        height: fontSize,
        fontSize,
        fontName: item.fontName || "sans-serif",
        fontWeight: item.fontName?.toLowerCase().includes("bold") ? "bold" : undefined,
        fontStyle: item.fontName?.toLowerCase().includes("italic") ? "italic" : undefined,
        transform: tx,
      };
    });

  return { items, width: viewport.width, height: viewport.height };
}

export async function renderPageToCanvas(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  scale: number,
  canvas?: HTMLCanvasElement,
): Promise<HTMLCanvasElement> {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const cvs = canvas || document.createElement("canvas");
  cvs.width = viewport.width;
  cvs.height = viewport.height;

  const ctx = cvs.getContext("2d")!;
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  await page.render({ canvasContext: ctx, viewport } as any).promise;
  return cvs;
}

export async function renderPageThumbnail(pdfBytes: ArrayBuffer, pageNumber: number, maxWidth = 160): Promise<string> {
  const canvas = await renderPageToCanvas(pdfBytes, pageNumber, 0.3);
  const ratio = maxWidth / canvas.width;
  const w = maxWidth;
  const h = canvas.height * ratio;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = w;
  tmpCanvas.height = h;
  const ctx = tmpCanvas.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, w, h);
  return tmpCanvas.toDataURL("image/jpeg", 0.7);
}

export async function extractAllPages(pdfBytes: ArrayBuffer): Promise<VisualPage[]> {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(0) }).promise;
  const pages: VisualPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const { items, width, height } = await extractTextItems(pdfBytes, i);
    pages.push({ pageNumber: i, width, height, textItems: items });
  }

  return pages;
}

function isTextItem(item: any): boolean {
  return item && typeof item === "object" && "str" in item && "transform" in item;
}

export async function exportVisualAsPdf(
  originalBase64: string,
  edits: VisualEdit[],
): Promise<Blob> {
  const pdfBytes = base64ToArrayBuffer(originalBase64);

  if (edits.length === 0) {
    return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  }

  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const pdfjs = await getPdfjs();
  const srcDoc = await pdfjs.getDocument({ data: pdfBytes }).promise;

  for (const edit of edits) {
    const page = pages[edit.pageNumber - 1];
    if (!page) continue;

    const srcPage = await srcDoc.getPage(edit.pageNumber);
    const { height: pageHeight } = page.getSize();

    const srcContent = await srcPage.getTextContent();
    const items = srcContent.items.filter((i: any) => isTextItem(i) && i.str && i.str.trim());

    const targetItem = items.find((item: any) => {
      if (!isTextItem(item)) return false;
      const id = buildTextItemId(edit.pageNumber, items.indexOf(item), item.str);
      return id === edit.itemId || item.str === edit.originalText;
    });

    if (!targetItem || !isTextItem(targetItem)) continue;

    const tx = (targetItem as any).transform;
    const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) || Math.abs((targetItem as any).height) || 12;
    const x = tx[4];
    const yFromBottom = pageHeight - tx[5] - fontSize;

    page.drawRectangle({
      x: x - 0.5,
      y: yFromBottom - 0.5,
      width: (targetItem as any).width + 1,
      height: fontSize + 2,
      color: rgb(1, 1, 1),
      opacity: 1,
    });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const originalWidth = (targetItem as any).width;
    const newTextWidth = font.widthOfTextAtSize(edit.newText, fontSize);
    let drawSize = fontSize;
    if (newTextWidth > originalWidth && originalWidth > 0) {
      drawSize = fontSize * (originalWidth / newTextWidth);
    }

    page.drawText(edit.newText, {
      x,
      y: yFromBottom,
      size: drawSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  const modifiedBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(modifiedBytes)], { type: "application/pdf" });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
