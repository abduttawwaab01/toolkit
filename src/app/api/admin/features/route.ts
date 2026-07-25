import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const features = await db.featureToggle.findMany();
  return jsonResponse(features);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, enabled, roles } = await req.json();
  if (!key || typeof key !== "string") {
    return jsonResponse({ error: "Feature key required" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (enabled !== undefined) updateData.enabled = Boolean(enabled);
  if (roles !== undefined) updateData.roles = typeof roles === "string" ? roles : JSON.stringify(roles);

  const feature = await db.featureToggle.upsert({
    where: { key },
    update: updateData,
    create: { key, label: key, ...updateData },
  });

  await logAdminAction(admin.userId, "feature.toggled", "feature", feature.id, { key, enabled, roles }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(feature);
}
