/**
 * FFmpeg WASM client — wraps @ffmpeg/ffmpeg for browser-side encoding.
 * Handles lazy loading, file I/O, and command execution.
 */

import { FFmpeg as FFmpegCore } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpegCore | null = null;
let ffmpegLoading = false;
let ffmpegLoaded = false;

export interface FFmpegProgress {
  ratio: number; // 0-1
  time: number;  // ms
}

/**
 * Load or return the cached FFmpeg WASM instance.
 * Uses CDN URLs so no local WASM binaries are needed.
 */
export async function getFFmpeg(
  onProgress?: (progress: { phase: string; ratio: number }) => void,
): Promise<FFmpegCore> {
  if (ffmpegLoaded && ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) {
    // Wait for existing load
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (ffmpegLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
    return ffmpegInstance!;
  }

  ffmpegLoading = true;
  onProgress?.({ phase: "downloading", ratio: 0 });

  const ffmpeg = new FFmpegCore();

  ffmpeg.on("progress", ({ progress, time }) => {
    onProgress?.({ phase: "encoding", ratio: progress });
  });

  ffmpeg.on("log", ({ message }) => {
    // Optional: debug logging
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  ffmpegLoaded = true;
  ffmpegLoading = false;

  onProgress?.({ phase: "ready", ratio: 1 });
  return ffmpeg;
}

/**
 * Write a file to FFmpeg's virtual filesystem.
 */
export async function writeFFmpegFile(
  ffmpeg: FFmpegCore,
  name: string,
  data: Uint8Array | ArrayBuffer | Blob,
): Promise<void> {
  let uint8: Uint8Array;
  if (data instanceof Blob) {
    const buf = await data.arrayBuffer();
    uint8 = new Uint8Array(buf);
  } else if (data instanceof ArrayBuffer) {
    uint8 = new Uint8Array(data);
  } else {
    uint8 = data;
  }
  await ffmpeg.writeFile(name, uint8);
}

/**
 * Read a file from FFmpeg's virtual filesystem.
 */
export async function readFFmpegFile(ffmpeg: FFmpegCore, name: string): Promise<Uint8Array> {
  return (await ffmpeg.readFile(name)) as Uint8Array;
}

/**
 * Delete a file from FFmpeg's virtual filesystem.
 */
export async function deleteFFmpegFile(ffmpeg: FFmpegCore, name: string): Promise<void> {
  try {
    await ffmpeg.deleteFile(name);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Execute an FFmpeg command.
 */
export async function execFFmpeg(
  ffmpeg: FFmpegCore,
  args: string[],
): Promise<void> {
  await ffmpeg.exec(args);
}

/**
 * Write a canvas frame as PNG to FFmpeg's virtual FS.
 */
export async function writeCanvasFrame(
  ffmpeg: FFmpegCore,
  canvas: HTMLCanvasElement,
  frameIndex: number,
): Promise<void> {
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
  const data = new Uint8Array(await blob.arrayBuffer());
  const padded = String(frameIndex).padStart(6, "0");
  await ffmpeg.writeFile(`frame${padded}.png`, data);
}

/**
 * Write a canvas frame as JPEG (faster than PNG for export).
 */
export async function writeCanvasFrameJPEG(
  ffmpeg: FFmpegCore,
  canvas: HTMLCanvasElement,
  frameIndex: number,
  quality: number = 0.95,
): Promise<void> {
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", quality),
  );
  const data = new Uint8Array(await blob.arrayBuffer());
  const padded = String(frameIndex).padStart(6, "0");
  await ffmpeg.writeFile(`frame${padded}.jpg`, data);
}

/**
 * Convert Uint8Array to a downloadable Blob URL.
 */
export function uint8ToBlobUrl(data: Uint8Array, mimeType: string): string {
  const copy = new Uint8Array(data);
  const blob = new Blob([copy], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Cleanup: terminate FFmpeg instance.
 */
export async function terminateFFmpeg(): Promise<void> {
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
    ffmpegLoaded = false;
    ffmpegLoading = false;
  }
}
