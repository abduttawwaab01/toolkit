import { fork } from "node:child_process";
import { join } from "node:path";
import type { ChildProcess } from "node:child_process";

export interface DemucsProgress {
  chunk: number;
  total: number;
  phase: "loading" | "processing" | "writing";
}

export interface SeparatedStems {
  vocals: Buffer;
  drums: Buffer;
  bass: Buffer;
  other: Buffer;
  accompaniment?: Buffer;
}

interface WorkerMessage {
  type: "ready" | "progress" | "result" | "error";
  chunk?: number;
  total?: number;
  data?: Record<string, string>;
  message?: string;
  stack?: string;
}

interface PoolWorker {
  process: ChildProcess;
  busy: boolean;
  id: number;
  lastUsed: number;
}

const MIN_WORKERS = 1;
const MAX_WORKERS = 3;
const IDLE_TIMEOUT = 300_000;
const INIT_TIMEOUT = 30_000;
const SEPARATION_TIMEOUT = 600_000;

let pool: PoolWorker[] = [];
let nextId = 0;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const targetCount = Math.max(MIN_WORKERS, Math.ceil(pool.filter((w) => w.busy).length));
    const toRemove = pool.filter((w) => !w.busy && now - w.lastUsed > IDLE_TIMEOUT);
    while (pool.length - toRemove.length > targetCount && toRemove.length > 0) {
      const w = toRemove.shift()!;
      w.process.kill();
      pool = pool.filter((p) => p.id !== w.id);
    }
  }, 60_000);
}

function createWorker(): Promise<PoolWorker> {
  return new Promise((resolve, reject) => {
    const workerPath = join(process.cwd(), "src/lib/audio-engine/demucs-worker.mjs");
    const proc = fork(workerPath, [], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      execArgv: [],
    });

    const pw: PoolWorker = { process: proc, busy: false, id: nextId++, lastUsed: Date.now() };

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Demucs worker failed to initialize within 30s"));
    }, INIT_TIMEOUT);

    proc.on("message", (msg: WorkerMessage) => {
      if (msg.type === "ready") {
        clearTimeout(timeout);
        resolve(pw);
      }
    });

    proc.on("error", () => {
      clearTimeout(timeout);
      pool = pool.filter((p) => p.id !== pw.id);
      reject(new Error("Demucs worker process error"));
    });

    proc.on("exit", () => {
      pool = pool.filter((p) => p.id !== pw.id);
    });
  });
}

async function getWorker(): Promise<PoolWorker> {
  startCleanup();
  const available = pool.find((w) => !w.busy);
  if (available) {
    available.busy = true;
    available.lastUsed = Date.now();
    return available;
  }
  if (pool.length < MAX_WORKERS) {
    const w = await createWorker();
    w.busy = true;
    pool.push(w);
    return w;
  }
  return new Promise((resolve) => {
    const check = setInterval(() => {
      const av = pool.find((w) => !w.busy);
      if (av) {
        clearInterval(check);
        av.busy = true;
        av.lastUsed = Date.now();
        resolve(av);
      }
    }, 500);
  });
}

function releaseWorker(pw: PoolWorker) {
  pw.busy = false;
  pw.lastUsed = Date.now();
}

export async function separateWithDemucs(
  audioBuffer: Buffer,
  onProgress?: (p: DemucsProgress) => void,
  mode: "2" | "4" = "4",
): Promise<SeparatedStems> {
  onProgress?.({ chunk: 0, total: 1, phase: "loading" });

  const pw = await getWorker();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      releaseWorker(pw);
      reject(new Error("Demucs separation timed out after 10 minutes"));
    }, SEPARATION_TIMEOUT);

    const handler = (msg: WorkerMessage) => {
      if (msg.type === "progress") {
        onProgress?.({ chunk: msg.chunk ?? 0, total: msg.total ?? 1, phase: "processing" });
      } else if (msg.type === "result" && msg.data) {
        clearTimeout(timeout);
        pw.process.off("message", handler);
        releaseWorker(pw);
        const stems: SeparatedStems = {
          vocals: Buffer.from(msg.data.vocals, "base64"),
          drums: Buffer.from(msg.data.drums, "base64"),
          bass: Buffer.from(msg.data.bass, "base64"),
          other: Buffer.from(msg.data.other, "base64"),
        };
        if (msg.data.accompaniment) {
          stems.accompaniment = Buffer.from(msg.data.accompaniment, "base64");
        }
        resolve(stems);
      } else if (msg.type === "error") {
        clearTimeout(timeout);
        pw.process.off("message", handler);
        releaseWorker(pw);
        reject(new Error(msg.message || "Demucs worker error"));
      }
    };

    pw.process.on("message", handler);
    pw.process.send({ type: "separate", audioData: audioBuffer.toString("base64"), mode });
  });
}

export async function terminateAllWorkers(): Promise<void> {
  for (const w of pool) {
    w.process.kill();
  }
  pool = [];
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
