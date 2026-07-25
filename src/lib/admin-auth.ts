import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import { db } from "./db";

export interface AdminSession {
  userId: string;
  email: string;
  role: string;
}

/**
 * Verify the current user is an ADMIN. Returns null if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const role = (session.user as any).role;
    const id = (session.user as any).id;
    if (role !== "ADMIN" || !id) return null;
    return { userId: id, email: session.user.email || "", role };
  } catch {
    return null;
  }
}

/**
 * Log an admin action to the audit trail. Failures are silently ignored
 * so audit logging never breaks the primary operation.
 */
export async function logAdminAction(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>,
  ip?: string,
) {
  try {
    await db.auditLog.create({
      data: { userId, action, entity, entityId, metadata, ipAddress: ip },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
