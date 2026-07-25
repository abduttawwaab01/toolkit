import type { AudioEffectDefinition, AudioEffectType, AudioEffect } from "@/types/editor";

const uuid = () => crypto.randomUUID();

export const AUDIO_EFFECT_DEFINITIONS: AudioEffectDefinition[] = [
  {
    id: "noise-gate",
    name: "Noise Gate",
    description: "Silences audio below a threshold",
    icon: "🚪",
    params: [
      { key: "threshold", label: "Threshold", default: -40, min: -80, max: -10, step: 1, unit: "dB" },
      { key: "attack", label: "Attack", default: 1, min: 0.1, max: 50, step: 0.1, unit: "ms" },
      { key: "release", label: "Release", default: 50, min: 5, max: 500, step: 5, unit: "ms" },
      { key: "hold", label: "Hold", default: 20, min: 0, max: 200, step: 5, unit: "ms" },
    ],
  },
  {
    id: "compressor",
    name: "Compressor",
    description: "Reduces dynamic range for consistent levels",
    icon: "📊",
    params: [
      { key: "threshold", label: "Threshold", default: -24, min: -60, max: 0, step: 1, unit: "dB" },
      { key: "ratio", label: "Ratio", default: 4, min: 1, max: 20, step: 0.5, unit: ":1" },
      { key: "attack", label: "Attack", default: 3, min: 0, max: 20, step: 0.1, unit: "ms" },
      { key: "release", label: "Release", default: 100, min: 10, max: 500, step: 10, unit: "ms" },
      { key: "knee", label: "Knee", default: 6, min: 0, max: 20, step: 1, unit: "dB" },
      { key: "makeupGain", label: "Make-up Gain", default: 6, min: 0, max: 24, step: 1, unit: "dB" },
    ],
  },
  {
    id: "reverb",
    name: "Reverb",
    description: "Adds ambience and space",
    icon: "🏛",
    params: [
      { key: "roomSize", label: "Room Size", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "decay", label: "Decay", default: 2, min: 0.1, max: 10, step: 0.1, unit: "s" },
      { key: "damping", label: "Damping", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "wet", label: "Wet Mix", default: 0.3, min: 0, max: 1, step: 0.05 },
      { key: "dry", label: "Dry Mix", default: 0.8, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "delay",
    name: "Delay",
    description: "Echo effect with feedback",
    icon: "⏳",
    params: [
      { key: "delayTime", label: "Delay Time", default: 250, min: 10, max: 1000, step: 10, unit: "ms" },
      { key: "feedback", label: "Feedback", default: 0.3, min: 0, max: 1, step: 0.05 },
      { key: "wet", label: "Wet Mix", default: 0.3, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "chorus",
    name: "Chorus",
    description: "Thickens audio with modulated delays",
    icon: "🎶",
    params: [
      { key: "rate", label: "Rate", default: 1.5, min: 0.1, max: 10, step: 0.1, unit: "Hz" },
      { key: "depth", label: "Depth", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "delay", label: "Delay", default: 15, min: 1, max: 40, step: 1, unit: "ms" },
      { key: "wet", label: "Wet Mix", default: 0.4, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "distortion",
    name: "Distortion",
    description: "Adds grit and saturation",
    icon: "🎸",
    params: [
      { key: "amount", label: "Amount", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "tone", label: "Tone", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "output", label: "Output", default: 0.7, min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    id: "voice-changer",
    name: "Voice Changer",
    description: "Pitch shift, formant, robot, chorus voice effects",
    icon: "🎙",
    params: [
      { key: "pitch", label: "Pitch", default: 0, min: -12, max: 12, step: 1, unit: "st" },
      { key: "formant", label: "Formant", default: 0, min: -5, max: 5, step: 0.5 },
      { key: "distortion", label: "Distortion", default: 0, min: 0, max: 1, step: 0.05 },
      { key: "chorus", label: "Chorus", default: 0, min: 0, max: 1, step: 0.05 },
      { key: "robot", label: "Robot", default: 0, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "tone-enhancer",
    name: "Tone Enhancer",
    description: "3-band EQ, warmth, presence, compression",
    icon: "🎛",
    params: [
      { key: "bass", label: "Bass", default: 0, min: -12, max: 12, step: 0.5, unit: "dB" },
      { key: "mid", label: "Mid", default: 0, min: -12, max: 12, step: 0.5, unit: "dB" },
      { key: "treble", label: "Treble", default: 0, min: -12, max: 12, step: 0.5, unit: "dB" },
      { key: "presence", label: "Presence", default: 0, min: 0, max: 10, step: 0.5 },
      { key: "warmth", label: "Warmth", default: 0, min: 0, max: 1, step: 0.05 },
      { key: "compressor", label: "Compression", default: 0, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "noise-removal",
    name: "Noise Removal",
    description: "Adaptive gate, hiss reduction, hum filter",
    icon: "🌊",
    params: [
      { key: "gateThreshold", label: "Gate Threshold", default: -50, min: -80, max: -10, step: 1, unit: "dB" },
      { key: "gateAttack", label: "Gate Attack", default: 0.01, min: 0, max: 0.1, step: 0.005, unit: "s" },
      { key: "gateRelease", label: "Gate Release", default: 0.3, min: 0, max: 1, step: 0.05, unit: "s" },
      { key: "hissReduction", label: "Hiss Reduction", default: 0, min: 0, max: 1, step: 0.05 },
      { key: "humRemoval", label: "Hum Removal", default: 0, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "bg-music-removal",
    name: "BG Music Removal",
    description: "Center channel extraction, karaoke, vocal isolate",
    icon: "🎵",
    params: [
      { key: "strength", label: "Strength", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "lowCut", label: "Low Cut", default: 0, min: 0, max: 1, step: 0.05 },
      { key: "centerWidth", label: "Center Width", default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: "preserveVocals", label: "Preserve Vocals", default: 0, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "silence-removal",
    name: "Silence Removal",
    description: "Auto-detect and trim silent sections",
    icon: "✂",
    params: [
      { key: "threshold", label: "Threshold", default: -50, min: -80, max: -10, step: 1, unit: "dB" },
      { key: "minSilence", label: "Min Silence", default: 0.5, min: 0.1, max: 3, step: 0.1, unit: "s" },
      { key: "padding", label: "Padding", default: 0.1, min: 0, max: 1, step: 0.05, unit: "s" },
    ],
  },
];

export function getAudioEffectDefinition(id: AudioEffectType): AudioEffectDefinition | undefined {
  return AUDIO_EFFECT_DEFINITIONS.find((e) => e.id === id);
}

export function createAudioEffect(type: AudioEffectType): AudioEffect {
  const def = getAudioEffectDefinition(type);
  const params: Record<string, number> = {};
  if (def) {
    for (const p of def.params) {
      params[p.key] = p.default;
    }
  }
  return {
    id: uuid(),
    type,
    name: def?.name ?? type,
    enabled: true,
    params,
  };
}
