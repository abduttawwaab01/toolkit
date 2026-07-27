"use client";

export interface DemucsSeparationResult {
  stemUrls: Record<string, string>;
  engine: "demucs-local" | "replicate";
  durationMs: number;
}

export interface DemucsProgressEvent {
  phase: "uploading" | "converting" | "processing" | "downloading" | "done";
  progress: number;
  message: string;
}

/**
 * Converts any audio blob to 16-bit 44.1kHz mono WAV using OfflineAudioContext.
 * This ensures the server always receives a WAV that the demucs worker can parse.
 */
async function ensureWav(blob: Blob): Promise<Blob> {
  if (blob.type === "audio/wav" || blob.type === "audio/x-wav" || blob.type === "audio/wave") {
    return blob;
  }
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
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
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
  view.setUint16(20, format, true);
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
      const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export async function separateAudio(
  audioFile: File | Blob,
  mode: "vocals" | "music" | "drums" | "bass" = "vocals",
  onProgress?: (e: DemucsProgressEvent) => void,
): Promise<DemucsSeparationResult> {
  onProgress?.({ phase: "uploading", progress: 0, message: "Preparing audio..." });

  // Ensure the audio is WAV for compatibility
  let file: File | Blob = audioFile;
  if (audioFile instanceof Blob && !(audioFile as File).name && !audioFile.type.startsWith("audio/wav")) {
    onProgress?.({ phase: "converting", progress: 0.1, message: "Converting to WAV..." });
    file = await ensureWav(audioFile);
  } else if (audioFile instanceof File && !audioFile.name.endsWith(".wav") && !audioFile.type.startsWith("audio/wav")) {
    onProgress?.({ phase: "converting", progress: 0.1, message: "Converting to WAV..." });
    file = await ensureWav(audioFile);
  }

  onProgress?.({ phase: "uploading", progress: 0.3, message: "Uploading audio..." });

  const formData = new FormData();
  formData.append("audio", file);
  formData.append("mode", mode === "vocals" ? "2" : "4");
  formData.append("stems", mode === "vocals" || mode === "music" ? "2" : "4");

  onProgress?.({ phase: "uploading", progress: 0.5, message: "Sending to server..." });

  const response = await fetch("/api/audio/separate", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Separation failed" }));
    throw new Error(err.error || `Server responded with ${response.status}`);
  }

  onProgress?.({ phase: "processing", progress: 0.7, message: "Processing stems..." });

  const data = await response.json();

  // If it's a queued job, return early
  if (data.jobId) {
    onProgress?.({ phase: "done", progress: 1, message: "Queued for background processing" });
    return {
      stemUrls: {},
      engine: "demucs-local",
      durationMs: 0,
    };
  }

  onProgress?.({ phase: "downloading", progress: 0.9, message: "Downloading stems..." });

  const stemUrls = data.data?.stems || {};

  onProgress?.({ phase: "done", progress: 1, message: "Complete!" });

  return {
    stemUrls,
    engine: data.usage?.provider || "demucs-local",
    durationMs: data.usage?.durationMs || 0,
  };
}
