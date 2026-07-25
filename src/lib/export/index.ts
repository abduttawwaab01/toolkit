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
    const { format } = this.settings;
    const fmt = FORMAT_INFO[format];

    this.report("initializing", 0);

    try {
      if (!fmt.supportsVideo) {
        await this.exportAudioOnly(videoElement);
      } else if (format === "gif") {
        await this.exportGif(videoElement, canvasElement);
      } else {
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

    const { framerate, videoBitrate, audioBitrate, format } = this.settings;
    const res = RESOLUTIONS[this.settings.resolution];
    const outW = this.settings.width || res.width;
    const outH = this.settings.height || res.height;

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

    const project = (await import("@/lib/editor-store")).useEditorStore.getState().project;
    const totalDuration = project.duration;
    const totalFrames = Math.ceil(framerate * totalDuration);
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

      recorder!.start(100);

      // Stop after the full project duration (captureStream runs at specified fps)
      const captureDurationMs = totalDuration * 1000 + 1000;
      setTimeout(() => {
        if (recorder?.state === "recording") {
          recorder.stop();
        }
      }, captureDurationMs);
    });
  }

  private async captureCompositeStream(
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
    width: number,
    height: number,
    framerate: number,
  ): Promise<MediaStream> {
    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = width;
    compositeCanvas.height = height;
    const ctx = compositeCanvas.getContext("2d")!;

    const captureStream = compositeCanvas.captureStream(framerate);

    if (video && this.settings.includeAudio) {
      try {
        const audioStream = (video as any).captureStream?.();
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

    const project = (await import("@/lib/editor-store")).useEditorStore.getState().project;
    const totalDuration = project.duration;
    const frameInterval = 1000 / framerate;
    let currentFrame = 0;

    return new Promise<MediaStream>((resolve) => {
      const renderLoop = () => {
        if (this.cancelled) return;

        const time = (currentFrame / framerate);
        if (time > totalDuration) {
          resolve(captureStream);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        if (video) {
          video.currentTime = time;
          ctx.drawImage(video, 0, 0, width, height);
        } else if (canvas) {
          ctx.drawImage(canvas, 0, 0, width, height);
        } else {
          ctx.fillStyle = "#0a0a0f";
          ctx.fillRect(0, 0, width, height);
        }

        currentFrame++;
        setTimeout(renderLoop, frameInterval);
      };

      renderLoop();
    });
  }

  private async exportGif(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): Promise<void> {
    this.report("rendering-frames", 10);

    const { framerate } = this.settings;
    const res = RESOLUTIONS[this.settings.resolution];
    const outW = this.settings.width || res.width;
    const outH = this.settings.height || res.height;

    const project = (await import("@/lib/editor-store")).useEditorStore.getState().project;
    const totalDuration = project.duration;
    const totalFrames = Math.ceil(framerate * totalDuration);
    const frameInterval = 1000 / Math.min(framerate, 10);

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = outW;
    compositeCanvas.height = outH;
    const ctx = compositeCanvas.getContext("2d")!;

    const stream = compositeCanvas.captureStream(10);
    const mimeVariants = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    let recorder: MediaRecorder | null = null;
    for (const mime of mimeVariants) {
      if (MediaRecorder.isTypeSupported(mime)) {
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2000000 });
        break;
      }
    }
    if (!recorder) recorder = new MediaRecorder(stream, { videoBitsPerSecond: 2000000 });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    let frameCount = 0;

    return new Promise((resolve, reject) => {
      recorder!.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        this.report("complete", 100, { outputUrl: url, fileSize: blob.size, totalFrames: frameCount });
        this.callbacks.onComplete(url, blob.size);
        resolve();
      };
      recorder!.onerror = () => reject(new Error("GIF/WebM recording failed"));
      recorder!.start(100);

      const renderLoop = () => {
        if (this.cancelled) { if (recorder?.state === "recording") recorder!.stop(); return; }
        const time = frameCount / Math.min(framerate, 10);
        if (time > totalDuration) { if (recorder?.state === "recording") recorder!.stop(); return; }
        ctx.clearRect(0, 0, outW, outH);
        if (video) { video.currentTime = time; ctx.drawImage(video, 0, 0, outW, outH); }
        else if (canvas) ctx.drawImage(canvas, 0, 0, outW, outH);
        else { ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, outW, outH); }
        frameCount++;
        setTimeout(renderLoop, frameInterval);
      };
      renderLoop();
    });
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
    const { videoCodec } = this.settings;
    switch (videoCodec) {
      case "h264": return "avc1.640028";
      case "vp9": return "vp9";
      case "vp8": return "vp8";
      case "av1": return "av01.0.08M.08";
      default: return videoCodec;
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
