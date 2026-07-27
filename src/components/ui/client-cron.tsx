"use client";

import { useEffect } from "react";
import { startClientCron } from "@/lib/client-cron";

/**
 * Mount this component once anywhere in the app to start client-side
 * background task processing (cleanup, job queue, etc.).
 * Safe to mount in multiple places — only one interval runs.
 */
export function ClientCron() {
  useEffect(() => {
    startClientCron();
  }, []);
  return null;
}
