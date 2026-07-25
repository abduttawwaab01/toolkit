export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export interface AudioAnalysisResult {
  duration: number;
  sampleRate: number;
  totalSamples: number;
  silenceSegments: SilenceSegment[];
  loudness: number;
  peakLevel: number;
}

const DEFAULT_SILENCE_THRESHOLD = 0.02; // RMS threshold for silence
const DEFAULT_MIN_SILENCE_DURATION = 0.5; // seconds

export async function analyzeAudio(audioBuffer: AudioBuffer, options?: {
  silenceThreshold?: number;
  minSilenceDuration?: number;
}): Promise<AudioAnalysisResult> {
  const threshold = options?.silenceThreshold ?? DEFAULT_SILENCE_THRESHOLD;
  const minDuration = options?.minSilenceDuration ?? DEFAULT_MIN_SILENCE_DURATION;
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const totalSamples = audioBuffer.length;

  // Mix down to mono for analysis
  const channelData = audioBuffer.getChannelData(0);
  const monoData = new Float32Array(audioBuffer.length);

  if (numChannels > 1) {
    for (let ch = 0; ch < numChannels; ch++) {
      const chData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < audioBuffer.length; i++) {
        monoData[i] += chData[i] / numChannels;
      }
    }
  } else {
    monoData.set(channelData);
  }

  // Calculate RMS in 10ms windows
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.01));
  const rmsValues: { time: number; rms: number }[] = [];

  let peakLevel = 0;
  let sumSquares = 0;

  for (let i = 0; i < monoData.length; i += windowSize) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < windowSize && i + j < monoData.length; j++) {
      const sample = monoData[i + j];
      sum += sample * sample;
      sumSquares += sample * sample;
      peakLevel = Math.max(peakLevel, Math.abs(sample));
      count++;
    }
    const rms = Math.sqrt(sum / count);
    rmsValues.push({ time: i / sampleRate, rms });
  }

  const loudness = Math.sqrt(sumSquares / monoData.length);

  // Detect silence segments
  const silenceSegments: SilenceSegment[] = [];
  let silenceStart: number | null = null;

  for (const frame of rmsValues) {
    const isSilent = frame.rms < threshold;

    if (isSilent && silenceStart === null) {
      silenceStart = frame.time;
    } else if (!isSilent && silenceStart !== null) {
      const endTime = frame.time;
      const segDuration = endTime - silenceStart;
      if (segDuration >= minDuration) {
        silenceSegments.push({ start: silenceStart, end: endTime, duration: segDuration });
      }
      silenceStart = null;
    }
  }

  // Check if last segment extends to end
  if (silenceStart !== null) {
    const endTime = duration;
    const segDuration = endTime - silenceStart;
    if (segDuration >= minDuration) {
      silenceSegments.push({ start: silenceStart, end: endTime, duration: segDuration });
    }
  }

  return {
    duration,
    sampleRate,
    totalSamples,
    silenceSegments,
    loudness,
    peakLevel,
  };
}

export function getSmartCutRegions(
  analysis: AudioAnalysisResult,
  maxSilenceToRemove?: number,
): { keepStart: number; keepEnd: number }[] {
  const maxRemove = maxSilenceToRemove ?? 3;
  const regions: { keepStart: number; keepEnd: number }[] = [];
  let cursor = 0;

  for (const seg of analysis.silenceSegments) {
    if (seg.duration > maxRemove) {
      // Keep only the first `maxRemove` seconds of silence
      const keepUntil = seg.start + maxRemove;
      if (keepUntil > cursor) {
        regions.push({ keepStart: cursor, keepEnd: keepUntil });
      }
      cursor = seg.end;
    } else {
      // Remove this entire silence segment
      if (seg.start > cursor) {
        regions.push({ keepStart: cursor, keepEnd: seg.start });
      }
      cursor = seg.end;
    }
  }

  if (cursor < analysis.duration) {
    regions.push({ keepStart: cursor, keepEnd: analysis.duration });
  }

  return regions;
}

export async function decodeAudioFromFile(file: File): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}
