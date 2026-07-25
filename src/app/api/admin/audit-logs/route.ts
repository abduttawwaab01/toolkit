import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
  const action = searchParams.get("action") || "";
  const entity = searchParams.get("entity") || "";
  const userId = searchParams.get("userId") || "";

  const where: any = {};
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (entity) where.entity = { contains: entity, mode: "insensitive" };
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return jsonResponse({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
