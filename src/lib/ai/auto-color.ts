"use client";

export interface ColorGradeResult {
  adjustedImageData: ImageData;
  settings: AutoColorSettings;
}

export interface AutoColorSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
}

export function autoColorGrade(
  imageData: ImageData,
): ColorGradeResult {
  const pixels = imageData.data;
  const len = pixels.length;
  const w = imageData.width;
  const h = imageData.height;

  // 1. Histogram analysis
  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);

  for (let i = 0; i < len; i += 4) {
    histR[pixels[i]]++;
    histG[pixels[i + 1]]++;
    histB[pixels[i + 2]]++;
  }

  // 2. Calculate black point (1st percentile) and white point (99th percentile)
  const totalPixels = len / 4;
  const blackTarget = Math.floor(totalPixels * 0.01);
  const whiteTarget = Math.floor(totalPixels * 0.99);

  let blackPointR = 0, whitePointR = 255;
  let blackPointG = 0, whitePointG = 255;
  let blackPointB = 0, whitePointB = 255;

  let cumR = 0;
  for (let i = 0; i < 256; i++) { cumR += histR[i]; if (cumR > blackTarget) { blackPointR = i; break; } }
  cumR = 0;
  for (let i = 255; i >= 0; i--) { cumR += histR[i]; if (cumR > totalPixels - whiteTarget) { whitePointR = i; break; } }

  let cumG = 0;
  for (let i = 0; i < 256; i++) { cumG += histG[i]; if (cumG > blackTarget) { blackPointG = i; break; } }
  cumG = 0;
  for (let i = 255; i >= 0; i--) { cumG += histG[i]; if (cumG > totalPixels - whiteTarget) { whitePointG = i; break; } }

  let cumB = 0;
  for (let i = 0; i < 256; i++) { cumB += histB[i]; if (cumB > blackTarget) { blackPointB = i; break; } }
  cumB = 0;
  for (let i = 255; i >= 0; i--) { cumB += histB[i]; if (cumB > totalPixels - whiteTarget) { whitePointB = i; break; } }

  // 3. Calculate average color for white balance
  let avgR = 0, avgG = 0, avgB = 0, count = 0;
  for (let i = 0; i < len; i += 4) {
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    if (lum > 30 && lum < 225) {
      avgR += pixels[i];
      avgG += pixels[i + 1];
      avgB += pixels[i + 2];
      count++;
    }
  }
  if (count > 0) {
    avgR /= count;
    avgG /= count;
    avgB /= count;
  }

  // 4. Calculate adjustments
  const brightness = 0;
  const contrast = (128 - (blackPointR + whitePointR) / 2) / 128 * 10;
  const saturation = 5;
  const temperature = ((avgR - avgB) / 255) * 15;
  const tint = ((avgG - (avgR + avgB) / 2) / 255) * 10;
  const highlights = (255 - whitePointR) / 255 * 15;
  const shadows = blackPointR / 255 * 15;

  const settings: AutoColorSettings = {
    brightness: Math.round(brightness * 10) / 10,
    contrast: Math.round(Math.max(-50, Math.min(50, contrast)) * 10) / 10,
    saturation: Math.round(Math.max(-50, Math.min(50, saturation)) * 10) / 10,
    temperature: Math.round(Math.max(-50, Math.min(50, temperature)) * 10) / 10,
    tint: Math.round(Math.max(-50, Math.min(50, tint)) * 10) / 10,
    highlights: Math.round(Math.max(-50, Math.min(50, highlights)) * 10) / 10,
    shadows: Math.round(Math.max(-50, Math.min(50, shadows)) * 10) / 10,
  };

  // 5. Apply the corrections
  const result = new Uint8ClampedArray(pixels);
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < len; i += 4) {
    let r = result[i];
    let g = result[i + 1];
    let b = result[i + 2];

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Highlights & Shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const highlightFactor = 1 + (settings.highlights / 100) * (lum / 255);
    const shadowFactor = 1 + (settings.shadows / 100) * (1 - lum / 255);
    r *= highlightFactor * shadowFactor;
    g *= highlightFactor * shadowFactor;
    b *= highlightFactor * shadowFactor;

    // Temperature (warm/cool)
    r += settings.temperature;
    b -= settings.temperature;

    // Tint (green/magenta)
    g -= settings.tint;

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const satFactor = 1 + settings.saturation / 100;
    r = gray + (r - gray) * satFactor;
    g = gray + (g - gray) * satFactor;
    b = gray + (b - gray) * satFactor;

    result[i] = Math.max(0, Math.min(255, r));
    result[i + 1] = Math.max(0, Math.min(255, g));
    result[i + 2] = Math.max(0, Math.min(255, b));
  }

  return {
    adjustedImageData: new ImageData(result, w, h),
    settings,
  };
}

export function applyStylePreset(
  imageData: ImageData,
  style: "cinematic" | "vintage" | "noir" | "warm" | "cool" | "dramatic",
): ImageData {
  const presets: Record<string, AutoColorSettings> = {
    cinematic: { brightness: -5, contrast: 25, saturation: -10, temperature: 5, tint: -3, highlights: -20, shadows: 20 },
    vintage: { brightness: 5, contrast: 10, saturation: -20, temperature: 15, tint: 5, highlights: -10, shadows: -10 },
    noir: { brightness: -10, contrast: 40, saturation: -100, temperature: 0, tint: 0, highlights: -30, shadows: 30 },
    warm: { brightness: 5, contrast: 5, saturation: 10, temperature: 20, tint: -5, highlights: 5, shadows: -5 },
    cool: { brightness: 5, contrast: 5, saturation: 5, temperature: -20, tint: 5, highlights: 5, shadows: -5 },
    dramatic: { brightness: -15, contrast: 50, saturation: 15, temperature: 5, tint: 0, highlights: -40, shadows: 40 },
  };

  const settings = presets[style] || presets.cinematic;
  const pixels = imageData.data;
  const len = pixels.length;
  const result = new Uint8ClampedArray(pixels);
  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));

  for (let i = 0; i < len; i += 4) {
    let r = result[i];
    let g = result[i + 1];
    let b = result[i + 2];

    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    r += settings.temperature;
    b -= settings.temperature;
    g -= settings.tint;

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const satFactor = 1 + settings.saturation / 100;
    r = gray + (r - gray) * satFactor;
    g = gray + (g - gray) * satFactor;
    b = gray + (b - gray) * satFactor;

    r += settings.brightness;
    g += settings.brightness;
    b += settings.brightness;

    result[i] = Math.max(0, Math.min(255, r));
    result[i + 1] = Math.max(0, Math.min(255, g));
    result[i + 2] = Math.max(0, Math.min(255, b));
  }

  return new ImageData(result, imageData.width, imageData.height);
}
