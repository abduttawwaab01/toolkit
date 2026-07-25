import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const spendSchema = z.object({
  durationMinutes: z.number().min(0).default(0),
});

async function getExportLimits(role: string) {
  const getInt = async (key: string, fallback: number) => {
    try {
      const s = await prisma.platformSetting.findUnique({ where: { key } });
      return s ? parseInt(s.value, 10) || fallback : fallback;
    } catch { return fallback; }
  };
  return {
    freeExportsPerDay: await getInt(`export_limit_${role}_freePerDay`, role === "GUEST" ? 1 : role === "ADMIN" ? 9999 : 3),
    freeExportsPerWeek: await getInt(`export_limit_${role}_freePerWeek`, role === "GUEST" ? 3 : role === "ADMIN" ? 9999 : 15),
    freeExportsPerMonth: await getInt(`export_limit_${role}_freePerMonth`, role === "GUEST" ? 5 : role === "ADMIN" ? 9999 : 50),
    freeExportsPerYear: await getInt(`export_limit_${role}_freePerYear`, role === "GUEST" ? 30 : role === "ADMIN" ? 9999 : 500),
    creditsPerExport: await getInt(`export_limit_${role}_creditsPerExport`, role === "ADMIN" ? 0 : 1),
    creditsPerMinute: await getInt(`export_limit_${role}_creditsPerMinute`, role === "ADMIN" ? 0 : 1),
  };
}

async function countExportsSince(userId: string, since: Date): Promise<number> {
  try {
    return await prisma.creditSpendLog.count({
      where: { userId, feature: "export", createdAt: { gte: since } },
    });
  } catch { return 0; }
}

async function checkExportLimits(userId: string, role: string) {
  const limits = await getExportLimits(role);
  const now = new Date();

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [dailyUsed, weeklyUsed, monthlyUsed, yearlyUsed] = await Promise.all([
    countExportsSince(userId, dayStart),
    countExportsSince(userId, weekStart),
    countExportsSince(userId, monthStart),
    countExportsSince(userId, yearStart),
  ]);

  if (dailyUsed < limits.freeExportsPerDay) return { withinFreeLimit: true };
  if (weeklyUsed < limits.freeExportsPerWeek) return { withinFreeLimit: true };
  if (monthlyUsed < limits.freeExportsPerMonth) return { withinFreeLimit: true };
  if (yearlyUsed < limits.freeExportsPerYear) return { withinFreeLimit: true };

  return {
    withinFreeLimit: false,
    creditsNeeded: limits.creditsPerExport + Math.ceil(limits.creditsPerMinute * 1),
    creditsPerExport: limits.creditsPerExport,
    creditsPerMinute: limits.creditsPerMinute,
    dailyRemaining: Math.max(0, limits.freeExportsPerDay - dailyUsed),
    weeklyRemaining: Math.max(0, limits.freeExportsPerWeek - weeklyUsed),
    monthlyRemaining: Math.max(0, limits.freeExportsPerMonth - monthlyUsed),
    yearlyRemaining: Math.max(0, limits.freeExportsPerYear - yearlyUsed),
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = spendSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Invalid input" }, { status: 400 });
    }

    const { durationMinutes } = parsed.data;
    const role = userRole || "GUEST";
    const limits = await checkExportLimits(userId, role);

    if (limits.withinFreeLimit) {
      await prisma.creditSpendLog.create({
        data: { userId, feature: "export", credits: 0, reason: "Free export", balance: 0 },
      });
      return jsonResponse({ success: true, free: true, message: "Free export used" });
    }

    const exportLimits = await getExportLimits(role);
    const creditsNeeded = exportLimits.creditsPerExport + Math.ceil(exportLimits.creditsPerMinute * Math.max(1, Math.ceil(durationMinutes)));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.creditsBalance < creditsNeeded) {
      return jsonResponse({
        success: false,
        error: "Insufficient credits",
        creditsNeeded,
        currentBalance: user?.creditsBalance || 0,
        freeExportsExhausted: true,
      }, { status: 402 });
    }

    const updated = await prisma.user.updateMany({
      where: { id: userId, creditsBalance: { gte: creditsNeeded } },
      data: { creditsBalance: { decrement: creditsNeeded } },
    });

    if (updated.count === 0) {
      return jsonResponse({ success: false, error: "Insufficient credits (race condition)" }, { status: 402 });
    }

    await prisma.creditSpendLog.create({
      data: {
        userId,
        feature: "export",
        credits: creditsNeeded,
        reason: `Export: ${durationMinutes}min video`,
        balance: (user.creditsBalance || 0) - creditsNeeded,
      },
    });

    return jsonResponse({
      success: true,
      free: false,
      creditsSpent: creditsNeeded,
      newBalance: (user.creditsBalance || 0) - creditsNeeded,
    });
  } catch {
    return jsonResponse({ error: "Failed to process export" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = await checkExportLimits(userId, userRole || "GUEST");
  return jsonResponse(limits);
}
