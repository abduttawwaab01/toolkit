import { db } from "./db";
import { checkRateLimit } from "./rate-limit";

export interface AuthResult {
  userId: string;
  role: string;
  authorized: boolean;
  error?: string;
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    const apiKey = await db.apiKey.findUnique({ where: { key } });

    if (!apiKey) return { userId: "", role: "", authorized: false, error: "Invalid API key" };
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { userId: "", role: "", authorized: false, error: "API key expired" };

    await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });

    const user = await db.user.findUnique({ where: { id: apiKey.userId } });
    if (!user) return { userId: "", role: "", authorized: false, error: "User not found" };

    return { userId: user.id, role: user.role, authorized: true };
  }

  const sessionId = req.headers.get("x-session-id");
  if (sessionId) {
    return { userId: sessionId, role: "USER", authorized: true };
  }

  return { userId: "anonymous", role: "GUEST", authorized: true };
}

export function withApiAuth(handler: (req: Request, auth: AuthResult, ...args: any[]) => Promise<Response>) {
  return async (req: Request, ...args: any[]): Promise<Response> => {
    const auth = await authenticateRequest(req);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return handler(req, auth, ...args);
  };
}

export async function requireRole(auth: AuthResult, allowedRoles: string[]): Promise<boolean> {
  return allowedRoles.includes(auth.role);
}
