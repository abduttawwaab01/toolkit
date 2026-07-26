import type { DocumentFormat } from "@/types/document";

export interface ExportOptions {
  content: string;
  title: string;
  format: string;
  rawContent?: string;
  docFormat?: DocumentFormat;
}

export async function exportDocument(options: ExportOptions): Promise<Blob | null> {
  const { content, title, format } = options;

  switch (format) {
    case "txt":
      return new Blob([content], { type: "text/plain" });
    case "md":
      return new Blob([content], { type: "text/markdown" });
    case "html":
      return generateHtmlBlob(content, title);
    case "json":
      return new Blob([content], { type: "application/json" });
    case "pdf":
      return generatePdfBlob(content, title);
    case "docx":
      return generateDocxBlob(content, title);
    default:
      return null;
  }
}

function generateHtmlBlob(content: string, title: string): Blob {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 12pt; line-height: 1.6; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 24pt; font-weight: 700; margin: 24pt 0 12pt; color: #111; }
    h2 { font-size: 20pt; font-weight: 600; margin: 20pt 0 10pt; }
    h3 { font-size: 16pt; font-weight: 600; margin: 16pt 0 8pt; }
    p { margin: 0 0 8pt; }
    pre { background: #f4f4f8; padding: 12pt 16pt; border-radius: 6pt; font-size: 10pt; overflow-x: auto; border: 1px solid #e2e2ea; }
    code { background: #f0f0f5; padding: 2pt 5pt; border-radius: 3pt; font-size: 10pt; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4pt solid #6c63ff; padding-left: 12pt; margin: 12pt 0; color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
    th, td { border: 1pt solid #d0d0da; padding: 6pt 10pt; text-align: left; }
    th { background: #f0f0f5; font-weight: 600; }
    img { max-width: 100%; border-radius: 6pt; margin: 12pt 0; }
    ul, ol { padding-left: 24pt; margin: 8pt 0; }
    li { margin: 4pt 0; }
    hr { border: none; border-top: 1pt solid #e0e0ea; margin: 20pt 0; }
  </style>
</head>
<body>${content}</body>
</html>`;
  return new Blob([html], { type: "text/html" });
}

async function generatePdfBlob(content: string, title: string): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 48;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  function addText(text: string, size: number, bold: boolean) {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, usableWidth);
    for (const line of lines) {
      if (y + size * 1.5 > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += size * 1.5;
    }
  }

  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(title, usableWidth);
  for (const line of titleLines) {
    if (y + 30 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 28;
  }
  y += 12;

  const plain = content.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const paragraphs = plain.split(/\n\n+/);
  for (const para of paragraphs) {
    addText(para.trim(), 11, false);
    y += 6;
  }

  return pdf.output("blob");
}

async function generateDocxBlob(content: string, title: string): Promise<Blob> {
  try {
    const docx = await import("docx");
    const plainText = content.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const paragraphs = plainText.split(/\n\n+/).filter(Boolean);

    const doc = new docx.Document({
      title,
      description: `Exported from ToolKit`,
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22, color: "1a1a2e" },
            paragraph: { spacing: { after: 160 } },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: paragraphs.map(
            (p) =>
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: p,
                    size: 22,
                    font: "Calibri",
                  }),
                ],
                spacing: { after: 160 },
              })
          ),
        },
      ],
    });

    return await docx.Packer.toBlob(doc);
  } catch {
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;}p{margin:0 0 6pt 0;}</style>
</head><body>${content.replace(/\n/g, "<br>")}</body></html>`;
    return new Blob([html], { type: "application/msword" });
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export const EXPORT_FORMAT_OPTIONS = [
  { id: "pdf", name: "PDF", ext: ".pdf", mime: "application/pdf", icon: "FileText", color: "text-neon-cyan", borderColor: "border-neon-cyan", description: "Professional PDF document" },
  { id: "docx", name: "Word", ext: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", icon: "FileText", color: "text-neon-purple", borderColor: "border-neon-purple", description: "Microsoft Word format" },
  { id: "html", name: "HTML", ext: ".html", mime: "text/html", icon: "FileCode", color: "text-neon-pink", borderColor: "border-neon-pink", description: "Web-ready HTML document" },
  { id: "md", name: "Markdown", ext: ".md", mime: "text/markdown", icon: "Code2", color: "text-neon-purple", borderColor: "border-neon-purple", description: "Lightweight markup language" },
  { id: "txt", name: "Plain Text", ext: ".txt", mime: "text/plain", icon: "FileType", color: "text-text-secondary", borderColor: "border-text-secondary", description: "Raw text without formatting" },
  { id: "json", name: "JSON", ext: ".json", mime: "application/json", icon: "FileCode", color: "text-neon-pink", borderColor: "border-neon-pink", description: "Raw document data as JSON" },
];
