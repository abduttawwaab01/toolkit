import type { Effect } from "@/types/editor";

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: Omit<Effect, "id">[];
}

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "warm-glow",
    name: "Warm Glow",
    description: "Warm tones with a soft glow",
    icon: "🌅",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 25 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 10 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 10 } },
      { type: "gaussian-blur", name: "Gaussian Blur", enabled: true, params: { radius: 0.5 } },
    ],
  },
  {
    id: "cool-mood",
    name: "Cool Mood",
    description: "Cool blue tones for a moody look",
    icon: "❄",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: -30 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -10 } },
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Teal/orange film grade with letterbox",
    icon: "🎬",
    effects: [
      { type: "cinematic", name: "Cinematic", enabled: true, params: { strength: 60 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 10 } },
    ],
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description: "Faded warm retro film look",
    icon: "📽",
    effects: [
      { type: "vintage", name: "Vintage", enabled: true, params: { strength: 60 } },
      { type: "sepia", name: "Sepia", enabled: true, params: { amount: 30 } },
    ],
  },
  {
    id: "noir",
    name: "Film Noir",
    description: "High contrast black and white",
    icon: "🕶",
    effects: [
      { type: "noir", name: "Noir", enabled: true, params: { strength: 80 } },
      { type: "grayscale", name: "Grayscale", enabled: true, params: { amount: 100 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 30 } },
    ],
  },
  {
    id: "dreamy",
    name: "Dreamy",
    description: "Soft, ethereal look with bloom",
    icon: "✨",
    effects: [
      { type: "gaussian-blur", name: "Gaussian Blur", enabled: true, params: { radius: 1.5 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 5 } },
    ],
  },
  {
    id: "hdr",
    name: "HDR Look",
    description: "Punchy high dynamic range style",
    icon: "🌄",
    effects: [
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 25 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 20 } },
      { type: "exposure", name: "Exposure", enabled: true, params: { amount: 0.3 } },
    ],
  },
  {
    id: "bleach-bypass",
    name: "Bleach Bypass",
    description: "Desaturated with high contrast",
    icon: "🧪",
    effects: [
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -50 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 30 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 5 } },
    ],
  },
  {
    id: "dawn",
    name: "Golden Dawn",
    description: "Golden hour warmth",
    icon: "🌤",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 40 } },
      { type: "exposure", name: "Exposure", enabled: true, params: { amount: 0.5 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 15 } },
    ],
  },
  {
    id: "neon",
    name: "Neon Nights",
    description: "Pink and cyan cyberpunk vibe",
    icon: "🌃",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: -20 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 30 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 20 } },
      { type: "hue", name: "Hue Shift", enabled: true, params: { amount: 10 } },
    ],
  },
];

export function getPresetById(id: string): EffectPreset | undefined {
  return EFFECT_PRESETS.find((p) => p.id === id);
}
