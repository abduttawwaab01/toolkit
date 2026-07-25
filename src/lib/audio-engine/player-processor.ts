"use client";

import type { AudioEffect } from "@/types/editor";
import { createVoiceChainer, createToneEnhancer, createNoiseRemover, createBgMusicRemover } from "./index";

export interface ProcessedChain {
  input: AudioNode;
  output: AudioNode;
  cleanup: () => void;
}

interface EffectNode {
  input: AudioNode;
  output: AudioNode;
  cleanup?: () => void;
}

function buildDynamicsCompressor(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const node = ctx.createDynamicsCompressor();
  node.threshold.value = params.threshold ?? -24;
  node.ratio.value = params.ratio ?? 4;
  node.attack.value = (params.attack ?? 3) / 1000;
  node.release.value = (params.release ?? 100) / 1000;
  node.knee.value = params.knee ?? 6;
  const makeup = ctx.createGain();
  makeup.gain.value = params.makeupGain ? Math.pow(10, (params.makeupGain - 6) / 20) : 1;
  node.connect(makeup);
  return { input: node, output: makeup };
}

function buildWaveShaper(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const node = ctx.createWaveShaper();
  const amount = params.amount ?? 0.5;
  const tone = params.tone ?? 0.5;
  const samples = 256;
  const curve = new Float32Array(samples);
  const k = amount * 10;
  for (let i = 0; i < samples; i++) {
    const x = (i / samples) * 2 - 1;
    curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x)) * (0.5 + tone * 0.5);
  }
  node.curve = curve;
  const output = ctx.createGain();
  output.gain.value = params.output ?? 0.7;
  node.connect(output);
  return { input: node, output };
}

function buildDelay(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const inputSplit = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = (params.delayTime ?? 250) / 1000;
  const feedback = ctx.createGain();
  feedback.gain.value = params.feedback ?? 0.3;
  const wet = ctx.createGain();
  wet.gain.value = params.wet ?? 0.3;
  const dry = ctx.createGain();
  dry.gain.value = 0.7;
  const merger = ctx.createGain();

  inputSplit.connect(dry);
  inputSplit.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(merger);
  dry.connect(merger);
  return { input: inputSplit, output: merger };
}

function buildConvolverReverb(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const roomSize = params.roomSize ?? 0.5;
  const decay = params.decay ?? 2;
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * decay;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2 * (1 - roomSize + 0.5));
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  const damping = ctx.createBiquadFilter();
  damping.type = "lowpass";
  damping.frequency.value = 20000 * (1 - (params.damping ?? 0.5) * 0.8);
  const wet = ctx.createGain();
  wet.gain.value = params.wet ?? 0.3;
  const dry = ctx.createGain();
  dry.gain.value = params.dry ?? 0.8;
  const merger = ctx.createGain();
  convolver.connect(damping);
  damping.connect(wet);
  wet.connect(merger);
  dry.connect(merger);
  return { input: dry, output: merger };
}

function buildSimpleChorus(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const inputSplit = ctx.createGain();
  const rate = params.rate ?? 1.5;
  const depth = params.depth ?? 0.5;
  const delayTime = (params.delay ?? 15) / 1000;
  const delay = ctx.createDelay(0.1);
  delay.delayTime.value = delayTime;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = rate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = depth * delayTime * 0.5;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);
  lfo.start();
  const wet = ctx.createGain();
  wet.gain.value = params.wet ?? 0.4;
  const dry = ctx.createGain();
  dry.gain.value = 0.6;
  const merger = ctx.createGain();
  inputSplit.connect(dry);
  inputSplit.connect(delay);
  delay.connect(wet);
  wet.connect(merger);
  dry.connect(merger);
  return {
    input: inputSplit,
    output: merger,
    cleanup: () => { try { lfo.stop(); } catch {} },
  };
}

function buildNoiseGate(ctx: AudioContext, params: Record<string, number>): EffectNode {
  const input = ctx.createGain();
  const output = ctx.createGain();
  output.gain.value = 1;
  return { input, output };
}

export function buildEffectChain(
  ctx: AudioContext,
  source: AudioNode,
  effects: AudioEffect[],
): ProcessedChain {
  let currentOutput: AudioNode = source;
  const nodes: AudioNode[] = [source];
  const cleanups: (() => void)[] = [];

  const enabledEffects = effects.filter((e) => e.enabled);

  for (const effect of enabledEffects) {
    let processor: EffectNode | null = null;

    switch (effect.type) {
      case "compressor":
        processor = buildDynamicsCompressor(ctx, effect.params);
        break;
      case "distortion":
        processor = buildWaveShaper(ctx, effect.params);
        break;
      case "delay":
        processor = buildDelay(ctx, effect.params);
        break;
      case "chorus":
        processor = buildSimpleChorus(ctx, effect.params);
        break;
      case "reverb":
        processor = buildConvolverReverb(ctx, effect.params);
        break;
      case "noise-gate":
        processor = buildNoiseGate(ctx, effect.params);
        break;
      case "voice-changer": {
        const vc = createVoiceChainer(ctx, {
          pitch: effect.params.pitch ?? 0,
          formant: effect.params.formant ?? 0,
          distortion: effect.params.distortion ?? 0,
          chorus: effect.params.chorus ?? 0,
          robot: effect.params.robot ?? 0,
        });
        processor = { input: vc.input, output: vc.output };
        break;
      }
      case "tone-enhancer": {
        const te = createToneEnhancer(ctx, {
          bass: effect.params.bass ?? 0,
          mid: effect.params.mid ?? 0,
          treble: effect.params.treble ?? 0,
          presence: effect.params.presence ?? 0,
          warmth: effect.params.warmth ?? 0,
          compressor: effect.params.compressor ?? 0,
        });
        processor = { input: te.input, output: te.output };
        break;
      }
      case "noise-removal": {
        const nr = createNoiseRemover(ctx, {
          gateThreshold: effect.params.gateThreshold ?? -50,
          gateAttack: effect.params.gateAttack ?? 0.01,
          gateRelease: effect.params.gateRelease ?? 0.3,
          hissReduction: effect.params.hissReduction ?? 0,
          humRemoval: effect.params.humRemoval ?? 0,
        });
        processor = { input: nr.input, output: nr.output };
        break;
      }
      case "bg-music-removal": {
        const bgm = createBgMusicRemover(ctx, {
          strength: effect.params.strength ?? 0.5,
          lowCut: effect.params.lowCut ?? 0,
          centerWidth: effect.params.centerWidth ?? 0.5,
          preserveVocals: effect.params.preserveVocals ?? 0,
        });
        processor = { input: bgm.input, output: bgm.output };
        break;
      }
    }

    if (processor) {
      currentOutput.connect(processor.input);
      nodes.push(processor.input, processor.output);
      currentOutput = processor.output;
      if (processor.cleanup) cleanups.push(processor.cleanup);
    }
  }

  return {
    input: source,
    output: currentOutput,
    cleanup: () => {
      for (const c of cleanups) c();
      for (let i = nodes.length - 1; i >= 0; i--) {
        try { nodes[i].disconnect(); } catch {}
      }
    },
  };
}
