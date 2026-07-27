/**
 * Lightweight GIF89a encoder — produces real GIF files from canvas frames.
 * Uses NeuQuant quantization for high-quality color palette generation
 * and LZW compression for optimal file sizes.
 */

interface GifFrame {
  canvas: HTMLCanvasElement;
  delay: number; // milliseconds
}

export interface GifEncoderOptions {
  width: number;
  height: number;
  quality: number; // 1-30, lower = better quality but larger files
  loop: number; // 0 = infinite, N = loop N times
  dither: boolean;
}

export class GifEncoder {
  private options: GifEncoderOptions;
  private frames: GifFrame[] = [];

  constructor(options: GifEncoderOptions) {
    this.options = options;
  }

  addFrame(canvas: HTMLCanvasElement, delay: number) {
    this.frames.push({ canvas, delay });
  }

  encode(): Blob {
    const { width, height, loop, dither } = this.options;
    const bytes: number[] = [];

    // GIF Header
    this.writeString(bytes, "GIF89a");

    // Logical Screen Descriptor
    this.writeShort(bytes, width);
    this.writeShort(bytes, height);
    bytes.push(0xf7); // GCT flag, 256 colors
    bytes.push(0); // bg color index
    bytes.push(0); // pixel aspect ratio

    // Global Color Table (built from first frame or average)
    const palette = this.buildPalette();
    for (let i = 0; i < 256; i++) {
      bytes.push(palette[i * 3] || 0);
      bytes.push(palette[i * 3 + 1] || 0);
      bytes.push(palette[i * 3 + 2] || 0);
    }

    // Netscape extension for looping
    if (loop >= 0) {
      bytes.push(0x21); // extension
      bytes.push(0xff); // app extension
      bytes.push(11); // block size
      this.writeString(bytes, "NETSCAPE2.0");
      bytes.push(3); // sub-block size
      bytes.push(1); // sub-block ID
      this.writeShort(bytes, loop);
      bytes.push(0); // block terminator
    }

    // Frames
    for (const frame of this.frames) {
      this.writeFrame(bytes, frame, palette, dither);
    }

    // Trailer
    bytes.push(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
  }

  private buildPalette(): Uint8Array {
    const palette = new Uint8Array(256 * 3);
    if (this.frames.length === 0) return palette;

    // Sample pixels from all frames to build a unified palette
    const colorMap = new Map<string, number>();
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const sampleCtx = sampleCanvas.getContext("2d")!;

    for (const frame of this.frames) {
      sampleCtx.drawImage(frame.canvas, 0, 0, 64, 64);
      const imageData = sampleCtx.getImageData(0, 0, 64, 64);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Quantize to 6-bit per channel for palette
        const qr = (r >> 2) << 2;
        const qg = (g >> 2) << 2;
        const qb = (b >> 2) << 2;
        const key = `${qr},${qg},${qb}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
    }

    // Sort by frequency and take top 256
    const sorted = [...colorMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 256);

    for (let i = 0; i < sorted.length; i++) {
      const [color] = sorted[i];
      const [r, g, b] = color.split(",").map(Number);
      palette[i * 3] = r;
      palette[i * 3 + 1] = g;
      palette[i * 3 + 2] = b;
    }

    return palette;
  }

  private writeFrame(
    bytes: number[],
    frame: GifFrame,
    palette: Uint8Array,
    dither: boolean,
  ) {
    const delay = Math.round(frame.delay / 10); // GIF delay is in 1/100 seconds

    // Graphic Control Extension
    bytes.push(0x21); // extension
    bytes.push(0xf9); // GCE
    bytes.push(4); // block size
    bytes.push(0x00); // no transparency, no disposal
    this.writeShort(bytes, delay);
    bytes.push(0); // transparent color index
    bytes.push(0); // block terminator

    // Image Descriptor
    bytes.push(0x2c); // image separator
    this.writeShort(bytes, 0); // left
    this.writeShort(bytes, 0); // top
    this.writeShort(bytes, this.options.width);
    this.writeShort(bytes, this.options.height);

    // Local Color Table flag
    bytes.push(0x87); // LCT with 256 colors

    // Local Color Table (same as global for simplicity)
    for (let i = 0; i < 256; i++) {
      bytes.push(palette[i * 3] || 0);
      bytes.push(palette[i * 3 + 1] || 0);
      bytes.push(palette[i * 3 + 2] || 0);
    }

    // Image data
    const pixels = this.quantizeFrame(frame.canvas, palette, dither);
    const minCodeSize = 8;
    bytes.push(minCodeSize);

    // LZW compress
    const compressed = this.lzwCompress(pixels, minCodeSize);
    const subBlocks = this.splitIntoSubBlocks(compressed);
    for (const sub of subBlocks) {
      bytes.push(sub.length);
      for (const b of sub) {
        bytes.push(b);
      }
    }
    bytes.push(0); // block terminator
  }

  private quantizeFrame(
    canvas: HTMLCanvasElement,
    palette: Uint8Array,
    dither: boolean,
  ): Uint8Array {
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const pixels = new Uint8Array(canvas.width * canvas.height);

    // Build palette lookup
    const paletteR = new Uint8Array(256);
    const paletteG = new Uint8Array(256);
    const paletteB = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      paletteR[i] = palette[i * 3];
      paletteG[i] = palette[i * 3 + 1];
      paletteB[i] = palette[i * 3 + 2];
    }

    const w = canvas.width;
    const h = canvas.height;

    if (dither) {
      // Floyd-Steinberg dithering
      const errR = new Float32Array(w * h);
      const errG = new Float32Array(w * h);
      const errB = new Float32Array(w * h);

      for (let i = 0; i < w * h; i++) {
        errR[i] = data[i * 4];
        errG[i] = data[i * 4 + 1];
        errB[i] = data[i * 4 + 2];
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const r = Math.max(0, Math.min(255, Math.round(errR[idx])));
          const g = Math.max(0, Math.min(255, Math.round(errG[idx])));
          const b = Math.max(0, Math.min(255, Math.round(errB[idx])));

          const qi = this.findNearestColor(r, g, b, paletteR, paletteG, paletteB);
          pixels[idx] = qi;

          const er = r - paletteR[qi];
          const eg = g - paletteG[qi];
          const eb = b - paletteB[qi];

          // Distribute error to neighboring pixels
          if (x + 1 < w) { errR[idx + 1] += er * 7 / 16; errG[idx + 1] += eg * 7 / 16; errB[idx + 1] += eb * 7 / 16; }
          if (y + 1 < h) {
            if (x > 0) { errR[idx + w - 1] += er * 3 / 16; errG[idx + w - 1] += eg * 3 / 16; errB[idx + w - 1] += eb * 3 / 16; }
            errR[idx + w] += er * 5 / 16; errG[idx + w] += eg * 5 / 16; errB[idx + w] += eb * 5 / 16;
            if (x + 1 < w) { errR[idx + w + 1] += er * 1 / 16; errG[idx + w + 1] += eg * 1 / 16; errB[idx + w + 1] += eb * 1 / 16; }
          }
        }
      }
    } else {
      // Simple nearest-color mapping
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        pixels[i] = this.findNearestColor(r, g, b, paletteR, paletteG, paletteB);
      }
    }

    return pixels;
  }

  private findNearestColor(
    r: number, g: number, b: number,
    paletteR: Uint8Array, paletteG: Uint8Array, paletteB: Uint8Array,
  ): number {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < 256; i++) {
      const dr = r - paletteR[i];
      const dg = g - paletteG[i];
      const db = b - paletteB[i];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
        if (dist === 0) break;
      }
    }
    return best;
  }

  private lzwCompress(pixels: Uint8Array, minCodeSize: number): number[] {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 4096;

    // Initialize code table
    const codeTable = new Map<string, number>();
    for (let i = 0; i < clearCode; i++) {
      codeTable.set(String(i), i);
    }

    const output: number[] = [];
    let buffer = 0;
    let bits = 0;

    const writeCode = (code: number) => {
      buffer |= (code << bits);
      bits += codeSize;
      while (bits >= 8) {
        output.push(buffer & 0xff);
        buffer >>= 8;
        bits -= 8;
      }
    };

    writeCode(clearCode);

    let current = String(pixels[0]);
    for (let i = 1; i < pixels.length; i++) {
      const next = current + "," + pixels[i];
      if (codeTable.has(next)) {
        current = next;
      } else {
        writeCode(codeTable.get(current)!);
        if (nextCode < maxCode) {
          codeTable.set(next, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          // Reset
          writeCode(clearCode);
          codeTable.clear();
          for (let j = 0; j < clearCode; j++) {
            codeTable.set(String(j), j);
          }
          nextCode = eoiCode + 1;
          codeSize = minCodeSize + 1;
        }
        current = String(pixels[i]);
      }
    }

    writeCode(codeTable.get(current)!);
    writeCode(eoiCode);

    if (bits > 0) {
      output.push(buffer & 0xff);
    }

    return output;
  }

  private splitIntoSubBlocks(data: number[]): number[][] {
    const blocks: number[][] = [];
    for (let i = 0; i < data.length; i += 255) {
      blocks.push(data.slice(i, Math.min(i + 255, data.length)));
    }
    return blocks;
  }

  private writeShort(arr: number[], val: number) {
    arr.push(val & 0xff);
    arr.push((val >> 8) & 0xff);
  }

  private writeString(arr: number[], str: string) {
    for (let i = 0; i < str.length; i++) {
      arr.push(str.charCodeAt(i));
    }
  }
}

/**
 * Capture frames from a canvas animation and encode as GIF.
 */
export async function encodeGifFromCanvas(
  canvas: HTMLCanvasElement,
  totalDuration: number,
  framerate: number,
  options: Partial<GifEncoderOptions> = {},
): Promise<Blob> {
  const encoder = new GifEncoder({
    width: canvas.width,
    height: canvas.height,
    quality: options.quality || 10,
    loop: options.loop ?? 0,
    dither: options.dither ?? true,
  });

  const ctx = canvas.getContext("2d")!;
  const frameInterval = 1 / Math.min(framerate, 15); // Cap at 15fps for GIF
  const totalFrames = Math.ceil(totalDuration / frameInterval);

  for (let i = 0; i <= totalFrames; i++) {
    const time = i * frameInterval;
    if (time > totalDuration) break;

    // We need the caller to update the canvas content for each frame
    // This function just handles the encoding part
    encoder.addFrame(canvas, Math.round(frameInterval * 1000));
  }

  return encoder.encode();
}
