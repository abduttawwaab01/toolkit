import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

const ALLOWED_SORT_FIELDS = ["createdAt", "lastActiveAt", "email", "name", "role", "storageUsed", "creditsBalance"];

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const suspended = searchParams.get("suspended");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role && ["GUEST", "USER", "ADMIN"].includes(role)) where.role = role;
  if (suspended !== null && suspended !== undefined && suspended !== "") {
    where.isSuspended = suspended === "true";
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { [safeSortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, email: true, name: true, image: true, role: true,
        creditsBalance: true, storageUsed: true, storageLimit: true,
        maxProjects: true, isSuspended: true, suspendedReason: true,
        adminNotes: true, lastLoginIp: true, createdAt: true, lastActiveAt: true,
        _count: { select: { projects: true, files: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  // Serialize BigInt fields to strings for JSON transport
  const serialized = users.map((u) => ({
    ...u,
    storageUsed: u.storageUsed.toString(),
    storageLimit: u.storageLimit.toString(),
  }));

  return jsonResponse({ users: serialized, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, role, isSuspended, suspendedReason, adminNotes, creditsBalance, storageLimit, maxProjects } = body;

  if (!userId || typeof userId !== "string") {
    return jsonResponse({ error: "userId is required" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (role !== undefined) {
    if (!["GUEST", "USER", "ADMIN"].includes(role)) {
      return jsonResponse({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = role;
  }
  if (isSuspended !== undefined) updateData.isSuspended = Boolean(isSuspended);
  if (suspendedReason !== undefined) updateData.suspendedReason = suspendedReason || null;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes || null;
  if (creditsBalance !== undefined) updateData.creditsBalance = Math.max(0, Math.min(9999999, Number(creditsBalance)));
  if (storageLimit !== undefined) updateData.storageLimit = BigInt(Math.max(0, Number(storageLimit)));
  if (maxProjects !== undefined) updateData.maxProjects = maxProjects === null ? null : Math.max(0, Math.min(99999, Number(maxProjects)));

  const user = await db.user.update({ where: { id: userId }, data: updateData });

  await logAdminAction(admin.userId, "user.updated", "user", userId, { ...updateData, storageLimit: updateData.storageLimit?.toString() }, req.headers.get("x-forwarded-for") || undefined);

  return jsonResponse({ ...user, storageUsed: user.storageUsed.toString(), storageLimit: user.storageLimit.toString() });
}
