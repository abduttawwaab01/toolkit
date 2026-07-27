import { fork } from "node:child_process";
import { join } from "node:path";
import type { ChildProcess } from "node:child_process";

export interface DenoiseProgress {
  phase: "loading" | "processing";
  chunk: number;
  total: number;
}

export interface DenoiseResult {
  audioBuffer: Buffer;
  stats: {
    durationMs: number;
    sampleRate: number;
    channels: number;
  };
}

interface WorkerMessage {
  type: "ready" | "progress" | "result" | "error";
  phase?: string;
  chunk?: number;
  total?: number;
  audioData?: string;
  stats?: { durationMs: number; sampleRate: number; channels: number };
  message?: string;
  stack?: string;
}

let worker: ChildProcess | null = null;
let workerReqId = 0;

function getWorker(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    if (worker && !worker.killed) return resolve(worker);

    const workerPath = join(process.cwd(), "src/lib/audio-engine/denoise-worker.mjs");

    try {
      worker = fork(workerPath, [], {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
        execArgv: [],
      });

      const timeout = setTimeout(() => {
        reject(new Error("Denoise worker failed to initialize within 60s"));
        worker?.kill();
        worker = null;
      }, 60_000);

      worker.on("message", (msg: WorkerMessage) => {
        if (msg.type === "ready") {
          clearTimeout(timeout);
          resolve(worker!);
        }
      });

      worker.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
        worker = null;
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Denoise worker exited with code ${code}`);
        }
        worker = null;
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function denoiseWithDeepFilterNet(
  audioBuffer: Buffer,
  onProgress?: (p: DenoiseProgress) => void,
): Promise<DenoiseResult> {
  onProgress?.({ phase: "loading", chunk: 0, total: 1 });

  const proc = await getWorker();
  const id = ++workerReqId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Denoise timed out after 5 minutes"));
      worker?.kill();
      worker = null;
    }, 300_000);

    const handler = (msg: WorkerMessage) => {
      if (msg.type === "progress") {
        onProgress?.({
          phase: (msg.phase as "loading" | "processing") || "processing",
          chunk: msg.chunk ?? 0,
          total: msg.total ?? 1,
        });
      } else if (msg.type === "result" && msg.audioData) {
        clearTimeout(timeout);
        proc.off("message", handler);
        resolve({
          audioBuffer: Buffer.from(msg.audioData, "base64"),
          stats: msg.stats || { durationMs: 0, sampleRate: 48000, channels: 1 },
        });
      } else if (msg.type === "error") {
        clearTimeout(timeout);
        proc.off("message", handler);
        reject(new Error(msg.message || "Denoise worker error"));
      }
    };

    proc.on("message", handler);
    proc.send({ type: "denoise", audioData: audioBuffer.toString("base64") });
  });
}
