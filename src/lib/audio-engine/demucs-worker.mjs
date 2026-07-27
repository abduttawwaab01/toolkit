#!/usr/bin/env node

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

const pkgPath = require.resolve("demucs/package.json");
const baseDir = dirname(pkgPath);
const dist = join(baseDir, "dist");
const modelPath = join(baseDir, "htdemucs.onnx");
const modelData = readFileSync(modelPath).buffer;

const { ONNXHTDemucs } = await import(join(dist, "onnx-htdemucs.js"));
const { separateTracks } = await import(join(dist, "apply.js"));
const { wavToSamples, samplesToWav } = await import(join(dist, "wav-utils.js"));

function mixAudioBuffers(buffers) {
  if (buffers.length === 0) return null;
  const ref = buffers[0];
  const numChannels = ref.channelData.length;
  const length = ref.channelData[0].length;
  const mixed = { channelData: [], sampleRate: ref.sampleRate };
  for (let ch = 0; ch < numChannels; ch++) {
    mixed.channelData.push(new Float32Array(length));
    for (const buf of buffers) {
      const src = buf.channelData[ch] || buf.channelData[0];
      for (let i = 0; i < length; i++) {
        mixed.channelData[ch][i] += src[i] || 0;
      }
    }
    const peak = Math.max(...mixed.channelData[ch].map(Math.abs), 1e-6);
    const gain = Math.min(1 / peak, 1);
    for (let i = 0; i < length; i++) {
      mixed.channelData[ch][i] *= gain;
    }
  }
  return mixed;
}

process.on("message", async (msg) => {
  if (msg.type === "separate") {
    try {
      const audioBuffer = Buffer.from(msg.audioData);
      const mode = msg.mode || "4";
      const model = await ONNXHTDemucs.init(modelData);
      const rawAudio = wavToSamples(new Uint8Array(audioBuffer));

      const tracks = await separateTracks(model, rawAudio, (chunk, total) => {
        if (process.send) {
          process.send({ type: "progress", chunk, total });
        }
      });

      const toWavBuffer = (t) => Buffer.from(samplesToWav(t.channelData, t.sampleRate));
      const result = {
        vocals: toWavBuffer(tracks.vocals).toString("base64"),
        drums: toWavBuffer(tracks.drums).toString("base64"),
        bass: toWavBuffer(tracks.bass).toString("base64"),
        other: toWavBuffer(tracks.other).toString("base64"),
      };

      if (mode === "2") {
        const accompaniment = mixAudioBuffers([tracks.drums, tracks.bass, tracks.other]);
        if (accompaniment) {
          result.accompaniment = toWavBuffer(accompaniment).toString("base64");
        }
      }

      if (process.send) {
        process.send({ type: "result", data: result });
      }
    } catch (err) {
      if (process.send) {
        process.send({ type: "error", message: err.message, stack: err.stack });
      }
    }
  }
});

if (process.send) {
  process.send({ type: "ready" });
}
