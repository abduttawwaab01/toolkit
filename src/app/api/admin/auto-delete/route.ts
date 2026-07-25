import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configs = await db.autoDeleteConfig.findMany();
  return jsonResponse(configs);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { role, tempTtlHours, processedTtlHours, exportTtlHours, enabled } = body;

  if (!role || typeof role !== "string") {
    return jsonResponse({ error: "Role is required" }, { status: 400 });
  }

  const config = await db.autoDeleteConfig.upsert({
    where: { role },
    update: {
      tempTtlHours: Math.max(1, Math.min(8760, Number(tempTtlHours) || 1)),
      processedTtlHours: Math.max(1, Math.min(8760, Number(processedTtlHours) || 24)),
      exportTtlHours: Math.max(1, Math.min(8760, Number(exportTtlHours) || 168)),
      enabled: Boolean(enabled),
    },
    create: {
      role,
      tempTtlHours: Math.max(1, Math.min(8760, Number(tempTtlHours) || 1)),
      processedTtlHours: Math.max(1, Math.min(8760, Number(processedTtlHours) || 24)),
      exportTtlHours: Math.max(1, Math.min(8760, Number(exportTtlHours) || 168)),
      enabled: Boolean(enabled),
    },
  });

  await logAdminAction(admin.userId, "auto-delete.updated", "config", config.id, { role, tempTtlHours, processedTtlHours, exportTtlHours, enabled }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(config);
}
