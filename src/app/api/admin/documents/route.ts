import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const format = url.searchParams.get("format") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "15")));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (format) where.extension = format;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.document.count({ where }),
  ]);

  const allDocs = await db.document.groupBy({
    by: ["extension"],
    _count: true,
    _sum: { size: true, wordCount: true },
  });

  const formatDistribution: Record<string, number> = {};
  let totalSize = BigInt(0);
  let totalWords = 0;
  for (const row of allDocs) {
    formatDistribution[row.extension] = row._count;
    totalSize += row._sum.size || BigInt(0);
    totalWords += row._sum.wordCount || 0;
  }

  return jsonResponse({
    documents,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalDocuments: total,
      totalSize: formatBytes(Number(totalSize)),
      totalWords,
      formatDistribution,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "Document id required" }, { status: 400 });

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return jsonResponse({ error: "Not found" }, { status: 404 });

  await db.documentVersion.deleteMany({ where: { documentId: id } });
  await db.document.delete({ where: { id } });

  await logAdminAction(admin.userId, "document.deleted", "document", id, { title: doc.title, userId: doc.userId }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
