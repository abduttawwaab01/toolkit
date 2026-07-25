"use client";

import type {
  CropRect, FrameSettings, CurvePoint, HSLChannels, ColorBalanceChannels,
  VignetteSettings, SelectionState, GradientMapSettings,
} from "@/types/image-editor";

function clamp(v: number, min = 0, max = 255): number {
  return v < min ? min : v > max ? max : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}

function getColorHueCategory(r: number, g: number, b: number): string {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 20) return "gray";
  if (mx === r && g < b) return "magenta";
  if (mx === r) return "red";
  if (mx === g && r < b) return "cyan";
  if (mx === g) return "green";
  if (mx === b && r < g) return "yellow";
  return "blue";
}

/* ── Core pipeline ── */

export function loadImageToCanvas(src: string): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve({ canvas, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  c.getContext("2d")!.drawImage(source, 0, 0);
  return c;
}

export function createDrawingCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

/* ── Adjustments (operate on ImageData in place) ── */

export function adjustExposure(data: ImageData, ev: number): void {
  if (ev === 0) return;
  const factor = Math.pow(2, ev);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(data.data[i] * factor);
    data.data[i + 1] = clamp(data.data[i + 1] * factor);
    data.data[i + 2] = clamp(data.data[i + 2] * factor);
  }
}

export function adjustTemperature(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const t = amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(data.data[i] + t * 30);
    data.data[i + 2] = clamp(data.data[i + 2] - t * 30);
  }
}

export function adjustTint(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const t = amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i + 1] = clamp(data.data[i + 1] + t * 20);
  }
}

export function adjustVibrance(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const factor = 1 + amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max - min;
    if (sat > 0) {
      const boost = 1 + (factor - 1) * (1 - sat / 255);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data.data[i] = clamp(gray + (r - gray) * boost);
      data.data[i + 1] = clamp(gray + (g - gray) * boost);
      data.data[i + 2] = clamp(gray + (b - gray) * boost);
    }
  }
}

export function adjustBrightness(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const factor = 1 + amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(data.data[i] * factor);
    data.data[i + 1] = clamp(data.data[i + 1] * factor);
    data.data[i + 2] = clamp(data.data[i + 2] * factor);
  }
}

export function adjustContrast(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const factor = (259 * (amount + 255)) / (255 * (259 - amount));
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(factor * (data.data[i] - 128) + 128);
    data.data[i + 1] = clamp(factor * (data.data[i + 1] - 128) + 128);
    data.data[i + 2] = clamp(factor * (data.data[i + 2] - 128) + 128);
  }
}

export function adjustHighlights(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const t = amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data.data[i + c];
      if (v > 128) data.data[i + c] = clamp(v + (v - 128) / 128 * t * 40);
    }
  }
}

export function adjustShadows(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const t = amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data.data[i + c];
      if (v < 128) data.data[i + c] = clamp(v + (128 - v) / 128 * t * 40);
    }
  }
}

export function adjustWhites(data: ImageData, amount: number): void {
  if (amount === 0) return;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (data.data[i + c] > 200) data.data[i + c] = clamp(data.data[i + c] + amount);
    }
  }
}

export function adjustBlacks(data: ImageData, amount: number): void {
  if (amount === 0) return;
  for (let i = 0; i < data.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (data.data[i + c] < 55) data.data[i + c] = clamp(data.data[i + c] + amount);
    }
  }
}

export function adjustSaturation(data: ImageData, amount: number): void {
  if (amount === 0) return;
  const factor = 1 + amount / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data.data[i] = clamp(gray + (r - gray) * factor);
    data.data[i + 1] = clamp(gray + (g - gray) * factor);
    data.data[i + 2] = clamp(gray + (b - gray) * factor);
  }
}

export function adjustClarity(data: ImageData, amount: number): void {
  if (amount <= 0) return;
  const strength = Math.round(amount / 10);
  if (strength === 0) return;
  const copy = new Uint8ClampedArray(data.data);
  const w = data.width, h = data.height;
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0, count = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            sum += copy[((y + dy) * w + (x + dx)) * 4 + c]; count++;
          }
        }
        data.data[idx + c] = clamp(copy[idx + c] + (copy[idx + c] - sum / count) * (strength * 0.15));
      }
    }
  }
}

export function adjustSharpen(data: ImageData, amount: number): void {
  if (amount <= 0) return;
  const strength = amount / 100;
  const copy = new Uint8ClampedArray(data.data);
  const w = data.width, h = data.height;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const orig = copy[idx + c];
        const blurred = (copy[((y - 1) * w + x) * 4 + c] + copy[(y * w + (x - 1)) * 4 + c] + copy[(y * w + (x + 1)) * 4 + c] + copy[((y + 1) * w + x) * 4 + c]) / 4;
        data.data[idx + c] = clamp(orig + (orig - blurred) * strength * 3);
      }
    }
  }
}

export function adjustDenoise(data: ImageData, amount: number): void {
  if (amount <= 0) return;
  const radius = Math.max(1, Math.round(amount / 15));
  const copy = new Uint8ClampedArray(data.data);
  const w = data.width, h = data.height;
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let sum = 0, count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            sum += copy[((y + dy) * w + (x + dx)) * 4 + c]; count++;
          }
        }
        data.data[idx + c] = sum / count;
      }
    }
  }
}

export function adjustGamma(data: ImageData, gamma: number): void {
  if (gamma === 100) return;
  const g = gamma / 100;
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = clamp(255 * Math.pow(data.data[i] / 255, 1 / g));
    data.data[i + 1] = clamp(255 * Math.pow(data.data[i + 1] / 255, 1 / g));
    data.data[i + 2] = clamp(255 * Math.pow(data.data[i + 2] / 255, 1 / g));
  }
}

/* ── Curves ── */

export function adjustCurve(data: ImageData, points: CurvePoint[]): void {
  if (!points || points.length < 2) return;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const lookup = new Float64Array(256);
  for (let v = 0; v <= 255; v++) {
    const t = v / 255;
    let i = 0;
    while (i < sorted.length - 1 && sorted[i + 1].x < t) i++;
    if (i >= sorted.length - 1) { lookup[v] = sorted[sorted.length - 1].y * 255; continue; }
    const p0 = sorted[i], p1 = sorted[i + 1];
    const seg = p1.x === p0.x ? 0 : (t - p0.x) / (p1.x - p0.x);
    lookup[v] = clamp(255 * lerp(p0.y, p1.y, seg));
  }
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = lookup[data.data[i]];
    data.data[i + 1] = lookup[data.data[i + 1]];
    data.data[i + 2] = lookup[data.data[i + 2]];
  }
}

/* ── HSL ── */

function applyHSLToChannel(data: ImageData, ch: string, hsl: { hue: number; saturation: number; luminance: number }): void {
  if (hsl.hue === 0 && hsl.saturation === 0 && hsl.luminance === 0) return;
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const cat = getColorHueCategory(r, g, b);
    if (cat !== ch && !(ch === "cyan" && cat === "green") && !(ch === "magenta" && cat === "red") && !(ch === "yellow" && cat === "blue")) {
      // Also check secondary matches
      const isSecondary = (ch === "cyan" && cat === "green") || (ch === "magenta" && cat === "red") || (ch === "yellow" && cat === "blue");
      if (!isSecondary) continue;
    }
    let [h, s, l] = rgbToHsl(r, g, b);
    h = (h + hsl.hue / 360) % 1;
    s = clamp01(s + hsl.saturation / 100);
    l = clamp01(l + hsl.luminance / 100);
    const [nr, ng, nb] = hslToRgb(h, s, l);
    data.data[i] = clamp(nr);
    data.data[i + 1] = clamp(ng);
    data.data[i + 2] = clamp(nb);
  }
}

function clamp01(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }

export function adjustHSL(data: ImageData, hsl: HSLChannels): void {
  applyHSLToChannel(data, "red", hsl.red);
  applyHSLToChannel(data, "green", hsl.green);
  applyHSLToChannel(data, "blue", hsl.blue);
  applyHSLToChannel(data, "cyan", hsl.cyan);
  applyHSLToChannel(data, "magenta", hsl.magenta);
  applyHSLToChannel(data, "yellow", hsl.yellow);
}

/* ── Color Balance ── */

export function adjustColorBalance(data: ImageData, cb: ColorBalanceChannels): void {
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    let ch: ColorBalanceChannels["shadows"];
    if (gray < 85) ch = cb.shadows as any;
    else if (gray > 170) ch = cb.highlights as any;
    else ch = cb.midtones as any;
    data.data[i] = clamp(r + ch.cyanRed);
    data.data[i + 1] = clamp(g + ch.magentaGreen);
    data.data[i + 2] = clamp(b + ch.yellowBlue);
  }
}

/* ── Vignette ── */

export function applyVignette(data: ImageData, vg: VignetteSettings): void {
  if (vg.amount === 0) return;
  const w = data.width, h = data.height;
  const cx = w / 2, cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const roundX = cx * (1 + (100 - vg.roundness) / 100);
  const roundY = cy * (1 + (100 - vg.roundness) / 100);
  const feather = vg.feather / 100;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / roundX, dy = (y - cy) / roundY;
      let dist = Math.sqrt(dx * dx + dy * dy);
      dist = Math.max(0, (dist - (1 - feather)) / feather);
      const darken = 1 - dist * (vg.amount / 100) * (1 - vg.highlights / 100);
      const i = (y * w + x) * 4;
      data.data[i] = clamp(data.data[i] * darken);
      data.data[i + 1] = clamp(data.data[i + 1] * darken);
      data.data[i + 2] = clamp(data.data[i + 2] * darken);
    }
  }
}

/* ── Gradient Map ── */

export function applyGradientMap(data: ImageData, gm: GradientMapSettings): void {
  if (!gm.colors || gm.colors.length < 2) return;
  const stops = gm.colors.map((c) => {
    const div = document.createElement("div");
    div.style.color = c;
    document.body.appendChild(div);
    const cs = getComputedStyle(div).color;
    document.body.removeChild(div);
    const m = cs.match(/\d+/g);
    return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
  }) as [number, number, number][];
  const numStops = stops.length;
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const pos = gray * (numStops - 1);
    const idx = Math.floor(pos);
    const t = pos - idx;
    if (idx >= numStops - 1) {
      data.data[i] = stops[numStops - 1][0];
      data.data[i + 1] = stops[numStops - 1][1];
      data.data[i + 2] = stops[numStops - 1][2];
    } else {
      data.data[i] = lerp(stops[idx][0], stops[idx + 1][0], t);
      data.data[i + 1] = lerp(stops[idx][1], stops[idx + 1][1], t);
      data.data[i + 2] = lerp(stops[idx][2], stops[idx + 1][2], t);
    }
  }
}

/* ── Posterize / Threshold ── */

export function applyPosterize(data: ImageData, levels: number): void {
  if (levels <= 1 || levels >= 256) return;
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.round(data.data[i] / step) * step;
    data.data[i + 1] = Math.round(data.data[i + 1] / step) * step;
    data.data[i + 2] = Math.round(data.data[i + 2] / step) * step;
  }
}

export function applyThreshold(data: ImageData, level: number): void {
  const t = clamp(level, 0, 255);
  for (let i = 0; i < data.data.length; i += 4) {
    const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const v = gray >= t ? 255 : 0;
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
  }
}

/* ── Pixelate ── */

export function applyPixelate(source: HTMLCanvasElement, blockSize: number): HTMLCanvasElement {
  if (blockSize <= 1) return source;
  const c = cloneCanvas(source);
  const ctx = c.getContext("2d")!;
  const w = c.width, h = c.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let y = 0; y < h; y += blockSize) {
    for (let x = 0; x < w; x += blockSize) {
      const idx = (y * w + x) * 4;
      const pr = d[idx], pg = d[idx + 1], pb = d[idx + 2];
      for (let dy = 0; dy < blockSize && y + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4;
          d[i] = pr; d[i + 1] = pg; d[i + 2] = pb;
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return c;
}

/* ── Selection masking ── */

export function createSelectionMask(w: number, h: number, sel: SelectionState): ImageData {
  const mask = new ImageData(w, h);
  const d = mask.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = false;
      if (sel.type === "rect") {
        inside = x >= sel.x && x <= sel.x + sel.w && y >= sel.y && y <= sel.y + sel.h;
      } else {
        const cx = sel.x + sel.w / 2, cy = sel.y + sel.h / 2;
        const rx = sel.w / 2, ry = sel.h / 2;
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        inside = dx * dx + dy * dy <= 1;
      }
      const idx = (y * w + x) * 4;
      if (sel.invert) inside = !inside;
      if (sel.feather > 0 && inside) {
        const cx = sel.x + sel.w / 2, cy = sel.y + sel.h / 2;
        const dist = Math.abs(x - cx) / (sel.w / 2);
        const edge = Math.max(0, (1 - dist) * (sel.feather / 50));
        d[idx] = 255; d[idx + 3] = clamp(128 + edge * 127);
      } else {
        d[idx] = inside ? 255 : 0;
        d[idx + 3] = inside ? 255 : 0;
      }
      d[idx + 1] = d[idx];
      d[idx + 2] = d[idx];
    }
  }
  return mask;
}

export function applySelection(data: ImageData, mask: ImageData): void {
  for (let i = 3; i < data.data.length; i += 4) {
    const alpha = mask.data[i];
    data.data[i] = Math.min(data.data[i], alpha);
  }
}

/* ── Local blur/sharpen brush ── */

export function applyBlurBrush(data: ImageData, x: number, y: number, radius: number, strength: number): void {
  const w = data.width, h = data.height;
  const copy = new Uint8ClampedArray(data.data);
  const r = Math.max(1, Math.round(radius));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const idx = (py * w + px) * 4;
      let sumR = 0, sumG = 0, sumB = 0, cnt = 0;
      for (let ky = -r; ky <= r; ky++) {
        for (let kx = -r; kx <= r; kx++) {
          const sx = Math.min(w - 1, Math.max(0, px + kx));
          const sy = Math.min(h - 1, Math.max(0, py + ky));
          const si = (sy * w + sx) * 4;
          sumR += copy[si]; sumG += copy[si + 1]; sumB += copy[si + 2]; cnt++;
        }
      }
      data.data[idx] = clamp(lerp(copy[idx], sumR / cnt, strength));
      data.data[idx + 1] = clamp(lerp(copy[idx + 1], sumG / cnt, strength));
      data.data[idx + 2] = clamp(lerp(copy[idx + 2], sumB / cnt, strength));
    }
  }
}

export function applySharpenBrush(data: ImageData, x: number, y: number, radius: number, strength: number): void {
  const w = data.width, h = data.height;
  const copy = new Uint8ClampedArray(data.data);
  const r = Math.max(1, Math.round(radius));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const idx = (py * w + px) * 4;
      const blurred = (
        copy[((py - 1) * w + px) * 4] + copy[(py * w + (px - 1)) * 4] +
        copy[(py * w + (px + 1)) * 4] + copy[((py + 1) * w + px) * 4]
      ) / 4;
      for (let c = 0; c < 3; c++) {
        data.data[idx + c] = clamp(lerp(copy[idx + c], copy[idx + c] + (copy[idx + c] - blurred) * 2, strength));
      }
    }
  }
}

/* ── Clone stamp ── */

export function applyCloneStamp(
  destData: ImageData, srcCanvas: HTMLCanvasElement,
  srcX: number, srcY: number, dstX: number, dstY: number,
  radius: number, opacity: number,
): void {
  const w = destData.width, h = destData.height;
  const srcCtx = srcCanvas.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, w, h);
  const r = Math.max(1, Math.round(radius));
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const dpx = Math.round(dstX + dx), dpy = Math.round(dstY + dy);
      if (dpx < 0 || dpx >= w || dpy < 0 || dpy >= h) continue;
      const spx = Math.min(w - 1, Math.max(0, Math.round(srcX + dx)));
      const spy = Math.min(h - 1, Math.max(0, Math.round(srcY + dy)));
      const si = (spy * w + spx) * 4;
      const di = (dpy * w + dpx) * 4;
      destData.data[di] = clamp(lerp(destData.data[di], srcData.data[si], opacity));
      destData.data[di + 1] = clamp(lerp(destData.data[di + 1], srcData.data[si + 1], opacity));
      destData.data[di + 2] = clamp(lerp(destData.data[di + 2], srcData.data[si + 2], opacity));
    }
  }
}

/* ── Eyedropper ── */

export function getPixelColor(canvas: HTMLCanvasElement, x: number, y: number): { r: number; g: number; b: number; hex: string } {
  const ctx = canvas.getContext("2d")!;
  const p = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex = "#" + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  return { r: p[0], g: p[1], b: p[2], hex };
}

/* ── Full render pipeline ── */

export function renderAdjustments(
  source: HTMLCanvasElement,
  adjustments: Record<string, number>,
  curves: CurvePoint[] | null,
  hsl: HSLChannels | null,
  colorBalance: ColorBalanceChannels | null,
  vignette: VignetteSettings | null,
  gradientMap: GradientMapSettings | null,
  posterize: number | null,
  threshold: number | null,
  activeFilter: ((r: number, g: number, b: number, s: number) => [number, number, number]) | null,
  filterStrength: number,
  selection: SelectionState | null,
): HTMLCanvasElement {
  const canvas = cloneCanvas(source);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (adjustments.gamma !== 100) adjustGamma(imageData, adjustments.gamma);
  if (adjustments.exposure) adjustExposure(imageData, adjustments.exposure);
  if (adjustments.temperature) adjustTemperature(imageData, adjustments.temperature);
  if (adjustments.tint) adjustTint(imageData, adjustments.tint);
  if (adjustments.vibrance) adjustVibrance(imageData, adjustments.vibrance);
  if (adjustments.brightness) adjustBrightness(imageData, adjustments.brightness);
  if (adjustments.contrast) adjustContrast(imageData, adjustments.contrast);
  if (adjustments.highlights) adjustHighlights(imageData, adjustments.highlights);
  if (adjustments.shadows) adjustShadows(imageData, adjustments.shadows);
  if (adjustments.whites) adjustWhites(imageData, adjustments.whites);
  if (adjustments.blacks) adjustBlacks(imageData, adjustments.blacks);
  if (adjustments.saturation) adjustSaturation(imageData, adjustments.saturation);

  if (curves && curves.length >= 2) adjustCurve(imageData, curves);
  if (hsl) adjustHSL(imageData, hsl);
  if (colorBalance) adjustColorBalance(imageData, colorBalance);

  if (activeFilter && filterStrength > 0) {
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = activeFilter(data[i], data[i + 1], data[i + 2], filterStrength);
      data[i] = clamp(r); data[i + 1] = clamp(g); data[i + 2] = clamp(b);
    }
  }

  if (gradientMap) applyGradientMap(imageData, gradientMap);
  if (posterize !== null) applyPosterize(imageData, posterize);
  if (threshold !== null) applyThreshold(imageData, threshold);

  if (adjustments.clarity) adjustClarity(imageData, adjustments.clarity);
  if (adjustments.sharpen) adjustSharpen(imageData, adjustments.sharpen);
  if (adjustments.denoise) adjustDenoise(imageData, adjustments.denoise);

  if (vignette && vignette.amount !== 0) applyVignette(imageData, vignette);

  ctx.putImageData(imageData, 0, 0);

  if (selection) {
    const mask = createSelectionMask(canvas.width, canvas.height, selection);
    const masked = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applySelection(masked, mask);
    ctx.putImageData(masked, 0, 0);
  }

  return canvas;
}

/* ── Crop & Transform ── */

export function applyCrop(source: HTMLCanvasElement, crop: CropRect): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.round(crop.w); c.height = Math.round(crop.h);
  c.getContext("2d")!.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  return c;
}

export function applyRotation(source: HTMLCanvasElement, angle: number): HTMLCanvasElement {
  if (angle === 0) return source;
  const w = source.width, h = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = angle % 180 === 0 ? w : h;
  canvas.height = angle % 180 === 0 ? h : w;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);
  return canvas;
}

export function applyFlip(source: HTMLCanvasElement, h: boolean, v: boolean): HTMLCanvasElement {
  if (!h && !v) return source;
  const canvas = document.createElement("canvas");
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(h ? source.width : 0, v ? source.height : 0);
  ctx.scale(h ? -1 : 1, v ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

export function resizeCanvas(source: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.round(w); c.height = Math.round(h);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c;
}

export function applyPixelateCanvas(source: HTMLCanvasElement, blockSize: number): HTMLCanvasElement {
  return applyPixelate(source, blockSize);
}

/* ── Frame ── */

export function applyFrame(source: HTMLCanvasElement, frame: FrameSettings): HTMLCanvasElement {
  const pad = frame.borderWidth + Math.abs(frame.shadowBlur) + Math.max(Math.abs(frame.shadowOffsetX), Math.abs(frame.shadowOffsetY));
  const c = document.createElement("canvas");
  c.width = source.width + pad * 2; c.height = source.height + pad * 2;
  const ctx = c.getContext("2d")!;

  if (frame.shadowBlur > 0) {
    ctx.shadowColor = frame.shadowColor; ctx.shadowBlur = frame.shadowBlur;
    ctx.shadowOffsetX = frame.shadowOffsetX; ctx.shadowOffsetY = frame.shadowOffsetY;
  }

  const rx = Math.min(frame.borderRadius, source.width / 2, source.height / 2);
  const x = pad, y = pad, w = source.width, h = source.height;

  ctx.beginPath(); ctx.roundRect(x, y, w, h, rx); ctx.fillStyle = "#fff"; ctx.fill();

  if (frame.shadowBlur > 0) { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, rx); ctx.clip();
  ctx.drawImage(source, x, y, w, h); ctx.restore();

  if (frame.borderWidth > 0) {
    ctx.strokeStyle = frame.borderColor; ctx.lineWidth = frame.borderWidth;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rx); ctx.stroke();
  }
  return c;
}

/* ── Drawing ── */

export function drawBrushStroke(canvas: HTMLCanvasElement, points: { x: number; y: number }[], size: number, color: string, opacity: number): void {
  const ctx = canvas.getContext("2d")!;
  ctx.globalAlpha = opacity; ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (points.length === 1) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawEraserStroke(canvas: HTMLCanvasElement, points: { x: number; y: number }[], size: number): void {
  const ctx = canvas.getContext("2d")!;
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,1)"; ctx.strokeStyle = "rgba(0,0,0,1)"; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (points.length === 1) { ctx.beginPath(); ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
}

export function drawShape(canvas: HTMLCanvasElement, shape: string, x1: number, y1: number, x2: number, y2: number, strokeColor: string, strokeWidth: number, fillColor: string | null, opacity: number): void {
  const ctx = canvas.getContext("2d")!; ctx.globalAlpha = opacity;
  const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  switch (shape) {
    case "rect": {
      if (fillColor) { ctx.fillStyle = fillColor; ctx.fillRect(x, y, w, h); }
      ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.strokeRect(x, y, w, h);
      break;
    }
    case "circle": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
      ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke();
      break;
    }
    case "line": { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke(); break; }
    case "arrow": {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.min(20, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 0.3);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath(); ctx.fillStyle = strokeColor; ctx.fill();
      break;
    }
  }
  ctx.globalAlpha = 1;
}

export function drawTextOnCanvas(canvas: HTMLCanvasElement, text: string, x: number, y: number, font: string, fontSize: number, color: string, opacity: number): void {
  const ctx = canvas.getContext("2d")!; ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px ${font}`; ctx.fillStyle = color; ctx.textBaseline = "top";
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * fontSize * 1.3);
  ctx.globalAlpha = 1;
}

/* ── Export ── */

export function canvasToBlob(canvas: HTMLCanvasElement, format: "png" | "jpeg" | "webp", quality: number): Promise<Blob> {
  const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), mime, quality);
  });
}
