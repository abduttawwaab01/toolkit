import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [userCount, activeUsers, storageAgg, aiCalls, filesCount, guestCount, suspendedCount, totalUsers] = await Promise.all([
    db.user.count({ where: { role: { not: "GUEST" } } }),
    db.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 86400000 * 7) } } }),
    db.projectFile.aggregate({ _sum: { size: true } }),
    db.aiUsageLog.count(),
    db.projectFile.count({ where: { deletedAt: null } }),
    db.user.count({ where: { role: "GUEST" } }),
    db.user.count({ where: { isSuspended: true } }),
    db.user.count(),
  ]);

  return jsonResponse({
    users: { total: totalUsers, registered: userCount, guests: guestCount, active7Days: activeUsers, suspended: suspendedCount },
    storage: { used: Number(storageAgg._sum.size ?? 0) },
    aiCalls,
    files: filesCount,
  });
}
