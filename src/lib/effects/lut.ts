/**
 * 3D LUT (.cube file) parser and applicator.
 * Parses Adobe .cube format and applies color grading to canvas pixels.
 */

export interface ParsedLUT {
  title: string;
  size: number; // LUT grid size (e.g. 33 for 33x33x33)
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  data: Float32Array; // RGB triplets, row-major [R][G][B]
}

/**
 * Parse a .cube LUT file.
 */
export function parseCubeLUT(content: string): ParsedLUT {
  const lines = content.split("\n");
  let title = "Untitled LUT";
  let size = 0;
  const domainMin: [number, number, number] = [0, 0, 0];
  const domainMax: [number, number, number] = [1, 1, 1];
  const dataLines: number[][] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("TITLE")) {
      title = line.replace(/^TITLE\s+"?([^"]+)"?.*$/, "$1").trim();
    } else if (line.startsWith("LUT_3D_SIZE")) {
      size = parseInt(line.split(/\s+/)[1], 10);
    } else if (line.startsWith("DOMAIN_MIN")) {
      const parts = line.split(/\s+/).slice(1).map(Number);
      domainMin[0] = parts[0] ?? 0;
      domainMin[1] = parts[1] ?? 0;
      domainMin[2] = parts[2] ?? 0;
    } else if (line.startsWith("DOMAIN_MAX")) {
      const parts = line.split(/\s+/).slice(1).map(Number);
      domainMax[0] = parts[0] ?? 1;
      domainMax[1] = parts[1] ?? 1;
      domainMax[2] = parts[2] ?? 1;
    } else if (/^\d/.test(line)) {
      const parts = line.split(/\s+/).map(Number);
      if (parts.length >= 3) {
        dataLines.push([parts[0], parts[1], parts[2]]);
      }
    }
  }

  if (size === 0) {
    size = Math.round(Math.cbrt(dataLines.length));
  }

  const data = new Float32Array(size * size * size * 3);
  for (let i = 0; i < dataLines.length && i < size * size * size; i++) {
    data[i * 3 + 0] = dataLines[i][0];
    data[i * 3 + 1] = dataLines[i][1];
    data[i * 3 + 2] = dataLines[i][2];
  }

  return { title, size, domainMin, domainMax, data };
}

/**
 * Trilinear interpolation lookup in a 3D LUT.
 */
function lutLookup(
  lut: ParsedLUT,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const { size, data, domainMin, domainMax } = lut;

  // Normalize to LUT domain
  const rn = (r - domainMin[0]) / (domainMax[0] - domainMin[0]);
  const gn = (g - domainMin[1]) / (domainMax[1] - domainMin[1]);
  const bn = (b - domainMin[2]) / (domainMax[2] - domainMin[2]);

  const rf = Math.max(0, Math.min(1, rn)) * (size - 1);
  const gf = Math.max(0, Math.min(1, gn)) * (size - 1);
  const bf = Math.max(0, Math.min(1, bn)) * (size - 1);

  const r0 = Math.floor(rf), r1 = Math.min(r0 + 1, size - 1);
  const g0 = Math.floor(gf), g1 = Math.min(g0 + 1, size - 1);
  const b0 = Math.floor(bf), b1 = Math.min(b0 + 1, size - 1);

  const rd = rf - r0, gd = gf - g0, bd = bf - b0;

  function idx(ri: number, gi: number, bi: number): number {
    return ((ri * size * size + gi * size + bi) * 3);
  }

  const result: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const v000 = data[idx(r0, g0, b0) + c];
    const v001 = data[idx(r0, g0, b1) + c];
    const v010 = data[idx(r0, g1, b0) + c];
    const v011 = data[idx(r0, g1, b1) + c];
    const v100 = data[idx(r1, g0, b0) + c];
    const v101 = data[idx(r1, g0, b1) + c];
    const v110 = data[idx(r1, g1, b0) + c];
    const v111 = data[idx(r1, g1, b1) + c];

    const v00 = v000 * (1 - bd) + v001 * bd;
    const v01 = v010 * (1 - bd) + v011 * bd;
    const v10 = v100 * (1 - bd) + v101 * bd;
    const v11 = v110 * (1 - bd) + v111 * bd;

    const v0 = v00 * (1 - gd) + v01 * gd;
    const v1 = v10 * (1 - gd) + v11 * gd;

    result[c] = v0 * (1 - rd) + v1 * rd;
  }

  return result;
}

/**
 * Apply a parsed LUT to an ImageData array (in-place).
 * @param intensity 0-1 blend factor
 */
export function applyLUTToImageData(
  imageData: ImageData,
  lut: ParsedLUT,
  intensity: number = 1,
): void {
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const [lr, lg, lb] = lutLookup(lut, r, g, b);

    data[i] = Math.round((r + (lr - r) * intensity) * 255);
    data[i + 1] = Math.round((g + (lg - g) * intensity) * 255);
    data[i + 2] = Math.round((b + (lb - b) * intensity) * 255);
  }
}

/**
 * Apply LUT effect to a canvas context.
 */
export function applyLUTToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lut: ParsedLUT,
  intensity: number = 1,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  applyLUTToImageData(imageData, lut, intensity);
  ctx.putImageData(imageData, 0, 0);
}
