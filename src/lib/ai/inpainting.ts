"use client";

export function inpaintRegion(
  imageData: ImageData,
  mask: boolean[],
  radius: number = 5,
): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const pixels = imageData.data;
  const result = new Uint8ClampedArray(pixels);

  const maskPixels: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        maskPixels.push({ x, y });
      }
    }
  }

  if (maskPixels.length === 0) return imageData;
  if (maskPixels.length === w * h) {
    // Entire image masked — fill with average color
    let avgR = 0, avgG = 0, avgB = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      avgR += pixels[i];
      avgG += pixels[i + 1];
      avgB += pixels[i + 2];
    }
    const n = pixels.length / 4;
    avgR /= n; avgG /= n; avgB /= n;
    for (let i = 0; i < pixels.length; i += 4) {
      result[i] = avgR;
      result[i + 1] = avgG;
      result[i + 2] = avgB;
    }
    return new ImageData(result, w, h);
  }

  for (const mp of maskPixels) {
    let sumR = 0, sumG = 0, sumB = 0, count = 0;

    const xMin = Math.max(0, mp.x - radius);
    const xMax = Math.min(w - 1, mp.x + radius);
    const yMin = Math.max(0, mp.y - radius);
    const yMax = Math.min(h - 1, mp.y + radius);

    for (let ny = yMin; ny <= yMax; ny++) {
      for (let nx = xMin; nx <= xMax; nx++) {
        if (mask[ny * w + nx]) continue;
        const dist = Math.sqrt((nx - mp.x) ** 2 + (ny - mp.y) ** 2);
        if (dist > radius) continue;
        const idx = (ny * w + nx) * 4;
        const weight = 1 / (dist + 1);
        sumR += pixels[idx] * weight;
        sumG += pixels[idx + 1] * weight;
        sumB += pixels[idx + 2] * weight;
        count += weight;
      }
    }

    if (count > 0) {
      const idx = (mp.y * w + mp.x) * 4;
      result[idx] = sumR / count;
      result[idx + 1] = sumG / count;
      result[idx + 2] = sumB / count;
    }
  }

  return new ImageData(result, w, h);
}

export function createBrushMask(
  w: number,
  h: number,
  centerX: number,
  centerY: number,
  brushRadius: number,
): boolean[] {
  const mask = new Array(w * h).fill(false);
  const r2 = brushRadius * brushRadius;

  const xMin = Math.max(0, Math.floor(centerX - brushRadius));
  const xMax = Math.min(w - 1, Math.ceil(centerX + brushRadius));
  const yMin = Math.max(0, Math.floor(centerY - brushRadius));
  const yMax = Math.min(h - 1, Math.ceil(centerY + brushRadius));

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= r2) {
        mask[y * w + x] = true;
      }
    }
  }

  return mask;
}
