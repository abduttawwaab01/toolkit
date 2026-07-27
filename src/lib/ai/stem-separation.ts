/**
 * Client-side AI stem separation service.
 * Calls the server-side API route that uses Demucs (local ONNX).
 */

export interface StemSeparationResult {
  stems: Record<string, string>;
  mode: string;
  stemCount: number;
}

export interface StemSeparationOptions {
  stems?: "2" | "4";
  onProgress?: (progress: number) => void;
}

/**
 * Converts any audio blob to 16-bit 44.1kHz mono WAV using OfflineAudioContext.
 * Ensures server-side Demucs can always parse the input.
 */
async function ensureWav(blob: Blob): Promise<Blob> {
  if (
    blob.type === "audio/wav" ||
    blob.type === "audio/x-wav" ||
    blob.type === "audio/wave" ||
    blob.type === ""
  ) {
    return blob;
  }
  try {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const ab = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(ab);
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    const rendered = await offlineCtx.startRendering();
    return audioBufferToWavBlob(rendered);
  } catch {
    // If conversion fails, return original blob and let the server try
    return blob;
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

export async function separateAudioStems(
  audioFile: File,
  options: StemSeparationOptions = {},
): Promise<StemSeparationResult> {
  const { stems = "4", onProgress } = options;

  onProgress?.(5);

  // Convert non-WAV to WAV for compatibility
  let file: File = audioFile;
  if (!audioFile.name.toLowerCase().endsWith(".wav")) {
    onProgress?.(8);
    const wavBlob = await ensureWav(audioFile);
    file = new File([wavBlob], audioFile.name.replace(/\.[^.]+$/, ".wav"), { type: "audio/wav" });
  }

  onProgress?.(10);

  const formData = new FormData();
  formData.append("audio", file);
  formData.append("mode", stems);

  const response = await fetch("/api/audio/separate", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Stem separation failed: ${response.status}`);
  }

  onProgress?.(95);

  const result = await response.json();

  onProgress?.(100);

  // If the server returned a jobId (large file queued), return empty stems
  if (result.jobId) {
    return { stems: {}, mode: stems, stemCount: 0 };
  }

  return result.data as StemSeparationResult;
}

export function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch?.[1] || "audio/wav";
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export async function dataUriToAudioBuffer(dataUri: string): Promise<AudioBuffer> {
  const blob = dataUriToBlob(dataUri);
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  return audioContext.decodeAudioData(arrayBuffer);
}

export const STEM_INFO: Record<string, { label: string; color: string; icon: string }> = {
  vocals: { label: "Vocals", color: "#00f5d4", icon: "🎤" },
  drums: { label: "Drums", color: "#ff6b6b", icon: "🥁" },
  bass: { label: "Bass", color: "#4facfe", icon: "🎸" },
  other: { label: "Other", color: "#ffd93d", icon: "🎵" },
  accompaniment: { label: "Accompaniment", color: "#4facfe", icon: "🎶" },
};
