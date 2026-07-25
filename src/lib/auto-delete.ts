import { db } from "./db";

/**
 * Set the auto-delete timestamp on a file based on the user's role config.
 * Called after every upload.
 */
export async function scheduleAutoDelete(fileId: string): Promise<void> {
  const file = await db.projectFile.findUnique({
    where: { id: fileId },
    include: { user: true },
  });
  if (!file) return;

  // Get admin-configurable TTL for this user's role
  const config = await db.autoDeleteConfig.findUnique({ where: { role: file.user.role } });
  if (!config || !config.enabled) return;

  let ttlHours = 24;
  switch (file.category) {
    case "TEMP": ttlHours = config.tempTtlHours; break;
    case "RAW": ttlHours = config.processedTtlHours; break;
    case "PROCESSED": ttlHours = config.processedTtlHours; break;
    case "EXPORT": ttlHours = config.exportTtlHours; break;
  }

  const autoDeleteAt = new Date(Date.now() + ttlHours * 3600000);
  await db.projectFile.update({ where: { id: fileId }, data: { autoDeleteAt } });
}

/**
 * Called by the Inngest cron job every 5 minutes.
 * Finds expired files, soft-deletes them, logs the action.
 */
export async function purgeExpiredFiles(): Promise<number> {
  const expired = await db.projectFile.findMany({
    where: { autoDeleteAt: { lte: new Date() }, deletedAt: null },
  });

  if (expired.length === 0) return 0;

  // Soft-delete
  await db.projectFile.updateMany({
    where: { id: { in: expired.map((f) => f.id) } },
    data: { deletedAt: new Date() },
  });

  // Update storage usage + audit log
  for (const file of expired) {
    await db.user.update({ where: { id: file.userId }, data: { storageUsed: { decrement: file.size } } });
    await db.auditLog.create({
      data: {
        action: "file.auto-deleted",
        entity: "file",
        entityId: file.id,
        userId: file.userId,
        metadata: { originalName: file.originalName, size: file.size.toString(), category: file.category },
      },
    });
  }

  return expired.length;
}
