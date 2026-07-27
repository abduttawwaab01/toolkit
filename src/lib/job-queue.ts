import { db } from "./db";
import type { Prisma } from "@prisma/client";

type JobType = "cleanup" | "export" | "ai-process" | "email-digest" | "stem-separation";
type JobStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

type JobPayload = Record<string, unknown>;

export async function enqueueJob(
  type: JobType,
  payload: JobPayload,
  opts?: { scheduledAt?: Date; priority?: number; maxRetries?: number },
): Promise<{ id: string }> {
  const job = await db.jobQueue.create({
    data: {
      type,
      payload: payload as Prisma.InputJsonValue,
      priority: opts?.priority ?? 0,
      scheduledAt: opts?.scheduledAt ?? new Date(),
      maxRetries: opts?.maxRetries ?? 3,
    },
  });
  return { id: job.id };
}

export async function processPendingJobs(): Promise<number> {
  const lockKey = "last_job_queue_run";
  const lockSetting = await db.platformSetting.findUnique({ where: { key: lockKey } });
  const lastRun = lockSetting ? parseInt(lockSetting.value, 10) || 0 : 0;
  if (Date.now() - lastRun < 60_000) return 0;

  const jobs = await db.jobQueue.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: new Date() },
      retryCount: { lt: db.jobQueue.fields.maxRetries },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 5,
  });

  let processed = 0;

  for (const job of jobs) {
    try {
      await db.jobQueue.update({
        where: { id: job.id },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      switch (job.type) {
        case "cleanup":
          const { purgeExpiredFiles } = await import("./auto-delete");
          await purgeExpiredFiles();
          break;
        case "export":
          break;
        case "ai-process":
        case "stem-separation": {
          const payload = job.payload as Record<string, unknown>;
          if (payload.type === "stem-separation" || job.type === "stem-separation") {
            const { separateWithDemucs } = await import("@/lib/audio-engine/demucs-server");
            const audioData = payload.audioData as string | undefined;
            const mode = (payload.mode as string) || "4";
            if (audioData) {
              const audioBuffer = Buffer.from(audioData, "base64");
              await separateWithDemucs(audioBuffer, undefined, mode as "2" | "4");
            }
          }
          break;
        }
      }

      await db.jobQueue.update({
        where: { id: job.id },
        data: { status: "DONE", completedAt: new Date() },
      });
      processed++;
    } catch (err: any) {
      const newRetryCount = (job.retryCount ?? 0) + 1;
      const newStatus: JobStatus = newRetryCount >= (job.maxRetries ?? 3) ? "FAILED" : "PENDING";
      await db.jobQueue.update({
        where: { id: job.id },
        data: {
          status: newStatus,
          error: err.message || "Unknown error",
          retryCount: newRetryCount,
          startedAt: newStatus === "PENDING" ? null : job.startedAt,
        },
      });
    }
  }

  await db.platformSetting.upsert({
    where: { key: lockKey },
    update: { value: String(Date.now()) },
    create: { key: lockKey, value: String(Date.now()), label: "Last Job Queue Run", category: "system", type: "number" },
  });

  return processed;
}

export async function getJobStatus(jobId: string): Promise<{ status: JobStatus; error?: string } | null> {
  const job = await db.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return { status: job.status as JobStatus, error: job.error ?? undefined };
}
