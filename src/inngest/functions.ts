import { inngest } from "./client";
import { purgeExpiredFiles } from "@/lib/auto-delete";

/**
 * Auto-delete cron: runs every 5 minutes.
 * Purges files past their TTL, frees storage, logs actions.
 */
export const autoDeleteCron = inngest.createFunction(
  { id: "auto-delete-files", name: "Auto-Delete Expired Files" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const deleted = await step.run("purge-expired-files", async () => {
      return purgeExpiredFiles();
    });

    if (deleted > 0) {
      await step.run("log-cleanup", async () => {
        console.log(`🧹 Auto-delete: purged ${deleted} expired files`);
      });
    }

    return { deleted };
  },
);

/**
 * Send expiry warning to user (24h before deletion).
 */
export const sendExpiryWarning = inngest.createFunction(
  { id: "send-expiry-warning", name: "Send File Expiry Warning" },
  { event: "file/expiry-warning" },
  async ({ event, step }) => {
    const { fileId, userId, fileName, hoursUntilDelete } = event.data;

    await step.run("send-notification", async () => {
      // TODO: send email / in-app notification
      console.log(`⏰ Warning: ${fileName} (${fileId}) will be deleted in ${hoursUntilDelete}h for user ${userId}`);
    });
  },
);
