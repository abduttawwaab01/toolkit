import type { ExportSettings, ExportProgress, ExportStage } from "@/types/export";
import { FORMAT_INFO, RESOLUTIONS } from "@/types/export";

export interface ExportCallbacks {
  onProgress: (progress: ExportProgress) => void;
  onComplete: (url: string, fileSize: number) => void;
  onError: (error: string) => void;
}

function createProgress(overrides?: Partial<ExportProgress>): ExportProgress {
  return {
    stage: "initializing",
    percent: 0,
    currentFrame: 0,
    totalFrames: 0,
    elapsedMs: 0,
    etaMs: 0,
    speed: "0x",
    fileSize: 0,
    outputUrl: null,
    error: null,
    ...overrides,
  };
}

export class ExportEngine {
  private settings: ExportSettings;
  private callbacks: ExportCallbacks;
  private cancelled = false;
  private startTime = 0;

  constructor(settings: ExportSettings, callbacks: ExportCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks;
  }

  cancel() {
    this.cancelled = true;
  }

  get isCancelled() {
    return this.cancelled;
  }

  private report(stage: ExportStage, percent: number, extra?: Partial<ExportProgress>) {
    const elapsed = Date.now() - this.startTime;
    const eta = percent > 0 ? (elapsed / percent) * (100 - percent) : 0;
    this.callbacks.onProgress(
      createProgress({
        stage,
        percent: Math.min(100, percent),
        elapsedMs: elapsed,
        etaMs: eta,
        speed: eta > 0 ? (100 / (elapsed + eta)) * 1000 / 1000 + "x" : "0x",
        ...extra,
      }),
    );
  }

  async start(videoElement: HTMLVideoElement | null, canvasElement: HTMLCanvasElement | null): Promise<void> {
    this.startTime = Date.now();
    const { format, resolution, framerate, width, height } = this.settings;
    const fmt = FORMAT_INFO[format];

    this.report("initializing", 0);

    try {
      if (!fmt.supportsVideo) {
        // Audio-only export
        await this.exportAudioOnly(videoElement);
      } else if (format === "gif") {
        await this.exportGif(videoElement, canvasElement);
      } else {
        // Video export using MediaRecorder as primary pipeline,
        // with canvas capture for frame-accurate rendering
        await this.exportVideo(videoElement, canvasElement);
      }
    } catch (err) {
      if (this.cancelled) {
        this.report("cancelled", 0);
      } else {
        this.report("error", 0, { error: String(err) });
        this.callbacks.onError(String(err));
      }
    }
  }

  private async exportVideo(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): Promise<void> {
    this.report("rendering-frames", 5);

    const { width, height, framerate, videoBitrate, audioBitrate, format } = this.settings;
    const res = RESOLUTIONS[this.settings.resolution];
    const outW = this.settings.width || res.width;
    const outH = this.settings.height || res.height;

    // Use MediaRecorder API for browser-native encoding
    // This works in all modern browsers without FFmpeg
    const stream = await this.captureCompositeStream(video, canvas, outW, outH, framerate);

    this.report("encoding-video", 20);

    const mimeType = FORMAT_INFO[format].mime;
    const mimeVariants = [
      `${mimeType};codecs=${this.getCodecString()}`,
      mimeType,
      "video/webm;codecs=vp9",
      "video/webm",
    ];

    let recorder: MediaRecorder | null = null;
    let selectedMime = "";

    for (const mime of mimeVariants) {
      if (MediaRecorder.isTypeSupported(mime)) {
        recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: videoBitrate * 1000,
          audioBitsPerSecond: audioBitrate * 1000,
        });
        selectedMime = mime;
        break;
      }
    }

    if (!recorder) {
      // Fallback: try basic MediaRecorder
      try {
        recorder = new MediaRecorder(stream, {
          videoBitsPerSecond: videoBitrate * 1000,
        });
      } catch {
        throw new Error("No supported MediaRecorder format found in this browser");
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const totalFrames = Math.ceil(this.settings.framerate * 30); // estimate 30s
    let frameCount = 0;

    return new Promise((resolve, reject) => {
      recorder!.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunks, { type: selectedMime || mimeType });
        const url = URL.createObjectURL(blob);

        this.report("finalizing", 95);

        this.report("complete", 100, {
          outputUrl: url,
          fileSize: blob.size,
          totalFrames: frameCount,
        });

        this.callbacks.onComplete(url, blob.size);
        resolve();
      };

      recorder!.onerror = () => {
        reject(new Error("MediaRecorder error during export"));
      };

      recorder!.start(100); // Collect data every 100ms

      // Stop after processing frames (duration-based)
      // For now, stop after 30 seconds of captured video
      setTimeout(() => {
        if (recorder?.state === "recording") {
          recorder.stop();
        }
      }, 35000);
    });
  }

  private async captureCompositeStream(
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
    width: number,
    height: number,
    framerate: number,
  ): Promise<MediaStream> {
    // Create an offscreen canvas for compositing
    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const ctx = compositeCanvas.getContext("2d")!;

    // Render at the target framerate
    const captureStream = compositeCanvas.captureStream(framerate);

    // If we have a video element, add its audio track
    if (video && this.settings.includeAudio) {
      try {
        const audioStream = (video as any).captureStream
          ? (video as any).captureStream()
          : null;
        if (audioStream) {
          const audioTracks = audioStream.getAudioTracks();
          for (const track of audioTracks) {
            captureStream.addTrack(track);
          }
        }
      } catch {
        // Audio capture not supported
      }
    }

    // Start rendering loop
    const renderFrame = () => {
      if (this.cancelled) return;

      ctx.clearRect(0, 0, width, height);

      // Draw video frame if available
      if (video && !video.paused) {
        ctx.drawImage(video, 0, 0, width, height);
      } else if (canvas) {
        ctx.drawImage(canvas, 0, 0, width, height);
      } else {
        // Draw a placeholder
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, width, height);
      }

      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);
    return captureStream;
  }

  private async exportGif(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): Promise<void> {
    // GIF export via canvas frame capture
    // In production, this would use FFmpeg WASM or gif.js
    this.report("rendering-frames", 10);
    throw new Error("GIF export requires FFmpeg WASM. Use MP4 and convert online.");
  }

  private async exportAudioOnly(video: HTMLVideoElement | null): Promise<void> {
    if (!video || !video.src) {
      throw new Error("No audio source available");
    }

    this.report("encoding-audio", 10);

    // Use MediaRecorder to capture audio
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();

    try {
      const source = ctx.createMediaElementSource(video);
      source.connect(dest);
    } catch {
      // Already connected
    }

    const mimeType = FORMAT_INFO[this.settings.format].mime;
    const recorder = new MediaRecorder(dest.stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "audio/webm",
      audioBitsPerSecond: this.settings.audioBitrate * 1000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        this.report("complete", 100, {
          outputUrl: url,
          fileSize: blob.size,
        });

        this.callbacks.onComplete(url, blob.size);
        resolve();
      };

      recorder.onerror = () => reject(new Error("Audio recording failed"));
      recorder.start();

      // Record for duration of video
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        ctx.close();
      }, 35000);
    });
  }

  private getCodecString(): string {
    const { videoCodec, audioCodec } = this.settings;
    switch (videoCodec) {
      case "h264": return `avc1.640028,${audioCodec}`;
      case "vp9": return `vp9,${audioCodec}`;
      case "vp8": return `vp8,${audioCodec}`;
      case "av1": return `av01.0.08M.08,${audioCodec}`;
      default: return `${videoCodec},${audioCodec}`;
    }
  }
}

/** Create an export engine instance */
export function createExportEngine(
  settings: ExportSettings,
  callbacks: ExportCallbacks,
): ExportEngine {
  return new ExportEngine(settings, callbacks);
}
