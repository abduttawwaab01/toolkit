import { db } from "./db";
import { purgeExpiredFiles } from "./auto-delete";

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const LOCK_KEY = "last_cleanup_run";

export async function maybeRunCleanup(): Promise<void> {
  try {
    const setting = await db.platformSetting.findUnique({ where: { key: LOCK_KEY } });
    const lastRun = setting ? parseInt(setting.value, 10) || 0 : 0;
    const now = Date.now();

    if (now - lastRun < CLEANUP_INTERVAL_MS) return;

    await purgeExpiredFiles();

    await db.platformSetting.upsert({
      where: { key: LOCK_KEY },
      update: { value: String(now) },
      create: { key: LOCK_KEY, value: String(now), label: "Last Cleanup Run", category: "system", type: "number" },
    });
  } catch {
    // fail silently — cleanup is best-effort
  }
}
