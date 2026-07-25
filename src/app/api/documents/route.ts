import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "title", "lastOpenedAt"];
const FORMATS = ["rich", "markdown", "text", "html"];

const listQuerySchema = z.object({
  search: z.string().default(""),
  format: z.string().default(""),
  isArchived: z.string().default(""),
  isTemplate: z.string().default(""),
  sortBy: z.string().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.any().optional(),
  format: z.enum(["rich", "markdown", "text", "html"]).default("rich"),
  tags: z.string().optional(),
});

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string, role: (session.user as any).role as string };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    search: searchParams.get("search") || "",
    format: searchParams.get("format") || "",
    isArchived: searchParams.get("isArchived") || "",
    isTemplate: searchParams.get("isTemplate") || "",
    sortBy: searchParams.get("sortBy") || "updatedAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });

  if (!parsed.success) {
    return jsonResponse({ error: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, format, isArchived, isTemplate, sortBy, sortOrder, page, limit } = parsed.data;
  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "updatedAt";

  const where: any = { userId: auth.userId };
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (format && FORMATS.includes(format)) {
    where.format = format;
  }
  if (isArchived !== "") {
    where.isArchived = isArchived === "true";
  }
  if (isTemplate !== "") {
    where.isTemplate = isTemplate === "true";
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { [safeSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.document.count({ where }),
  ]);

  return jsonResponse({
    documents,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, content, format, tags } = parsed.data;

  const contentJson = content ?? {};
  const contentStr = typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson);
  const wordCount = contentStr.trim() ? contentStr.trim().split(/\s+/).length : 0;
  const size = BigInt(Buffer.byteLength(contentStr, "utf-8"));

  const FORMAT_MAP: Record<string, { mimeType: string; extension: string }> = {
    rich: { mimeType: "application/json", extension: "json" },
    markdown: { mimeType: "text/markdown", extension: "md" },
    text: { mimeType: "text/plain", extension: "txt" },
    html: { mimeType: "text/html", extension: "html" },
  };

  const { mimeType, extension } = FORMAT_MAP[format];

  const document = await db.document.create({
    data: {
      userId: auth.userId,
      title,
      description: description || null,
      content: contentJson,
      format,
      mimeType,
      extension,
      size,
      wordCount,
      tags: tags || "[]",
    },
  });

  return jsonResponse(document, { status: 201 });
}
