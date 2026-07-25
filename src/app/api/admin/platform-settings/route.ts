import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await db.platformSetting.findMany({ orderBy: { category: "asc" } });
  return jsonResponse(settings);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { settings } = body as { settings: Array<{ key: string; value: string }> };

  if (!settings || !Array.isArray(settings)) {
    return jsonResponse({ error: "settings array is required" }, { status: 400 });
  }

  for (const s of settings) {
    if (!s.key || typeof s.key !== "string") continue;
    await db.platformSetting.upsert({
      where: { key: s.key },
      update: { value: String(s.value).slice(0, 1000) },
      create: { key: s.key, value: String(s.value).slice(0, 1000), label: s.key, category: "general", type: "string" },
    });
  }

  await logAdminAction(admin.userId, "platform-settings.updated", "settings", undefined, { keys: settings.map((s) => s.key) }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true, updated: settings.length });
}
