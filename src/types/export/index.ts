export type ExportFormat = "mp4" | "webm" | "mov" | "gif" | "mp3" | "wav" | "aac" | "flac" | "ogg";
export type ExportVideoCodec = "h264" | "h265" | "vp9" | "vp8" | "av1";
export type ExportAudioCodec = "aac" | "mp3" | "vorbis" | "opus" | "flac" | "pcm_s16le";
export type ExportResolution = "4320p" | "2160p" | "1440p" | "1080p" | "720p" | "540p" | "480p" | "360p";
export type ExportFramerate = 24 | 25 | 30 | 48 | 50 | 60 | 120;
export type ExportScope = "entire" | "selected" | "range";
export type ExportStage = "initializing" | "loading-ffmpeg" | "rendering-frames" | "encoding-video" | "encoding-audio" | "muxing" | "finalizing" | "complete" | "error" | "cancelled";

export interface ExportSettings {
  format: ExportFormat;
  videoCodec: ExportVideoCodec;
  audioCodec: ExportAudioCodec;
  resolution: ExportResolution;
  width: number;
  height: number;
  framerate: ExportFramerate;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  sampleRate: number;
  channels: 1 | 2 | 6;
  quality: number; // 0-100
  crf: number; // 0-51 (lower = better)
  keyframeInterval: number;
  pixelFormat: "yuv420p" | "yuv422p" | "yuv444p";
  fastStart: boolean;
  scope: ExportScope;
  rangeStart?: number;
  rangeEnd?: number;
  includeAudio: boolean;
  includeVideo: boolean;
  includeSubtitles: boolean;
  loop: number; // for GIF
  dither: boolean; // for GIF
}

export interface ExportPresetDefinition {
  id: string;
  name: string;
  platform: string;
  description: string;
  icon: string;
  settings: Partial<ExportSettings>;
  category: "video" | "audio" | "gif";
  popular: boolean;
}

export interface ExportProgress {
  stage: ExportStage;
  percent: number;
  currentFrame: number;
  totalFrames: number;
  elapsedMs: number;
  etaMs: number;
  speed: string; // e.g. "2.5x"
  fileSize: number;
  outputUrl: string | null;
  error: string | null;
}

export interface ExportJob {
  id: string;
  name: string;
  settings: ExportSettings;
  progress: ExportProgress;
  startedAt: number;
  completedAt: number | null;
}

export interface ExportHistoryEntry {
  id: string;
  name: string;
  format: ExportFormat;
  resolution: ExportResolution;
  fileSize: number;
  duration: number;
  url: string;
  thumbnailUrl: string | null;
  createdAt: number;
}

export const RESOLUTIONS: Record<ExportResolution, { width: number; height: number; label: string; creditCost?: number }> = {
  "4320p": { width: 7680, height: 4320, label: "8K (4320p)", creditCost: 3 },
  "2160p": { width: 3840, height: 2160, label: "4K (2160p)", creditCost: 2 },
  "1440p": { width: 2560, height: 1440, label: "2K (1440p)", creditCost: 1 },
  "1080p": { width: 1920, height: 1080, label: "Full HD (1080p)" },
  "720p": { width: 1280, height: 720, label: "HD (720p)" },
  "540p": { width: 960, height: 540, label: "SD (540p)" },
  "480p": { width: 854, height: 480, label: "SD (480p)" },
  "360p": { width: 640, height: 360, label: "SD (360p)" },
};

export const FORMAT_INFO: Record<ExportFormat, { label: string; extension: string; mime: string; supportsVideo: boolean; supportsAudio: boolean }> = {
  mp4: { label: "MP4", extension: ".mp4", mime: "video/mp4", supportsVideo: true, supportsAudio: true },
  webm: { label: "WebM", extension: ".webm", mime: "video/webm", supportsVideo: true, supportsAudio: true },
  mov: { label: "MOV", extension: ".mov", mime: "video/quicktime", supportsVideo: true, supportsAudio: true },
  gif: { label: "GIF", extension: ".gif", mime: "image/gif", supportsVideo: true, supportsAudio: false },
  mp3: { label: "MP3", extension: ".mp3", mime: "audio/mpeg", supportsVideo: false, supportsAudio: true },
  wav: { label: "WAV", extension: ".wav", mime: "audio/wav", supportsVideo: false, supportsAudio: true },
  aac: { label: "AAC", extension: ".aac", mime: "audio/aac", supportsVideo: false, supportsAudio: true },
  flac: { label: "FLAC", extension: ".flac", mime: "audio/flac", supportsVideo: false, supportsAudio: true },
  ogg: { label: "OGG", extension: ".ogg", mime: "audio/ogg", supportsVideo: false, supportsAudio: true },
};

export const VIDEO_CODEC_INFO: Record<ExportVideoCodec, { label: string; formats: ExportFormat[] }> = {
  h264: { label: "H.264", formats: ["mp4", "mov"] },
  h265: { label: "H.265/HEVC", formats: ["mp4", "mov"] },
  vp9: { label: "VP9", formats: ["webm"] },
  vp8: { label: "VP8", formats: ["webm"] },
  av1: { label: "AV1", formats: ["mp4", "webm"] },
};

export const AUDIO_CODEC_INFO: Record<ExportAudioCodec, { label: string; formats: ExportFormat[] }> = {
  aac: { label: "AAC", formats: ["mp4", "aac"] },
  mp3: { label: "MP3", formats: ["mp3"] },
  vorbis: { label: "Vorbis", formats: ["ogg", "webm"] },
  opus: { label: "Opus", formats: ["ogg", "webm"] },
  flac: { label: "FLAC", formats: ["flac"] },
  pcm_s16le: { label: "PCM S16LE", formats: ["wav"] },
};

export function defaultExportSettings(): ExportSettings {
  return {
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: "1080p",
    width: 1920,
    height: 1080,
    framerate: 30,
    videoBitrate: 8000,
    audioBitrate: 192,
    sampleRate: 48000,
    channels: 2,
    quality: 90,
    crf: 23,
    keyframeInterval: 250,
    pixelFormat: "yuv420p",
    fastStart: true,
    scope: "entire",
    includeAudio: true,
    includeVideo: true,
    includeSubtitles: true,
    loop: 0,
    dither: true,
  };
}
