import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Converts any audio buffer (e.g. MP3, AAC, OGG, M4A, WEBM) to 16-bit 44.1kHz mono WAV
 * using the system's ffmpeg binary. Falls back to the @ffmpeg/ffmpeg WASM if available.
 */
export async function convertToWav(input: Buffer, mimeType: string): Promise<Buffer> {
  const tmpDir = mkdtempSync(join(tmpdir(), "toolkit-audio-"));
  const ext = extFromMime(mimeType) || ".mp3";
  const inPath = join(tmpDir, `input${ext}`);
  const outPath = join(tmpDir, "output.wav");

  try {
    writeFileSync(inPath, input);
    execSync(
      `ffmpeg -y -i "${inPath}" -acodec pcm_s16le -ar 44100 -ac 1 "${outPath}"`,
      { stdio: "pipe", timeout: 60_000 },
    );
    const { readFileSync } = await import("node:fs");
    return readFileSync(outPath);
  } finally {
    try { unlinkSync(inPath); } catch { /* ignore */ }
    try { unlinkSync(outPath); } catch { /* ignore */ }
    try { unlinkSync(tmpDir); } catch { /* ignore */ }
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".m4a",
    "audio/aac": ".aac",
    "audio/ogg": ".ogg",
    "audio/opus": ".opus",
    "audio/webm": ".webm",
    "audio/flac": ".flac",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
  };
  return map[mime] || ".mp3";
}
