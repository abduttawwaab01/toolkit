import type { ExportSettings, ExportProgress, ExportStage } from "@/types/export";
import { FORMAT_INFO, RESOLUTIONS } from "@/types/export";
import type { Clip } from "@/types/editor";
import { buildEffectChain } from "@/lib/audio-engine/player-processor";
import { GifEncoder } from "./gif-encoder";
import {
  getFFmpeg,
  writeFFmpegFile,
  readFFmpegFile,
  writeCanvasFrameJPEG,
  execFFmpeg,
  deleteFFmpegFile,
  uint8ToBlobUrl,
} from "./ffmpeg-client";

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
        await this.exportAudioFFmpeg(videoElement);
      } else if (format === "gif") {
        await this.exportGif(videoElement, canvasElement);
      } else {
        await this.exportVideoFFmpeg(videoElement, canvasElement);
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

  // ─── FFmpeg WASM Video Export ──────────────────────────────────────────

  private async exportVideoFFmpeg(
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
  ): Promise<void> {
    this.report("loading-ffmpeg", 2);

    const ffmpeg = await getFFmpeg(({ phase, ratio }) => {
      if (phase === "downloading") this.report("loading-ffmpeg", 2 + ratio * 8);
    });

    if (this.cancelled) return;

    const { framerate, videoBitrate, audioBitrate, format, crf } = this.settings;
    const res = RESOLUTIONS[this.settings.resolution];
    const outW = this.settings.width || res.width;
    const outH = this.settings.height || res.height;

    const state = (await import("@/lib/editor-store")).useEditorStore.getState();
    const totalDuration = state.project.duration;
    const totalFrames = Math.ceil(framerate * totalDuration);

    // Create composite canvas for frame rendering
    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = outW;
    compositeCanvas.height = outH;
    const ctx = compositeCanvas.getContext("2d")!;

    // Load fonts if needed
    const hasTextClips = state.clips.some((c: Clip) => c.type === "text" && c.textContent);
    if (hasTextClips) {
      await document.fonts.ready;
    }

    // ── Step 1: Render all frames to JPEG files ──
    this.report("rendering-frames", 10, { totalFrames });

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      if (this.cancelled) return;

      const time = frameIdx / framerate;
      this.renderFrame(ctx, state, time, outW, outH, video, canvas);

      await writeCanvasFrameJPEG(ffmpeg, compositeCanvas, frameIdx, 0.92);

      if (frameIdx % 5 === 0) {
        const progress = 10 + (frameIdx / totalFrames) * 45;
        this.report("rendering-frames", progress, {
          currentFrame: frameIdx + 1,
          totalFrames,
        });
      }
    }

    if (this.cancelled) return;

    // ── Step 2: Extract audio if available ──
    let hasAudio = false;
    if (video && this.settings.includeAudio && video.src) {
      this.report("encoding-audio", 56);
      try {
        const audioData = await this.extractAudioFromVideo(video);
        if (audioData) {
          await writeFFmpegFile(ffmpeg, "audio.wav", audioData);
          hasAudio = true;
        }
      } catch {
        // Audio extraction failed, continue without audio
      }
    }

    if (this.cancelled) return;

    // ── Step 3: Encode with FFmpeg ──
    this.report("encoding-video", 60);

    const codecArgs = this.getFFmpegCodecArgs();
    const outputName = `output.${format === "mov" ? "mp4" : format}`;

    const args: string[] = [
      // Input frames
      "-framerate", String(framerate),
      "-i", "frame%06d.jpg",
    ];

    if (hasAudio) {
      args.push("-i", "audio.wav");
    }

    args.push(...codecArgs);

    if (hasAudio) {
      args.push(
        "-c:a", this.getAudioCodecArg(),
        "-b:a", `${audioBitrate}k`,
      );
    } else {
      args.push("-an");
    }

    // Pixel format for compatibility
    args.push("-pix_fmt", this.settings.pixelFormat || "yuv420p");

    // Fast start for web playback
    if (this.settings.fastStart && format === "mp4") {
      args.push("-movflags", "+faststart");
    }

    args.push(outputName);

    await execFFmpeg(ffmpeg, args);

    if (this.cancelled) return;

    // ── Step 4: Read output file ──
    this.report("muxing", 90);

    const outputData = await readFFmpegFile(ffmpeg, outputName);
    const mimeType = FORMAT_INFO[format].mime;
    const url = uint8ToBlobUrl(outputData, mimeType);

    // ── Cleanup ──
    this.report("finalizing", 95);
    for (let i = 0; i < totalFrames; i++) {
      const padded = String(i).padStart(6, "0");
      await deleteFFmpegFile(ffmpeg, `frame${padded}.jpg`).catch(() => {});
    }
    await deleteFFmpegFile(ffmpeg, "audio.wav").catch(() => {});
    await deleteFFmpegFile(ffmpeg, outputName).catch(() => {});

    const fileSize = outputData.length;

    this.report("complete", 100, {
      outputUrl: url,
      fileSize,
      totalFrames,
    });

    this.callbacks.onComplete(url, fileSize);
  }

  // ─── FFmpeg WASM Audio Export ──────────────────────────────────────────

  private async exportAudioFFmpeg(video: HTMLVideoElement | null): Promise<void> {
    if (!video || !video.src) {
      throw new Error("No audio source available");
    }

    this.report("loading-ffmpeg", 5);

    const ffmpeg = await getFFmpeg(({ phase, ratio }) => {
      if (phase === "downloading") this.report("loading-ffmpeg", 5 + ratio * 10);
    });

    if (this.cancelled) return;

    // Extract audio from video element
    this.report("encoding-audio", 20);
    const audioData = await this.extractAudioFromVideo(video);
    if (!audioData) throw new Error("Could not extract audio from source");

    await writeFFmpegFile(ffmpeg, "input.wav", audioData);

    if (this.cancelled) return;

    // Encode to target format
    this.report("encoding-audio", 50);

    const { format, audioBitrate, sampleRate, channels } = this.settings;
    const outputName = `output.${format}`;

    const args: string[] = ["-i", "input.wav"];

    switch (format) {
      case "mp3":
        args.push("-codec:a", "libmp3lame", "-b:a", `${audioBitrate}k`);
        if (sampleRate) args.push("-ar", String(sampleRate));
        break;
      case "wav":
        args.push("-codec:a", "pcm_s16le");
        if (sampleRate) args.push("-ar", String(sampleRate));
        if (channels) args.push("-ac", String(channels));
        break;
      case "aac":
        args.push("-codec:a", "aac", "-b:a", `${audioBitrate}k`);
        if (sampleRate) args.push("-ar", String(sampleRate));
        break;
      case "flac":
        args.push("-codec:a", "flac");
        if (sampleRate) args.push("-ar", String(sampleRate));
        break;
      case "ogg":
        args.push("-codec:a", "libvorbis", "-b:a", `${audioBitrate}k`);
        if (sampleRate) args.push("-ar", String(sampleRate));
        break;
      default:
        args.push("-codec:a", "copy");
    }

    args.push("-vn", outputName);

    await execFFmpeg(ffmpeg, args);

    if (this.cancelled) return;

    // Read output
    this.report("finalizing", 90);
    const outputData = await readFFmpegFile(ffmpeg, outputName);
    const mimeType = FORMAT_INFO[format].mime;
    const url = uint8ToBlobUrl(outputData, mimeType);

    // Cleanup
    await deleteFFmpegFile(ffmpeg, "input.wav").catch(() => {});
    await deleteFFmpegFile(ffmpeg, outputName).catch(() => {});

    const fileSize = outputData.length;
    this.report("complete", 100, { outputUrl: url, fileSize });
    this.callbacks.onComplete(url, fileSize);
  }

  // ─── GIF Export (unchanged — uses custom GifEncoder) ──────────────────

  private async exportGif(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): Promise<void> {
    this.report("rendering-frames", 5);

    const { framerate, loop, dither } = this.settings;
    const res = RESOLUTIONS[this.settings.resolution];
    const outW = this.settings.width || res.width;
    const outH = this.settings.height || res.height;

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = outW;
    compositeCanvas.height = outH;
    const ctx = compositeCanvas.getContext("2d")!;

    const state = (await import("@/lib/editor-store")).useEditorStore.getState();
    const totalDuration = state.project.duration;
    const gifFramerate = Math.min(framerate, 15);
    const frameInterval = 1000 / gifFramerate;
    const totalFrames = Math.ceil(gifFramerate * totalDuration);

    const hasTextClips = state.clips.some((c: Clip) => c.type === "text" && c.textContent);
    if (hasTextClips) await document.fonts.ready;

    const encoder = new GifEncoder({
      width: outW, height: outH,
      quality: 10,
      loop: loop ?? 0,
      dither: dither ?? true,
    });

    let frameCount = 0;

    return new Promise((resolve, reject) => {
      const renderFrame = () => {
        if (this.cancelled) { this.report("cancelled", 0); resolve(); return; }

        const time = frameCount / gifFramerate;
        if (time > totalDuration) {
          this.report("encoding-video", 80);
          try {
            const blob = encoder.encode();
            const url = URL.createObjectURL(blob);
            this.report("complete", 100, { outputUrl: url, fileSize: blob.size, totalFrames: frameCount });
            this.callbacks.onComplete(url, blob.size);
            resolve();
          } catch (err) { reject(new Error(`GIF encoding failed: ${err}`)); }
          return;
        }

        ctx.clearRect(0, 0, outW, outH);
        if (video) { try { video.currentTime = time; } catch {} ctx.drawImage(video, 0, 0, outW, outH); }
        else if (canvas) { ctx.drawImage(canvas, 0, 0, outW, outH); }
        else { ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, outW, outH); }

        if (hasTextClips && this.settings.includeSubtitles) {
          this.renderTextOverlays(ctx, state.clips, time, outW, outH);
        }

        encoder.addFrame(compositeCanvas, Math.round(frameInterval));
        frameCount++;

        const progress = 5 + (frameCount / totalFrames) * 70;
        this.report("rendering-frames", progress, { currentFrame: frameCount, totalFrames });
        setTimeout(renderFrame, frameInterval);
      };

      renderFrame();
    });
  }

  // ─── Shared Frame Rendering ────────────────────────────────────────────

  private renderFrame(
    ctx: CanvasRenderingContext2D,
    state: any,
    time: number,
    width: number,
    height: number,
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
  ) {
    ctx.clearRect(0, 0, width, height);

    if (video) {
      try { video.currentTime = time; } catch {}
      ctx.drawImage(video, 0, 0, width, height);
    } else if (canvas) {
      ctx.drawImage(canvas, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, width, height);
    }

    // Text overlays
    if (this.settings.includeSubtitles) {
      this.renderTextOverlays(ctx, state.clips, time, width, height);
    }

    // Fade in/out
    for (const clip of state.clips) {
      const relTime = time - clip.startTime;
      if (relTime < 0 || relTime > clip.duration) continue;
      if (clip.fadeIn && relTime < clip.fadeIn) {
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${1 - relTime / clip.fadeIn})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      if (clip.fadeOut && clip.duration - relTime < clip.fadeOut) {
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${1 - (clip.duration - relTime) / clip.fadeOut})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }

  private renderTextOverlays(
    ctx: CanvasRenderingContext2D,
    clips: Clip[],
    time: number,
    width: number,
    height: number,
  ) {
    for (const clip of clips) {
      if (clip.type !== "text" || !clip.textContent) continue;
      const relTime = time - clip.startTime;
      if (relTime < 0 || relTime > clip.duration) continue;

      const ts = clip.textStyle;
      let text = clip.textContent;
      let fontSize = ts?.fontSize || 48;

      const currentSub = clip.subtitles?.find(
        (s: { start: number; end: number }) => relTime >= s.start && relTime <= s.end,
      );
      if (currentSub) { text = currentSub.text; fontSize = Math.min(fontSize, 36); }

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
        if (br > 0) { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.fill(); }
        else { ctx.fillRect(bx, by, bw, bh); }
      }

      if (ts?.shadowColor) {
        ctx.shadowColor = ts.shadowColor;
        ctx.shadowBlur = ts.shadowBlur || 4;
        ctx.shadowOffsetX = ts.shadowOffsetX || 2;
        ctx.shadowOffsetY = ts.shadowOffsetY || 2;
      }

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

  // ─── Audio Extraction ──────────────────────────────────────────────────

  private async extractAudioFromVideo(video: HTMLVideoElement): Promise<Uint8Array | null> {
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);

      const state = (await import("@/lib/editor-store")).useEditorStore.getState();
      const duration = state.project.duration;

      const recorder = new MediaRecorder(dest.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      return new Promise<Uint8Array | null>((resolve) => {
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const buf = await blob.arrayBuffer();
          audioCtx.close();
          resolve(new Uint8Array(buf));
        };

        recorder.onerror = () => { audioCtx.close(); resolve(null); };

        recorder.start();

        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, duration * 1000 + 500);
      });
    } catch {
      return null;
    }
  }

  // ─── Codec Helpers ─────────────────────────────────────────────────────

  private getFFmpegCodecArgs(): string[] {
    const { videoCodec, crf, videoBitrate } = this.settings;

    switch (videoCodec) {
      case "h264":
        return ["-c:v", "libx264", "-crf", String(crf || 23), "-preset", "medium"];
      case "h265":
        return ["-c:v", "libx265", "-crf", String(crf || 28), "-preset", "medium",
          "-tag:v", "hvc1"];
      case "vp9":
        return ["-c:v", "libvpx-vp9", "-crf", String(crf || 30), "-b:v", `${videoBitrate}k`,
          "-deadline", "good", "-cpu-used", "4"];
      case "vp8":
        return ["-c:v", "libvpx", "-crf", String(crf || 25), "-b:v", `${videoBitrate}k`,
          "-deadline", "good"];
      case "av1":
        return ["-c:v", "libsvtav1", "-crf", String(crf || 30), "-preset", "6"];
      default:
        return ["-c:v", "libx264", "-crf", "23"];
    }
  }

  private getAudioCodecArg(): string {
    switch (this.settings.audioCodec) {
      case "aac": return "aac";
      case "mp3": return "libmp3lame";
      case "vorbis": return "libvorbis";
      case "opus": return "libopus";
      case "flac": return "flac";
      case "pcm_s16le": return "pcm_s16le";
      default: return "aac";
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
