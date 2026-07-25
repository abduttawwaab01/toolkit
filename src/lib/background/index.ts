"use client";

export interface ChromaKeyOptions {
  color: [number, number, number];
  similarity: number;
  smoothness: number;
  spillReduction: number;
}

export interface BackgroundTemplate {
  id: string;
  name: string;
  type: "solid" | "gradient" | "image" | "pattern";
  thumbnail: string;
  data: string;
}

export const BACKGROUND_TEMPLATES: BackgroundTemplate[] = [
  { id: "green", name: "Green Screen", type: "solid", thumbnail: "", data: "#00ff00" },
  { id: "blue", name: "Blue Screen", type: "solid", thumbnail: "", data: "#0000ff" },
  { id: "white", name: "White", type: "solid", thumbnail: "", data: "#ffffff" },
  { id: "black", name: "Black", type: "solid", thumbnail: "", data: "#000000" },
  { id: "grad-1", name: "Sunset", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #ff6b6b, #feca57)" },
  { id: "grad-2", name: "Ocean", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #48dbfb, #0abde3)" },
  { id: "grad-3", name: "Forest", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #2ecc71, #27ae60)" },
  { id: "grad-4", name: "Night", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #2c3e50, #1a1a2e)" },
  { id: "grad-5", name: "Gold", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #f39c12, #e67e22)" },
  { id: "grad-6", name: "Purple Haze", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #a29bfe, #6c5ce7)" },
  { id: "grad-7", name: "Cotton Candy", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #fd79a8, #e17055)" },
  { id: "grad-8", name: "Matrix", type: "gradient", thumbnail: "", data: "linear-gradient(135deg, #00b894, #00cec9)" },
  { id: "pattern-1", name: "Bubbles", type: "pattern", thumbnail: "", data: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)" },
  { id: "pattern-2", name: "Grid", type: "pattern", thumbnail: "", data: "repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)" },
];

export function chromaKeyRemove(
  sourceCanvas: HTMLCanvasElement | HTMLVideoElement,
  options: ChromaKeyOptions,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const isVideo = sourceCanvas instanceof HTMLVideoElement;
  canvas.width = isVideo ? sourceCanvas.videoWidth : sourceCanvas.width;
  canvas.height = isVideo ? sourceCanvas.videoHeight : sourceCanvas.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const [kr, kg, kb] = options.color;
  const sim = options.similarity / 100;
  const smooth = options.smoothness / 100;
  const spill = options.spillReduction / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dr = r - kr, dg = g - kg, db = b - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(255 * 255 * 3);

    if (dist < sim) {
      data[i + 3] = 0;
    } else if (dist < sim + smooth) {
      const alpha = (dist - sim) / smooth;
      data[i + 3] = Math.round(alpha * 255);
      if (spill > 0) {
        data[i] = Math.min(255, Math.max(0, r - (kr * spill * (1 - alpha))));
        data[i + 1] = Math.min(255, Math.max(0, g - (kg * spill * (1 - alpha))));
        data[i + 2] = Math.min(255, Math.max(0, b - (kb * spill * (1 - alpha))));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function replaceBackground(
  foregroundCanvas: HTMLCanvasElement,
  backgroundSource: HTMLCanvasElement | HTMLImageElement | string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = foregroundCanvas.width;
  canvas.height = foregroundCanvas.height;
  const ctx = canvas.getContext("2d")!;

  if (typeof backgroundSource === "string") {
    const gradient = backgroundSource;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  } else {
    ctx.drawImage(backgroundSource, 0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(foregroundCanvas, 0, 0);
  return canvas;
}

export function renderBackgroundOnCanvas(
  ctx: CanvasRenderingContext2D,
  template: BackgroundTemplate,
  width: number,
  height: number,
  customImage?: HTMLImageElement,
) {
  if (template.type === "solid") {
    ctx.fillStyle = template.data;
    ctx.fillRect(0, 0, width, height);
  } else if (template.type === "gradient" || template.type === "pattern") {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.fillStyle = template.data;
    tempCtx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  } else if (template.type === "image" && customImage) {
    ctx.drawImage(customImage, 0, 0, width, height);
  }
}
