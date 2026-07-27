#!/usr/bin/env node

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const ort = require("onnxruntime-node");

const MODEL_DIR = join(__dirname, "models");
const TARGET_SR = 48000;
const FFT_SIZE = 960;
const HOP_SIZE = 480;
const WIN_SIZE = 480;
const NUM_ERB_BANDS = 32;
const DF_ORDER = 5;

let encSession, erbDecSession, dfDecSession;
let modelLoaded = false;

async function loadModels() {
  if (modelLoaded) return;
  if (process.send) process.send({ type: "progress", phase: "loading", chunk: 0, total: 1 });
  encSession = await ort.InferenceSession.create(join(MODEL_DIR, "dfn3_enc.onnx"));
  erbDecSession = await ort.InferenceSession.create(join(MODEL_DIR, "dfn3_erb_dec.onnx"));
  dfDecSession = await ort.InferenceSession.create(join(MODEL_DIR, "dfn3_df_dec.onnx"));
  modelLoaded = true;
}

function fft(re, im) {
  const n = re.length;
  const outRe = new Float32Array(re);
  const outIm = new Float32Array(n);
  if (im) outIm.set(im);
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [outRe[i], outRe[j]] = [outRe[j], outRe[i]];
      [outIm[i], outIm[j]] = [outIm[j], outIm[i]];
    }
    let k = n >> 1;
    while (k <= j) { j -= k; k >>= 1; }
    j += k;
  }
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let jj = 0; jj < halfLen; jj++) {
        const k = i + jj;
        const l = k + halfLen;
        const tr = wr * outRe[l] - wi * outIm[l];
        const ti = wr * outIm[l] + wi * outRe[l];
        outRe[l] = outRe[k] - tr;
        outIm[l] = outIm[k] - ti;
        outRe[k] += tr;
        outIm[k] += ti;
        const wtemp = wr;
        wr = wtemp * Math.cos(angle) - wi * Math.sin(angle);
        wi = wtemp * Math.sin(angle) + wi * Math.cos(angle);
      }
    }
  }
  return { real: outRe, imag: outIm };
}

function ifft(re, im) {
  const n = re.length;
  const conjIm = new Float32Array(n);
  for (let i = 0; i < n; i++) conjIm[i] = -im[i];
  const result = fft(re, conjIm);
  for (let i = 0; i < n; i++) {
    result.real[i] /= n;
    result.imag[i] = -result.imag[i] / n;
  }
  return result;
}

function hannWindow(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / n));
  return w;
}

function resample(samples, fromSr, toSr) {
  if (fromSr === toSr) return samples;
  const ratio = fromSr / toSr;
  const outLen = Math.round(samples.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i * ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;
    out[i] = samples[idx] * (1 - frac) + (samples[Math.min(idx + 1, samples.length - 1)] || 0) * frac;
  }
  return out;
}

function erbFreqs(nBands, maxFreq) {
  const minErb = 24.7 + 21.0307 * 0.02;
  const maxErb = 24.7 + 21.0307 * maxFreq / 1000;
  const erbPoints = [];
  for (let i = 0; i <= nBands; i++) {
    const erb = minErb + (maxErb - minErb) * (i / nBands);
    const hz = (Math.pow(10, (erb - 24.7) / 21.0307) - 1) * 1000;
    erbPoints.push(Math.min(hz, maxFreq));
  }
  return erbPoints;
}

function computeErbFeatures(magSpec, nFft, sampleRate) {
  const nBins = nFft / 2 + 1;
  const erbEdges = erbFreqs(NUM_ERB_BANDS, sampleRate / 2);
  const binFreqs = [];
  for (let i = 0; i < nBins; i++) binFreqs.push((i * sampleRate) / nFft);
  const nFrames = magSpec[0] ? magSpec[0].length : 0;
  const features = new Float32Array(NUM_ERB_BANDS * nFrames);
  for (let band = 0; band < NUM_ERB_BANDS; band++) {
    const lo = erbEdges[band];
    const hi = erbEdges[band + 1];
    for (let frame = 0; frame < nFrames; frame++) {
      let energy = 0;
      for (let bin = 0; bin < nBins; bin++) {
        if (binFreqs[bin] >= lo && binFreqs[bin] < hi) {
          energy += magSpec[bin][frame] * magSpec[bin][frame];
        }
      }
      features[band * nFrames + frame] = Math.log(1 + Math.sqrt(energy));
    }
  }
  return features;
}

function stft(signal, fftSize, hopSize, winSize) {
  const window = hannWindow(winSize);
  const nBins = fftSize / 2 + 1;
  const nFrames = Math.floor((signal.length - winSize) / hopSize) + 1;
  const real = Array.from({ length: nBins }, () => new Float32Array(nFrames));
  const imag = Array.from({ length: nBins }, () => new Float32Array(nFrames));
  for (let frame = 0; frame < nFrames; frame++) {
    const start = frame * hopSize;
    const frameRe = new Float32Array(fftSize);
    for (let i = 0; i < winSize && start + i < signal.length; i++) {
      frameRe[i] = signal[start + i] * window[i];
    }
    const { real: r, imag: im } = fft(frameRe);
    for (let bin = 0; bin < nBins; bin++) {
      real[bin][frame] = r[bin];
      imag[bin][frame] = im[bin];
    }
  }
  return { real, imag, nFrames, nBins };
}

function iSTFT(real, imag, fftSize, hopSize, winSize, outputLen) {
  const window = hannWindow(winSize);
  const nBins = fftSize / 2 + 1;
  const nFrames = real[0] ? real[0].length : 0;
  const output = new Float32Array(outputLen);
  const norm = new Float32Array(outputLen);
  for (let frame = 0; frame < nFrames; frame++) {
    const start = frame * hopSize;
    const fullRe = new Float32Array(fftSize);
    const fullIm = new Float32Array(fftSize);
    for (let bin = 0; bin < nBins; bin++) {
      fullRe[bin] = real[bin][frame];
      fullIm[bin] = imag[bin][frame];
    }
    for (let bin = nBins; bin < fftSize; bin++) {
      fullRe[bin] = fullRe[fftSize - bin];
      fullIm[bin] = -fullIm[fftSize - bin];
    }
    const { real: ir } = ifft(fullRe, fullIm);
    for (let i = 0; i < winSize && start + i < outputLen; i++) {
      output[start + i] += ir[i] * window[i];
      norm[start + i] += window[i] * window[i];
    }
  }
  for (let i = 0; i < outputLen; i++) {
    if (norm[i] > 1e-8) output[i] /= norm[i];
  }
  return output;
}

function computeComplexFeatures(real, imag, fftSize) {
  const nBins = fftSize / 2 + 1;
  const nFrames = real[0] ? real[0].length : 0;
  const features = new Float32Array(2 * nFrames * nBins);
  for (let frame = 0; frame < nFrames; frame++) {
    for (let bin = 0; bin < nBins; bin++) {
      const mag = Math.sqrt(real[bin][frame] * real[bin][frame] + imag[bin][frame] * imag[bin][frame]);
      const phase = Math.atan2(imag[bin][frame], real[bin][frame]);
      features[(0 * nFrames + frame) * nBins + bin] = mag;
      features[(1 * nFrames + frame) * nBins + bin] = phase;
    }
  }
  return features;
}

async function denoiseWithDeepFilterNet(samples, sampleRate) {
  await loadModels();
  const originalLen = samples.length;
  const padLen = (HOP_SIZE - (samples.length % HOP_SIZE)) % HOP_SIZE;
  if (padLen > 0) {
    const padded = new Float32Array(samples.length + padLen);
    padded.set(samples);
    samples = padded;
  }
  const { real, imag, nFrames, nBins } = stft(samples, FFT_SIZE, HOP_SIZE, WIN_SIZE);
  const erbFeatures = computeErbFeatures(real.map(r => Array.from(r)), FFT_SIZE, TARGET_SR);
  const specFeatures = computeComplexFeatures(real, imag, FFT_SIZE);
  const nSpecBins = FFT_SIZE / 2 + 1;
  const erbTensor = new ort.Tensor("float32", erbFeatures, [1, 1, NUM_ERB_BANDS, nFrames]);
  const specTensor = new ort.Tensor("float32", specFeatures, [1, 1, 2, nFrames, nSpecBins]);
  const encOut = await encSession.run({ feat_erb: erbTensor, feat_spec: specTensor });
  const erbDecOut = await erbDecSession.run({
    emb: encOut.emb, e0: encOut.e0, e1: encOut.e1, e2: encOut.e2, e3: encOut.e3,
  });
  const dfDecOut = await dfDecSession.run({ emb: encOut.emb, c0: encOut.c0 });
  const gains = dfDecOut.coefs.data;
  const outReal = Array.from({ length: nBins }, () => new Float32Array(nFrames));
  const outImag = Array.from({ length: nBins }, () => new Float32Array(nFrames));
  for (let bin = 0; bin < nBins; bin++) {
    for (let frame = 0; frame < nFrames; frame++) {
      const gainIdx = frame * nBins + bin;
      const gain = gains[gainIdx] || 0;
      const g = 1.0 + Math.max(-0.9, Math.min(0.9, gain));
      outReal[bin][frame] = real[bin][frame] * g;
      outImag[bin][frame] = imag[bin][frame] * g;
    }
  }
  const denoised = iSTFT(outReal, outImag, FFT_SIZE, HOP_SIZE, WIN_SIZE, samples.length);
  return denoised.slice(0, originalLen);
}

function wavToFloat32(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let offset = 12;
  while (offset < buf.length - 8) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    offset += 4;
    const chunkSize = buf.readUInt32LE(offset);
    offset += 4;
    if (chunkId === "fmt ") {
      const audioFormat = buf.readUInt16LE(offset);
      const numChannels = buf.readUInt16LE(offset + 2);
      const sampleRate = buf.readUInt32LE(offset + 4);
      const bitsPerSample = buf.readUInt16LE(offset + 10);
      offset += chunkSize;
      while (offset < buf.length - 8) {
        const dc = buf.toString("ascii", offset, offset + 4);
        offset += 4;
        const dataSize = buf.readUInt32LE(offset);
        offset += 4;
        if (dc === "data") {
          const bytesPerSample = bitsPerSample / 8;
          const numSamples = Math.floor(dataSize / (numChannels * bytesPerSample));
          const samples = new Float32Array(numSamples);
          for (let i = 0; i < numSamples; i++) {
            let sum = 0;
            for (let ch = 0; ch < numChannels; ch++) {
              if (bitsPerSample === 16) {
                sum += buf.readInt16LE(offset) / 32768.0;
              } else if (bitsPerSample === 24) {
                const b0 = buf[offset]; const b1 = buf[offset + 1]; const b2 = buf[offset + 2];
                const val = (b2 << 24 | b1 << 16 | b0 << 8) >> 8;
                sum += val / 8388608.0;
              } else if (bitsPerSample === 32) {
                sum += buf.readInt32LE(offset) / 2147483648.0;
              }
              offset += bytesPerSample;
            }
            samples[i] = sum / numChannels;
          }
          return { samples, sampleRate, numChannels, bitsPerSample };
        }
        offset += chunkSize;
      }
    }
    offset += chunkSize;
  }
  throw new Error("Could not parse WAV header");
}

function float32ToWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * bytesPerSample;
  const totalSize = 44 + dataSize;
  const buf = Buffer.alloc(totalSize);
  buf.write("RIFF", 0); buf.writeUInt32LE(totalSize - 8, 4);
  buf.write("WAVE", 8); buf.write("fmt ", 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buf.writeUInt16LE(numChannels * bytesPerSample, 32); buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36); buf.writeUInt32LE(dataSize, 40);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), off);
    off += 2;
  }
  return buf;
}

process.on("message", async (msg) => {
  if (msg.type === "denoise") {
    try {
      const start = Date.now();
      if (process.send) process.send({ type: "progress", phase: "loading", chunk: 0, total: 1 });
      await loadModels();
      if (process.send) process.send({ type: "progress", phase: "processing", chunk: 1, total: 3 });
      const wavBuffer = Buffer.from(msg.audioData, "base64");
      const parsed = wavToFloat32(wavBuffer);
      let samples = parsed.samples;
      const originalSr = parsed.sampleRate;
      if (originalSr !== TARGET_SR) {
        samples = resample(samples, originalSr, TARGET_SR);
      }
      if (process.send) process.send({ type: "progress", phase: "processing", chunk: 2, total: 3 });
      const denoised = await denoiseWithDeepFilterNet(samples, TARGET_SR);
      let result = denoised;
      if (originalSr !== TARGET_SR) {
        result = resample(denoised, TARGET_SR, originalSr);
      }
      const outWav = float32ToWav(result, originalSr);
      const durationMs = Date.now() - start;
      if (process.send) process.send({
        type: "result",
        audioData: outWav.toString("base64"),
        stats: { durationMs, sampleRate: originalSr, channels: 1 },
      });
    } catch (err) {
      if (process.send) process.send({ type: "error", message: err.message, stack: err.stack });
    }
  }
});

if (process.send) process.send({ type: "ready" });
