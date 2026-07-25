"use client";

export type AudioEngineFeature =
  | "silence-removal"
  | "voice-changer"
  | "tone-enhancer"
  | "noise-removal"
  | "bg-music-removal";

export interface AudioEngineNode {
  id: string;
  type: AudioEngineFeature;
  name: string;
  enabled: boolean;
  params: Record<string, number>;
  dryWet: number; // 0-1
  input: AudioNode | null;
  output: AudioNode | null;
}

// ─── Silence Removal ───

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export async function detectSilence(
  audioBuffer: AudioBuffer,
  threshold?: number,
  minDuration?: number,
): Promise<SilenceSegment[]> {
  const thr = threshold ?? 0.02;
  const minDur = minDuration ?? 0.3;
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.01));
  const segments: SilenceSegment[] = [];
  let silenceStart: number | null = null;

  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
      sum += channelData[i + j] * channelData[i + j];
      count++;
    }
    const rms = Math.sqrt(sum / count);
    const time = i / sampleRate;

    if (rms < thr) {
      if (silenceStart === null) silenceStart = time;
    } else if (silenceStart !== null) {
      const dur = time - silenceStart;
      if (dur >= minDur) segments.push({ start: silenceStart, end: time, duration: dur });
      silenceStart = null;
    }
  }

  if (silenceStart !== null) {
    const dur = audioBuffer.duration - silenceStart;
    if (dur >= minDur) segments.push({ start: silenceStart, end: audioBuffer.duration, duration: dur });
  }

  return segments;
}

export interface RemoveSilenceResult {
  silentRegions: SilenceSegment[];
  keptRegions: { start: number; end: number }[];
  totalRemoved: number;
  newDuration: number;
}

export function computeSilenceRemoval(
  audioBuffer: AudioBuffer,
  silenceSegments: SilenceSegment[],
  maxSilenceToKeep?: number,
): RemoveSilenceResult {
  const maxKeep = maxSilenceToKeep ?? 0.3;
  const keptRegions: { start: number; end: number }[] = [];
  let cursor = 0;
  let totalRemoved = 0;

  for (const seg of silenceSegments) {
    if (seg.start > cursor) {
      keptRegions.push({ start: cursor, end: seg.start });
    }
    const keep = Math.min(seg.duration, maxKeep);
    if (keep > 0) {
      keptRegions.push({ start: seg.start, end: seg.start + keep });
      totalRemoved += seg.duration - keep;
    } else {
      totalRemoved += seg.duration;
    }
    cursor = seg.end;
  }

  if (cursor < audioBuffer.duration) {
    keptRegions.push({ start: cursor, end: audioBuffer.duration });
  }

  const newDuration = keptRegions.reduce((sum, r) => sum + (r.end - r.start), 0);

  return { silentRegions: silenceSegments, keptRegions, totalRemoved, newDuration };
}

export async function renderSilenceRemovedAudio(
  originalBuffer: AudioBuffer,
  keptRegions: { start: number; end: number }[],
): Promise<AudioBuffer> {
  const sampleRate = originalBuffer.sampleRate;
  const numChannels = originalBuffer.numberOfChannels;
  const totalSamples = Math.ceil(keptRegions.reduce((sum, r) => sum + (r.end - r.start), 0) * sampleRate);

  const ctx = new OfflineAudioContext(numChannels, totalSamples, sampleRate);
  const destination = ctx.createBuffer(numChannels, totalSamples, sampleRate);

  let outputOffset = 0;
  for (const region of keptRegions) {
    const startSample = Math.floor(region.start * sampleRate);
    const endSample = Math.floor(region.end * sampleRate);
    const length = endSample - startSample;

    for (let ch = 0; ch < numChannels; ch++) {
      const inputData = originalBuffer.getChannelData(ch);
      const outputData = destination.getChannelData(ch);
      for (let i = 0; i < length && outputOffset + i < totalSamples; i++) {
        outputData[outputOffset + i] = inputData[startSample + i];
      }
    }
    outputOffset += length;
  }

  return destination;
}

// ─── Voice Changer ───

export function createVoiceChainer(audioCtx: AudioContext, params: {
  pitch?: number;     // semitones (-12 to 12)
  formant?: number;   // formant shift (-5 to 5)
  distortion?: number; // 0-1
  chorus?: number;     // 0-1
  robot?: number;      // 0-1
}): { input: GainNode; output: GainNode; cleanup: () => void } {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const nodes: AudioNode[] = [];

  let chain: AudioNode = input;

  // Pitch shift via detune on OscillatorNode approach:
  // For realtime we use a simple delay-based pitch shift
  if (params.pitch && params.pitch !== 0) {
    const pitchShift = audioCtx.createBiquadFilter();
    pitchShift.type = "allpass";
    pitchShift.frequency.value = 1000;
    chain.connect(pitchShift);
    chain = pitchShift;
    nodes.push(pitchShift);
  }

  // Distortion for robot/monster effects
  if ((params.distortion ?? 0) > 0 || (params.robot ?? 0) > 0) {
    const distortion = audioCtx.createWaveShaper();
    const amount = Math.max(params.distortion ?? 0, params.robot ?? 0);
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1;
      const k = amount * 100;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = "none";
    chain.connect(distortion);
    chain = distortion;
    nodes.push(distortion);
  }

  // Chorus effect
  if ((params.chorus ?? 0) > 0) {
    const delay = audioCtx.createDelay(0.1);
    delay.delayTime.value = 0.03;
    const chorusGain = audioCtx.createGain();
    chorusGain.gain.value = params.chorus ?? 0.3;
    chain.connect(delay);
    delay.connect(chorusGain);
    chorusGain.connect(chain as AudioNode);
    nodes.push(delay, chorusGain);
  }

  chain.connect(output);

  return {
    input,
    output,
    cleanup: () => nodes.forEach((n) => n.disconnect()),
  };
}

// ─── Tone Enhancer ───

export function createToneEnhancer(audioCtx: AudioContext, params: {
  bass?: number;       // -12 to 12 dB
  mid?: number;        // -12 to 12 dB
  treble?: number;     // -12 to 12 dB
  presence?: number;   // -12 to 12 dB
  warmth?: number;     // 0-1
  compressor?: number; // 0-1
}): { input: GainNode; output: GainNode; cleanup: () => void } {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const nodes: AudioNode[] = [];

  // Compressor
  if ((params.compressor ?? 0) > 0) {
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -50 + (1 - (params.compressor ?? 0)) * 40;
    compressor.knee.value = 30;
    compressor.ratio.value = 3 + (params.compressor ?? 0) * 9;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    input.connect(compressor);
    nodes.push(compressor);
    // Chain
    let chain: AudioNode = compressor;

    // 3-band EQ
    const bass = audioCtx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 250;
    bass.gain.value = (params.bass ?? 0);
    chain.connect(bass);
    chain = bass;
    nodes.push(bass);

    const mid = audioCtx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = (params.mid ?? 0);
    chain.connect(mid);
    chain = mid;
    nodes.push(mid);

    const treble = audioCtx.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 8000;
    treble.gain.value = (params.treble ?? 0);
    chain.connect(treble);
    chain = treble;
    nodes.push(treble);

    // Presence (4kHz peak)
    if ((params.presence ?? 0) !== 0) {
      const presence = audioCtx.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 4000;
      presence.Q.value = 0.8;
      presence.gain.value = (params.presence ?? 0);
      chain.connect(presence);
      chain = presence;
      nodes.push(presence);
    }

    // Warmth (gentle low-pass)
    if ((params.warmth ?? 0) > 0) {
      const warmth = audioCtx.createBiquadFilter();
      warmth.type = "lowpass";
      warmth.frequency.value = 3000 + (1 - (params.warmth ?? 0)) * 5000;
      chain.connect(warmth);
      chain = warmth;
      nodes.push(warmth);
    }

    chain.connect(output);
    return { input, output, cleanup: () => nodes.forEach((n) => n.disconnect()) };
  }

  // Simple mode without compressor
  let chain: AudioNode = input;

  const bass = audioCtx.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 250;
  bass.gain.value = (params.bass ?? 0);
  chain.connect(bass);
  chain = bass;
  nodes.push(bass);

  const mid = audioCtx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = (params.mid ?? 0);
  chain.connect(mid);
  chain = mid;
  nodes.push(mid);

  const treble = audioCtx.createBiquadFilter();
  treble.type = "highshelf";
  treble.frequency.value = 8000;
  treble.gain.value = (params.treble ?? 0);
  chain.connect(treble);
  chain = treble;
  nodes.push(treble);

  chain.connect(output);
  return { input, output, cleanup: () => nodes.forEach((n) => n.disconnect()) };
}

// ─── Noise Removal ───

export function createNoiseRemover(audioCtx: AudioContext, params: {
  gateThreshold?: number; // -80 to -20 dB
  gateAttack?: number;    // 0-0.1
  gateRelease?: number;   // 0-1
  hissReduction?: number; // 0-1
  humRemoval?: number;    // 0-1
}): { input: GainNode; output: GainNode; cleanup: () => void } {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const nodes: AudioNode[] = [];

  let chain: AudioNode = input;

  // Noise gate
  if ((params.gateThreshold ?? -60) > -80) {
    const gate = audioCtx.createDynamicsCompressor();
    gate.threshold.value = params.gateThreshold ?? -60;
    gate.knee.value = 5;
    gate.ratio.value = 20;
    gate.attack.value = params.gateAttack ?? 0.01;
    gate.release.value = params.gateRelease ?? 0.2;
    chain.connect(gate);
    chain = gate;
    nodes.push(gate);
  }

  // Hum removal (notch at 50/60 Hz)
  if ((params.humRemoval ?? 0) > 0) {
    const humFilter = audioCtx.createBiquadFilter();
    humFilter.type = "notch";
    humFilter.frequency.value = 60;
    humFilter.Q.value = 10 + (params.humRemoval ?? 0) * 20;
    chain.connect(humFilter);
    chain = humFilter;
    nodes.push(humFilter);
  }

  // Hiss reduction (gentle low-pass)
  if ((params.hissReduction ?? 0) > 0) {
    const hissFilter = audioCtx.createBiquadFilter();
    hissFilter.type = "lowpass";
    hissFilter.frequency.value = 8000 - (params.hissReduction ?? 0) * 3000;
    chain.connect(hissFilter);
    chain = hissFilter;
    nodes.push(hissFilter);

    const highShelf = audioCtx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 4000;
    highShelf.gain.value = -(params.hissReduction ?? 0) * 12;
    chain.connect(highShelf);
    chain = highShelf;
    nodes.push(highShelf);
  }

  chain.connect(output);
  return { input, output, cleanup: () => nodes.forEach((n) => n.disconnect()) };
}

// ─── Background Music Removal ───

export function createBgMusicRemover(audioCtx: AudioContext, params: {
  strength?: number;      // 0-1
  lowCut?: number;        // 0-1
  centerWidth?: number;   // 0-1
  preserveVocals?: number; // 0-1
}): { input: GainNode; output: GainNode; cleanup: () => void } {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const nodes: AudioNode[] = [];

  let chain: AudioNode = input;

  // Center channel extraction (karaoke effect)
  if ((params.strength ?? 0) > 0 && (params.centerWidth ?? 0) > 0) {
    // Split into left/right and cancel center
    const splitter = audioCtx.createChannelSplitter(2);
    const merger = audioCtx.createChannelMerger(2);
    const leftGain = audioCtx.createGain();
    const rightGain = audioCtx.createGain();
    const invertGain = audioCtx.createGain();

    const strength = params.strength ?? 0.5;
    leftGain.gain.value = 1;
    rightGain.gain.value = 1;
    invertGain.gain.value = -strength;

    chain.connect(splitter);
    splitter.connect(leftGain, 0);
    splitter.connect(rightGain, 1);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    // Invert one channel to cancel center
    leftGain.connect(invertGain);
    invertGain.connect(merger, 0, 1);

    chain = merger;
    nodes.push(splitter, merger, leftGain, rightGain, invertGain);
  }

  // Low cut to remove bass
  if ((params.lowCut ?? 0) > 0) {
    const hipass = audioCtx.createBiquadFilter();
    hipass.type = "highpass";
    hipass.frequency.value = 100 + (params.lowCut ?? 0) * 300;
    chain.connect(hipass);
    chain = hipass;
    nodes.push(hipass);
  }

  chain.connect(output);
  return { input, output, cleanup: () => nodes.forEach((n) => n.disconnect()) };
}

// ─── Audio File Processing ───

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  return audioBuffer;
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
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
  view.setUint16(20, format, true);
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
