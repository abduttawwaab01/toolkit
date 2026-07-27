/**
 * Client-side background job scheduler.
 * Replaces Vercel cron by running maintenance tasks from the browser
 * while the page is open and visible. Uses PlatformSetting locks on the
 * server to prevent concurrent runs, so multiple browser tabs are safe.
 */

const INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
let started = false;

type Task = { path: string; label: string };

const TASKS: Task[] = [
  { path: "/api/cron/process-jobs", label: "process-jobs" },
  { path: "/api/cron/cleanup", label: "cleanup" },
];

async function runTask(task: Task): Promise<void> {
  try {
    const res = await fetch(task.path, { method: "GET" });
    if (!res.ok) {
      console.debug(`[client-cron] ${task.label} returned ${res.status}`);
    }
  } catch {
    // Network errors are expected when offline; ignore silently
  }
}

async function runAllTasks(): Promise<void> {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  await Promise.allSettled(TASKS.map(runTask));
}

/**
 * Starts a client-side interval that periodically triggers background jobs
 * (cleanup, job processing). Designed as a singleton — only one interval
 * runs regardless of how many times this is called.
 *
 * Call once at the app root or in any page where background processing is desired.
 */
export function startClientCron(): void {
  if (started) return;
  started = true;

  if (typeof window === "undefined") return;

  // Run once immediately on mount
  runAllTasks();

  // Then repeat on interval
  setInterval(runAllTasks, INTERVAL_MS);

  // Also run when the page becomes visible again (e.g. user switches back)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      runAllTasks();
    }
  });
}
