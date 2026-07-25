import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { jsonResponse } from "@/lib/json";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { redis } from "@/lib/redis";

const prisma = new PrismaClient();

const spendSchema = z.object({
  durationMinutes: z.number().min(0).default(0),
});

async function checkExportLimits(userId: string, role: string) {
  const rule = await prisma.rateLimitRule.findUnique({ where: { role } });
  if (!rule) return { withinFreeLimit: true };

  const now = new Date();

  // Check daily
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyKey = `export:daily:${userId}`;
  const dailyUsed = (await redis.get<number>(dailyKey)) ?? 0;
  if (dailyUsed < rule.freeExportsPerDay) return { withinFreeLimit: true };

  // Check weekly (Monday-based)
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weeklyKey = `export:weekly:${userId}`;
  const weeklyUsed = (await redis.get<number>(weeklyKey)) ?? 0;
  if (weeklyUsed < rule.freeExportsPerWeek) return { withinFreeLimit: true };

  // Check monthly
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyKey = `export:monthly:${userId}`;
  const monthlyUsed = (await redis.get<number>(monthlyKey)) ?? 0;
  if (monthlyUsed < rule.freeExportsPerMonth) return { withinFreeLimit: true };

  // Check yearly
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearlyKey = `export:yearly:${userId}`;
  const yearlyUsed = (await redis.get<number>(yearlyKey)) ?? 0;
  if (yearlyUsed < rule.freeExportsPerYear) return { withinFreeLimit: true };

  // All free limits exhausted — calculate credit cost
  const creditsNeeded = rule.creditsPerExport + Math.ceil(rule.creditsPerMinute * Math.max(0, Math.ceil(1)));
  return {
    withinFreeLimit: false,
    creditsNeeded: rule.creditsPerExport + Math.ceil(rule.creditsPerMinute * 1),
    creditsPerExport: rule.creditsPerExport,
    creditsPerMinute: rule.creditsPerMinute,
    dailyRemaining: Math.max(0, rule.freeExportsPerDay - dailyUsed),
    weeklyRemaining: Math.max(0, rule.freeExportsPerWeek - weeklyUsed),
    monthlyRemaining: Math.max(0, rule.freeExportsPerMonth - monthlyUsed),
    yearlyRemaining: Math.max(0, rule.freeExportsPerYear - yearlyUsed),
  };
}

async function incrementExportCounters(userId: string) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const dayTTL = Math.floor((86400000 - (now.getTime() - dayStart.getTime())) / 1000);
  const weekTTL = Math.floor((7 * 86400000 - (now.getTime() - weekStart.getTime())) / 1000);
  const monthTTL = Math.floor((31 * 86400000 - (now.getTime() - monthStart.getTime())) / 1000);
  const yearTTL = Math.floor((366 * 86400000 - (now.getTime() - yearStart.getTime())) / 1000);

  const dailyKey = `export:daily:${userId}`;
  const weeklyKey = `export:weekly:${userId}`;
  const monthlyKey = `export:monthly:${userId}`;
  const yearlyKey = `export:yearly:${userId}`;

  await Promise.all([
    redis.incr(dailyKey).then(() => redis.expire(dailyKey, Math.max(60, dayTTL))),
    redis.incr(weeklyKey).then(() => redis.expire(weeklyKey, Math.max(60, weekTTL))),
    redis.incr(monthlyKey).then(() => redis.expire(monthlyKey, Math.max(60, monthTTL))),
    redis.incr(yearlyKey).then(() => redis.expire(yearlyKey, Math.max(60, yearTTL))),
  ]);
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
      // Free export — just increment counters
      await incrementExportCounters(userId);
      return jsonResponse({
        success: true,
        free: true,
        message: "Free export used",
      });
    }

    // Calculate credits needed based on duration
    const rule = await prisma.rateLimitRule.findUnique({ where: { role } });
    const creditsNeeded = (rule?.creditsPerExport || 1) + Math.ceil((rule?.creditsPerMinute || 1) * Math.max(1, Math.ceil(durationMinutes)));

    // Check user balance
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

    // Atomic: decrement credits + increment export counters
    const updated = await prisma.user.updateMany({
      where: { id: userId, creditsBalance: { gte: creditsNeeded } },
      data: { creditsBalance: { decrement: creditsNeeded } },
    });

    if (updated.count === 0) {
      return jsonResponse({ success: false, error: "Insufficient credits (race condition)" }, { status: 402 });
    }

    await incrementExportCounters(userId);

    // Log the spend
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
