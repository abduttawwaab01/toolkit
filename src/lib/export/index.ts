import type { ExportSettings, ExportProgress, ExportStage } from "@/types/export";
import { FORMAT_INFO, RESOLUTIONS } from "@/types/export";
import type { Clip } from "@/types/editor";
import { buildEffectChain } from "@/lib/audio-engine/player-processor";

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

    // Apply audio effects via Web Audio API
    if (video && this.settings.includeAudio) {
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const state = (await import("@/lib/editor-store")).useEditorStore.getState();
        const trackId = state.clips.find((c: Clip) => c.src === video.src)?.trackId;
        const track = trackId ? state.tracks.find((t: { id: string }) => t.id === trackId) : null;
        const effects = track?.audioEffects ?? [];

        let outputNode: AudioNode = source;
        if (effects.length > 0) {
          const chain = buildEffectChain(audioCtx, source, effects);
          outputNode = chain.output;
        }

        const dest = audioCtx.createMediaStreamDestination();
        outputNode.connect(dest);
        const audioTracks = dest.stream.getAudioTracks();
        for (const track of audioTracks) {
          captureStream.addTrack(track);
        }

        // Keep audio context alive for duration
        setTimeout(() => audioCtx.close(), state.project.duration * 1000 + 2000);
      } catch {
        // Fallback: capture raw audio
        try {
          const audioStream = (video as any).captureStream?.();
          if (audioStream) {
            const audioTracks = audioStream.getAudioTracks();
            for (const track of audioTracks) {
              captureStream.addTrack(track);
            }
          }
        } catch {}
      }
    }

    const state = (await import("@/lib/editor-store")).useEditorStore.getState();
    const project = state.project;
    const clips = state.clips;
    const totalDuration = project.duration;
    const frameInterval = 1000 / framerate;
    let currentFrame = 0;

    // Load font for text rendering if needed
    const hasTextClips = clips.some((c: Clip) => c.type === "text" && c.textContent);
    if (hasTextClips) {
      await document.fonts.ready;
    }

    return new Promise<MediaStream>((resolve) => {
      const renderLoop = () => {
        if (this.cancelled) return;

        const time = (currentFrame / framerate);
        if (time > totalDuration) {
          resolve(captureStream);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        // Draw video frame
        if (video) {
          try { video.currentTime = time; } catch {}
          ctx.drawImage(video, 0, 0, width, height);
        } else if (canvas) {
          ctx.drawImage(canvas, 0, 0, width, height);
        } else {
          ctx.fillStyle = "#0a0a0f";
          ctx.fillRect(0, 0, width, height);
        }

        // Render text overlays and subtitles (if burn-in enabled)
        if (hasTextClips && this.settings.includeSubtitles) {
          for (const clip of clips) {
            if (clip.type !== "text" || !clip.textContent) continue;
            const relTime = time - clip.startTime;
            if (relTime < 0 || relTime > clip.duration) continue;

            const ts = clip.textStyle;
            let text = clip.textContent;
            let fontSize = ts?.fontSize || 48;

            // Check for active subtitle
            const currentSub = clip.subtitles?.find(
              (s: { start: number; end: number }) => relTime >= s.start && relTime <= s.end,
            );
            if (currentSub) {
              text = currentSub.text;
              fontSize = Math.min(fontSize, 36);
            }

            // Typewriter effect
            const anim = clip.textAnimation;
            if (anim?.type === "typewriter" && !currentSub) {
              const stagger = anim.stagger || 0.03;
              const charCount = Math.floor(relTime / stagger);
              text = text.slice(0, Math.max(0, charCount));
            }

            ctx.save();
            ctx.translate(clip.positionX || 0, clip.positionY || 0);
            ctx.scale(clip.scale || 1, clip.scale || 1);
            ctx.rotate(((clip.rotation || 0) * Math.PI) / 180);
            ctx.globalAlpha = clip.opacity ?? 1;

            const fontFamily = ts?.fontFamily || "'Inter', sans-serif";
            ctx.font = `${ts?.bold ? "bold " : ""}${ts?.italic ? "italic " : ""}${fontSize}px ${fontFamily}`;
            ctx.textAlign = (ts?.alignment || "center") as CanvasTextAlign;
            ctx.textBaseline = "middle";

            const x = width / 2;
            const y = height / 2;

            // Background
            if (ts?.background) {
              const bgAlpha = Math.round((ts.backgroundOpacity ?? 0.6) * 255).toString(16).padStart(2, "0");
              ctx.fillStyle = ts.background + bgAlpha;
              const metrics = ctx.measureText(text);
              const padX = ts.paddingX || 16;
              const padY = ts.paddingY || 8;
              const bx = x - metrics.width / 2 - padX;
              const by = y - fontSize / 2 - padY;
              const bw = metrics.width + padX * 2;
              const bh = fontSize + padY * 2;
              const br = ts.borderRadius || 0;
              if (br > 0) {
                ctx.beginPath();
                ctx.roundRect(bx, by, bw, bh, br);
                ctx.fill();
              } else {
                ctx.fillRect(bx, by, bw, bh);
              }
            }

            // Shadow
            if (ts?.shadowColor) {
              ctx.shadowColor = ts.shadowColor;
              ctx.shadowBlur = ts.shadowBlur || 4;
              ctx.shadowOffsetX = ts.shadowOffsetX || 2;
              ctx.shadowOffsetY = ts.shadowOffsetY || 2;
            }

            // Stroke
            if (ts?.strokeWidth && ts.strokeWidth > 0) {
              ctx.strokeStyle = ts.strokeColor || "#000";
              ctx.lineWidth = ts.strokeWidth;
              ctx.strokeText(text, x, y);
            }

            ctx.fillStyle = ts?.color || "#ffffff";
            ctx.fillText(text, x, y);

            ctx.restore();
          }
        }

        // Fade in/out overlays for all clips
        for (const clip of clips) {
          const relTime = time - clip.startTime;
          if (relTime < 0 || relTime > clip.duration) continue;
          // Fade in
          if (clip.fadeIn && relTime < clip.fadeIn) {
            ctx.save();
            ctx.fillStyle = `rgba(0,0,0,${1 - relTime / clip.fadeIn})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
          // Fade out
          if (clip.fadeOut && clip.duration - relTime < clip.fadeOut) {
            ctx.save();
            ctx.fillStyle = `rgba(0,0,0,${1 - (clip.duration - relTime) / clip.fadeOut})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
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

    // Get project duration first
    const recordDuration = (await import("@/lib/editor-store")).useEditorStore.getState().project.duration;

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

      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        ctx.close();
      }, recordDuration * 1000 + 1000);
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
