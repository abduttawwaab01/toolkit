import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

const VALID_SEVERITIES = ["info", "warning", "critical", "success"];

export async function GET() {
  const announcements = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return jsonResponse(announcements);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, content, severity, startsAt, endsAt } = body;

  if (!title || !content) {
    return jsonResponse({ error: "title and content are required" }, { status: 400 });
  }

  const safeSeverity = VALID_SEVERITIES.includes(severity) ? severity : "info";

  const announcement = await db.announcement.create({
    data: {
      title: String(title).slice(0, 200),
      content: String(content).slice(0, 5000),
      severity: safeSeverity,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });

  await logAdminAction(admin.userId, "announcement.created", "announcement", announcement.id, { title, severity: safeSeverity }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(announcement);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, title, content, severity, isActive, startsAt, endsAt } = body;

  if (!id || typeof id !== "string") {
    return jsonResponse({ error: "id is required" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (title !== undefined) updateData.title = String(title).slice(0, 200);
  if (content !== undefined) updateData.content = String(content).slice(0, 5000);
  if (severity !== undefined) updateData.severity = VALID_SEVERITIES.includes(severity) ? severity : "info";
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);
  if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
  if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

  const announcement = await db.announcement.update({ where: { id }, data: updateData });

  await logAdminAction(admin.userId, "announcement.updated", "announcement", id, updateData, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(announcement);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonResponse({ error: "id is required" }, { status: 400 });

  await db.announcement.delete({ where: { id } });

  await logAdminAction(admin.userId, "announcement.deleted", "announcement", id, undefined, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true });
}
