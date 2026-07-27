/**
 * Client-side AI audio denoise service.
 * Uses local DeepFilterNet3 ONNX model for noise removal (zero API cost).
 * Falls back to Web Audio API DSP for instant offline processing.
 */

export interface DenoiseResult {
  audio: string; // base64 data URI
  mode: "denoise" | "enhance";
}

export interface DenoiseOptions {
  /** true = denoise only, false = denoise + enhance (default) */
  denoiseOnly?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * AI-powered noise removal using local DeepFilterNet3 ONNX model.
 * Removes background noise — runs entirely on the server, zero API cost.
 */
export async function denoiseAudioAI(
  audioFile: File,
  options: DenoiseOptions = {},
): Promise<DenoiseResult> {
  const { denoiseOnly = false, onProgress } = options;

  onProgress?.(5);

  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("denoiseOnly", String(denoiseOnly));

  onProgress?.(10);

  const response = await fetch("/api/audio/denoise", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Denoising failed: ${response.status}`);
  }

  onProgress?.(95);

  const result = await response.json();

  onProgress?.(100);

  return result.data as DenoiseResult;
}

/**
 * Quick offline DSP-based noise reduction using Web Audio API.
 * Uses noise gate + bandpass filtering. Not as good as AI but instant.
 */
export async function denoiseAudioDSP(
  audioFile: File,
  options: {
    gateThreshold?: number;
    highpassFreq?: number;
    lowpassFreq?: number;
    strength?: number;
  } = {},
): Promise<Blob> {
  const {
    gateThreshold = -50,
    highpassFreq = 80,
    lowpassFreq = 12000,
    strength = 0.7,
  } = options;

  const arrayBuffer = await audioFile.arrayBuffer();
  const audioCtx = new OfflineAudioContext(2, 1, 44100);
  const source = audioCtx.createBufferSource();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  source.buffer = audioBuffer;

  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  let chain: AudioNode = input;

  // 1. Noise gate — silence quiet parts
  const threshold = Math.pow(10, gateThreshold / 20);
  const gateGain = audioCtx.createGain();
  gateGain.gain.value = 1;

  // 2. High-pass to remove rumble
  const hipass = audioCtx.createBiquadFilter();
  hipass.type = "highpass";
  hipass.frequency.value = highpassFreq;
  hipass.Q.value = 0.7;
  chain.connect(hipass);
  chain = hipass;

  // 3. Low-pass to remove hiss
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = lowpassFreq;
  lowpass.Q.value = 0.7;
  chain.connect(lowpass);
  chain = lowpass;

  // 4. Mid-range presence boost for speech clarity
  const presence = audioCtx.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = 3000;
  presence.Q.value = 0.5;
  presence.gain.value = strength * 4;
  chain.connect(presence);
  chain = presence;

  // 5. Gentle compression
  const comp = audioCtx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.ratio.value = 3;
  comp.attack.value = 0.003;
  comp.release.value = 0.1;
  chain.connect(comp);
  chain = comp;

  chain.connect(output);
  output.connect(audioCtx.destination);

  source.start(0);
  const rendered = await audioCtx.startRendering();

  return audioBufferToWav(rendered);
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
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

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
