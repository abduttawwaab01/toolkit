import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const templates = await db.documentTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse(templates);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, category, format, isPublic, content } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return jsonResponse({ error: "Template name is required" }, { status: 400 });
  }

  const template = await db.documentTemplate.create({
    data: {
      name: name.trim(),
      description: description || null,
      category: category || "general",
      format: format || "rich",
      isPublic: isPublic !== false,
      content: content || {},
    },
  });

  await logAdminAction(admin.userId, "template.created", "document-template", template.id, { name: template.name }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(template);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, name, description, category, format, isPublic } = body;
  if (!id) return jsonResponse({ error: "Template id required" }, { status: 400 });

  const existing = await db.documentTemplate.findUnique({ where: { id } });
  if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (description !== undefined) updateData.description = description || null;
  if (category !== undefined) updateData.category = String(category);
  if (format !== undefined) updateData.format = String(format);
  if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

  const template = await db.documentTemplate.update({ where: { id }, data: updateData });

  await logAdminAction(admin.userId, "template.updated", "document-template", id, updateData, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse(template);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return jsonResponse({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "Template id required" }, { status: 400 });

  const existing = await db.documentTemplate.findUnique({ where: { id } });
  if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

  await db.documentTemplate.delete({ where: { id } });

  await logAdminAction(admin.userId, "template.deleted", "document-template", id, { name: existing.name }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true });
}
