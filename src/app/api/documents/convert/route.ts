import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";
import { marked } from "marked";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string, role: (session.user as any).role as string };
}

const convertBodySchema = z.object({
  fromFormat: z.enum(["rich", "markdown", "text", "html"]),
  toFormat: z.enum(["rich", "markdown", "text", "html"]),
  content: z.string(),
  title: z.string().optional(),
});

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?ul[^>]*>/gi, "\n");
  md = md.replace(/<\/?ol[^>]*>/gi, "\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<\/p>/gi, "\n\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/---+/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function richToHtml(content: any): string {
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return content;
    }
  }
  if (!content || !content.content) return "";

  function renderNode(node: any): string {
    if (node.type === "text") return node.text || "";
    const children = (node.content || []).map(renderNode).join("");
    switch (node.type) {
      case "paragraph": return `<p>${children}</p>`;
      case "heading": {
        const level = node.attrs?.level || 1;
        return `<h${level}>${children}</h${level}>`;
      }
      case "bold":
      case "strong": return `<strong>${children}</strong>`;
      case "italic":
      case "emphasis": return `<em>${children}</em>`;
      case "code": return `<code>${children}</code>`;
      case "codeBlock": return `<pre><code>${children}</code></pre>`;
      case "bulletList": return `<ul>${children}</ul>`;
      case "orderedList": return `<ol>${children}</ol>`;
      case "listItem": return `<li>${children}</li>`;
      case "blockquote": return `<blockquote>${children}</blockquote>`;
      case "hardBreak": return "<br>";
      case "horizontalRule": return "<hr>";
      case "link": return `<a href="${node.attrs?.href || ""}">${children}</a>`;
      case "image": return `<img src="${node.attrs?.src || ""}" alt="${node.attrs?.alt || ""}">`;
      default: return children;
    }
  }

  return renderNode(content);
}

function htmlToRich(html: string): any {
  const lines = html.split(/\n/);
  const content: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^<h([1-6])[^>]*>(.*?)<\/h\1>$/i);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: parseInt(headingMatch[1]) },
        content: [{ type: "text", text: stripHtml(headingMatch[2]) }],
      });
      continue;
    }

    if (trimmed.match(/^<(p|div)[^>]*>/i)) {
      const text = stripHtml(trimmed);
      if (text) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text }],
        });
      }
      continue;
    }

    const text = stripHtml(trimmed);
    if (text) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text }],
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: "paragraph", content: [{ type: "text", text: "" }] });
  }

  return { type: "doc", content };
}

function convertContent(fromFormat: string, toFormat: string, content: string): string {
  if (fromFormat === toFormat) return content;

  const key = `${fromFormat}->${toFormat}`;
  switch (key) {
    case "markdown->html":
      return marked.parse(content) as string;
    case "html->markdown":
      return htmlToMarkdown(content);
    case "html->text":
      return stripHtml(content);
    case "text->html":
      return textToHtml(content);
    case "rich->html":
      return richToHtml(content);
    case "html->rich":
      return JSON.stringify(htmlToRich(content));
    case "markdown->text":
      return stripMarkdown(content);
    case "text->markdown":
      return content;
    case "rich->text":
      return stripHtml(richToHtml(content));
    case "rich->markdown":
      return htmlToMarkdown(richToHtml(content));
    case "text->rich": {
      const escaped = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const paragraphs = escaped.split(/\n\n+/).filter(Boolean);
      return JSON.stringify({
        type: "doc",
        content: paragraphs.map((p) => ({
          type: "paragraph",
          content: [{ type: "text", text: p.replace(/\n/g, " ") }],
        })),
      });
    }
    case "markdown->rich": {
      const html = marked.parse(content) as string;
      return JSON.stringify(htmlToRich(html));
    }
    default:
      throw new Error(`Unsupported conversion: ${key}`);
  }
}

const OUTPUT_MAP: Record<string, { mimeType: string; extension: string }> = {
  rich: { mimeType: "application/json", extension: "json" },
  markdown: { mimeType: "text/markdown", extension: "md" },
  text: { mimeType: "text/plain", extension: "txt" },
  html: { mimeType: "text/html", extension: "html" },
};

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = convertBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { fromFormat, toFormat, content } = parsed.data;

  try {
    const converted = convertContent(fromFormat, toFormat, content);
    const { mimeType, extension } = OUTPUT_MAP[toFormat];
    return jsonResponse({ success: true, content: converted, mimeType, extension });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || "Conversion failed" }, { status: 400 });
  }
}
