import { db } from "./db";

const WINDOW_SIZE_MS = 60_000;
const ROLE_LIMITS: Record<string, Record<string, number>> = {
  GUEST: { chat: 5, transcribe: 2, "generate-image": 2, export: 1, default: 10 },
  USER: { chat: 30, transcribe: 10, "generate-image": 10, export: 5, default: 60 },
  ADMIN: { chat: 200, transcribe: 100, "generate-image": 100, export: 50, default: 500 },
};

function getLimit(role: string, feature: string): number {
  const roleLimits = ROLE_LIMITS[role] || ROLE_LIMITS.USER;
  return roleLimits[feature] || roleLimits.default || 60;
}

export async function checkRateLimit(
  userId: string,
  feature: string,
  role: string = "USER",
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / WINDOW_SIZE_MS) * WINDOW_SIZE_MS);
  const key = `rate:${userId}:${feature}`;
  const limit = getLimit(role, feature);

  try {
    const record = await db.rateLimit.upsert({
      where: { key_windowStart: { key, windowStart } },
      update: { count: { increment: 1 } },
      create: { key, windowStart, count: 1 },
    });

    const remaining = Math.max(0, limit - record.count);
    const resetInMs = WINDOW_SIZE_MS - (now - windowStart.getTime());

    return {
      allowed: record.count <= limit,
      remaining,
      resetInMs,
    };
  } catch {
    return { allowed: true, remaining: 1, resetInMs: 0 };
  }
}

export function rateLimitMiddleware(handler: (req: Request, ...args: any[]) => Promise<Response>) {
  return async (req: Request, ...args: any[]): Promise<Response> => {
    const url = new URL(req.url);
    const feature = url.pathname.split("/").pop() || "default";

    const userId = (req as any).userId || "anonymous";
    const role = (req as any).userRole || "GUEST";

    const { allowed, remaining, resetInMs } = await checkRateLimit(userId, feature, role);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again shortly.", remaining, resetInMs }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.ceil(resetInMs / 1000)),
          },
        },
      );
    }

    const response = await handler(req, ...args);
    const headers = new Headers(response.headers);
    headers.set("X-RateLimit-Remaining", String(remaining));
    return new Response(response.body, { status: response.status, headers });
  };
}
