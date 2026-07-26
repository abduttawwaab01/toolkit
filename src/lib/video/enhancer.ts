"use client";

export interface EnhancementOptions {
  targetWidth: number;
  targetHeight: number;
  sharpening: number;
  contrast: number;
  saturation: number;
  denoise: number;
}

export interface CompressOptions {
  targetBitrate: number;
  targetWidth: number;
  targetHeight: number;
  quality: number;
  codec: string;
}

export function enhanceVideoFrame(
  sourceCanvas: HTMLCanvasElement,
  options: EnhancementOptions,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = options.targetWidth;
  canvas.height = options.targetHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw scaled
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, options.targetWidth, options.targetHeight);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Sharpening (unsharp mask)
  if (options.sharpening > 0) {
    const strength = options.sharpening / 100;
    const copy = new Uint8ClampedArray(data);
    const w = canvas.width;
    const h = canvas.height;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const blurIdx = ((y - 1) * w + x) * 4;
        const blurIx = (y * w + (x - 1)) * 4;
        const blurIx2 = (y * w + (x + 1)) * 4;
        const blurIy = ((y + 1) * w + x) * 4;

        for (let c = 0; c < 3; c++) {
          const blurred = (copy[blurIdx + c] + copy[blurIx + c] + copy[blurIx2 + c] + copy[blurIy + c]) / 4;
          data[idx + c] = Math.max(0, Math.min(255, copy[idx + c] + (copy[idx + c] - blurred) * strength));
        }
      }
    }
  }

  // Contrast
  if (options.contrast !== 0) {
    const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
  }

  // Saturation
  if (options.saturation !== 0) {
    const factor = 1 + options.saturation / 100;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = Math.max(0, Math.min(255, gray + (r - gray) * factor));
      data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * factor));
      data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * factor));
    }
  }

  // Denoise (basic median filter)
  if (options.denoise > 0) {
    const strength = Math.round(options.denoise / 20);
    if (strength > 0) {
      const copy = new Uint8ClampedArray(data);
      const w = canvas.width;
      for (let y = strength; y < canvas.height - strength; y++) {
        for (let x = strength; x < w - strength; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            let sum = 0, count = 0;
            for (let dy = -strength; dy <= strength; dy++) {
              for (let dx = -strength; dx <= strength; dx++) {
                sum += copy[((y + dy) * w + (x + dx)) * 4 + c];
                count++;
              }
            }
            data[idx + c] = sum / count;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function compressVideo(
  source: string,
  options: CompressOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = source;
    video.muted = true;
    video.playsInline = true;

    video.addEventListener("loadedmetadata", () => {
      const canvas = document.createElement("canvas");
      canvas.width = options.targetWidth;
      canvas.height = options.targetHeight;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(30);
      const mimeType = options.codec;

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: options.targetBitrate,
        });
      } catch {
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp8",
            videoBitsPerSecond: options.targetBitrate,
          });
        } catch {
          reject(new Error("No supported codec"));
          return;
        }
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        video.pause();
        video.src = "";
        resolve(blob);
      };
      mediaRecorder.onerror = () => {
        reject(new Error("Encoding error"));
      };

      mediaRecorder.start(100);

      video.addEventListener("play", () => {
        let lastTime = -1;
        const draw = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          if (video.currentTime !== lastTime) {
            lastTime = video.currentTime;
            ctx.drawImage(video, 0, 0, options.targetWidth, options.targetHeight);
          }
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      });

      video.play().catch(reject);
    });

    video.addEventListener("error", () => reject(new Error("Video load error")));
  });
}

export const QUALITY_PRESETS = [
  { label: "480p (SD)", width: 854, height: 480, bitrate: 2500000 },
  { label: "720p (HD)", width: 1280, height: 720, bitrate: 5000000 },
  { label: "1080p (Full HD)", width: 1920, height: 1080, bitrate: 8000000 },
  { label: "2K (QHD)", width: 2560, height: 1440, bitrate: 16000000 },
  { label: "4K (UHD)", width: 3840, height: 2160, bitrate: 35000000 },
  { label: "8K (Full Ultra HD)", width: 7680, height: 4320, bitrate: 80000000 },
];

export const COMPRESSION_PRESETS = [
  { label: "Maximum Quality", bitrate: 0, quality: 1.0 },
  { label: "High Quality", bitrate: 0, quality: 0.8 },
  { label: "Standard", bitrate: 0, quality: 0.6 },
  { label: "Compressed", bitrate: 0, quality: 0.4 },
  { label: "Small File", bitrate: 0, quality: 0.2 },
];
