import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { db } from "./db";

/**
 * Multi-tier rate limiting using Upstash (serverless, free).
 * Each role has its own limit, configurable from admin dashboard.
 * Limits are read from the database (RateLimitRule model).
 */
const limiters = new Map<string, Ratelimit>();
const MAX_LIMITER_CACHE = 100;

function getLimiter(requestsPerMinute: number) {
  const key = `rl:${requestsPerMinute}`;
  if (!limiters.has(key)) {
    // Evict oldest entries if cache is full
    if (limiters.size >= MAX_LIMITER_CACHE) {
      const firstKey = limiters.keys().next().value;
      if (firstKey) limiters.delete(firstKey);
    }
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requestsPerMinute, "1 m"),
        analytics: true,
        prefix: key,
      }),
    );
  }
  return limiters.get(key)!;
}

// Hourly rate limiter cache
const hourlyLimiters = new Map<string, Ratelimit>();

function getHourlyLimiter(requestsPerHour: number) {
  const key = `rlh:${requestsPerHour}`;
  if (!hourlyLimiters.has(key)) {
    if (hourlyLimiters.size >= MAX_LIMITER_CACHE) {
      const firstKey = hourlyLimiters.keys().next().value;
      if (firstKey) hourlyLimiters.delete(firstKey);
    }
    hourlyLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requestsPerHour, "1 h"),
        analytics: true,
        prefix: key,
      }),
    );
  }
  return hourlyLimiters.get(key)!;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Default limits used as fallback when DB is unavailable.
 */
const DEFAULTS: Record<string, { requestsPerMinute: number; requestsPerHour: number; concurrentJobs: number; maxFileSize: bigint; maxStoragePerUser: bigint; maxProjects: number; maxDurationMinutes: number; maxResolution: string; exportQuality: string; exportWatermark: boolean; aiCreditsPerDay: number; allowedMimeTypes: string | null }> = {
  GUEST: { requestsPerMinute: 10, requestsPerHour: 100, concurrentJobs: 1, maxFileSize: BigInt(104857600), maxStoragePerUser: BigInt(104857600), maxProjects: 2, maxDurationMinutes: 10, maxResolution: "720p", exportQuality: "standard", exportWatermark: true, aiCreditsPerDay: 3, allowedMimeTypes: null },
  USER: { requestsPerMinute: 60, requestsPerHour: 1000, concurrentJobs: 3, maxFileSize: BigInt(524288000), maxStoragePerUser: BigInt(1073741824), maxProjects: 25, maxDurationMinutes: 60, maxResolution: "1080p", exportQuality: "high", exportWatermark: false, aiCreditsPerDay: 10, allowedMimeTypes: null },
  ADMIN: { requestsPerMinute: 1000, requestsPerHour: 50000, concurrentJobs: 100, maxFileSize: BigInt("10737418240"), maxStoragePerUser: BigInt("1099511627776"), maxProjects: 9999, maxDurationMinutes: 9999, maxResolution: "8K", exportQuality: "lossless", exportWatermark: false, aiCreditsPerDay: 1000, allowedMimeTypes: null },
};

/**
 * Get rate limit rules for a role from the database, with hardcoded fallbacks.
 */
export async function getRateLimitForRole(role: string) {
  try {
    const rule = await db.rateLimitRule.findUnique({ where: { role } });
    if (rule) return rule;
  } catch {
    // DB may not be available during build/seed
  }
  return DEFAULTS[role] || DEFAULTS.GUEST;
}

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 * Enforces BOTH per-minute AND per-hour limits from the database.
 */
export async function checkRateLimit(
  identifier: string,
  role: string = "GUEST",
): Promise<RateLimitResult> {
  const rule = await getRateLimitForRole(role);

  // Check per-minute limit
  const minuteLimiter = getLimiter(rule.requestsPerMinute);
  const minuteResult = await minuteLimiter.limit(identifier);
  if (!minuteResult.success) {
    return { success: false, remaining: minuteResult.remaining, reset: minuteResult.reset };
  }

  // Check per-hour limit
  const hourlyLimiter = getHourlyLimiter(rule.requestsPerHour);
  const hourlyResult = await hourlyLimiter.limit(`hourly:${identifier}`);
  if (!hourlyResult.success) {
    return { success: false, remaining: hourlyResult.remaining, reset: hourlyResult.reset };
  }

  return {
    success: true,
    remaining: Math.min(minuteResult.remaining, hourlyResult.remaining),
    reset: Math.max(minuteResult.reset, hourlyResult.reset),
  };
}

/**
 * Check AI credit availability using per-role limits from the database.
 */
export async function checkAiCredits(userId: string, role: string = "USER"): Promise<{ hasCredits: boolean; remaining: number }> {
  const rule = await getRateLimitForRole(role);
  const key = `credits:daily:${userId}`;
  const daily = await redis.get<number>(key);
  const limit = rule.aiCreditsPerDay;
  const used = daily ?? 0;
  return { hasCredits: used < limit, remaining: Math.max(0, limit - used) };
}

export async function incrementAiUsage(userId: string) {
  const key = `credits:daily:${userId}`;
  await redis.incr(key);
  await redis.expire(key, 86400);
}

/**
 * Get a platform setting by key from the database.
 */
export async function getPlatformSetting(key: string): Promise<string | null> {
  try {
    const setting = await db.platformSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Get all platform settings as a key-value record.
 */
export async function getAllPlatformSettings(): Promise<Record<string, string>> {
  try {
    const settings = await db.platformSetting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } catch {
    return {};
  }
}

/**
 * Get export credit costs for a role.
 */
export async function getExportCreditCosts(role: string): Promise<{ creditsPerExport: number; creditsPerMinute: number }> {
  try {
    const rule = await db.rateLimitRule.findUnique({ where: { role } });
    if (rule) return { creditsPerExport: rule.creditsPerExport, creditsPerMinute: rule.creditsPerMinute };
  } catch {
    // DB may not be available
  }
  return { creditsPerExport: 1, creditsPerMinute: 1 };
}
