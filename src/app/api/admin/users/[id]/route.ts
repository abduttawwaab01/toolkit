import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      projects: { take: 10, orderBy: { createdAt: "desc" } },
      subscription: true,
      _count: { select: { projects: true, files: true, aiUsageLogs: true } },
    },
  });

  if (!user) return jsonResponse({ error: "User not found" }, { status: 404 });

  const serialized = {
    ...user,
    storageUsed: user.storageUsed.toString(),
    storageLimit: user.storageLimit.toString(),
    projects: user.projects.map((p) => ({ ...p, size: p.size.toString() })),
    subscription: user.subscription ? { ...user.subscription } : null,
  };

  return jsonResponse(serialized);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  if (id === admin.userId) {
    return jsonResponse({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return jsonResponse({ error: "User not found" }, { status: 404 });
  if (user.role === "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return jsonResponse({ error: "Cannot delete the last admin user" }, { status: 400 });
    }
  }

  // Delete user (cascade deletes projects and files in DB)
  await db.user.delete({ where: { id } });

  await logAdminAction(admin.userId, "user.deleted", "user", id, { email: user.email, role: user.role }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ok: true });
}
