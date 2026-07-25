import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/json";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string, role: (session.user as any).role as string };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

  const where = { userId: auth.userId };

  const [totalDocuments, aggregated, byFormat, recentDocuments] = await Promise.all([
    db.document.count({ where }),
    db.document.aggregate({ where, _sum: { size: true, wordCount: true } }),
    db.document.groupBy({ by: ["format"], where, _count: true }),
    db.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, format: true, updatedAt: true, wordCount: true },
    }),
  ]);

  return jsonResponse({
    totalDocuments,
    totalSize: aggregated._sum.size?.toString() ?? "0",
    totalWords: aggregated._sum.wordCount ?? 0,
    byFormat: byFormat.map((f) => ({
      format: f.format,
      count: f._count,
    })),
    recentDocuments,
  });
}
