import type { Effect } from "@/types/editor";

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  effects: Omit<Effect, "id">[];
}

export const EFFECT_PRESETS: EffectPreset[] = [
  // ── Classic Film ──
  {
    id: "warm-glow",
    name: "Warm Glow",
    description: "Warm tones with a soft glow",
    icon: "🌅",
    category: "film",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 25 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 10 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 10 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 20, radius: 60, feather: 40 } },
    ],
  },
  {
    id: "cool-mood",
    name: "Cool Mood",
    description: "Cool blue tones for a moody look",
    icon: "❄",
    category: "film",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: -30 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -10 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 25, radius: 50, feather: 50 } },
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Teal/orange film grade with letterbox",
    icon: "🎬",
    category: "film",
    effects: [
      { type: "cinematic", name: "Cinematic", enabled: true, params: { strength: 60 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 10 } },
      { type: "letterbox", name: "Letterbox", enabled: true, params: { ratio: 2.35 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 15, radius: 60, feather: 50 } },
    ],
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description: "Faded warm retro film look",
    icon: "📽",
    category: "film",
    effects: [
      { type: "vintage", name: "Vintage", enabled: true, params: { strength: 60 } },
      { type: "sepia", name: "Sepia", enabled: true, params: { amount: 30 } },
      { type: "film-grain", name: "Film Grain", enabled: true, params: { amount: 15, size: 40 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 30, radius: 50, feather: 40 } },
    ],
  },
  {
    id: "noir",
    name: "Film Noir",
    description: "High contrast black and white",
    icon: "🕶",
    category: "film",
    effects: [
      { type: "noir", name: "Noir", enabled: true, params: { strength: 80 } },
      { type: "grayscale", name: "Grayscale", enabled: true, params: { amount: 100 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 30 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 40, radius: 40, feather: 30 } },
    ],
  },
  // ── Modern Looks ──
  {
    id: "dreamy",
    name: "Dreamy",
    description: "Soft, ethereal look with bloom",
    icon: "✨",
    category: "stylistic",
    effects: [
      { type: "glow", name: "Glow", enabled: true, params: { amount: 40, radius: 15 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 5 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 15, radius: 60, feather: 60 } },
    ],
  },
  {
    id: "hdr",
    name: "HDR Look",
    description: "Punchy high dynamic range style",
    icon: "🌄",
    category: "color",
    effects: [
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 25 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 20 } },
      { type: "exposure", name: "Exposure", enabled: true, params: { amount: 0.3 } },
      { type: "sharpen", name: "Sharpen", enabled: true, params: { amount: 60 } },
    ],
  },
  {
    id: "bleach-bypass",
    name: "Bleach Bypass",
    description: "Desaturated with high contrast",
    icon: "🧪",
    category: "film",
    effects: [
      { type: "bleach-bypass", name: "Bleach Bypass", enabled: true, params: { strength: 70 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 20 } },
    ],
  },
  {
    id: "dawn",
    name: "Golden Dawn",
    description: "Golden hour warmth",
    icon: "🌤",
    category: "light",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 40 } },
      { type: "exposure", name: "Exposure", enabled: true, params: { amount: 0.5 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 15 } },
      { type: "sun-flare", name: "Sun Flare", enabled: true, params: { intensity: 30, warmth: 70 } },
    ],
  },
  {
    id: "neon",
    name: "Neon Nights",
    description: "Pink and cyan cyberpunk vibe",
    icon: "🌃",
    category: "color",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: -20 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 30 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 20 } },
      { type: "hue", name: "Hue Shift", enabled: true, params: { amount: 10 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 25, radius: 50, feather: 50 } },
    ],
  },
  // ── Color Grades ──
  {
    id: "teal-orange",
    name: "Teal & Orange",
    description: "Hollywood blockbuster color grade",
    icon: "🎨",
    category: "color",
    effects: [
      { type: "color-balance", name: "Color Balance", enabled: true, params: { red: 15, green: -5, blue: -15 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 12 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 10 } },
    ],
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft pastel tones",
    icon: "🌸",
    category: "color",
    effects: [
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -20 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: -10 } },
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 10 } },
    ],
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green-tinted cyberpunk look",
    icon: "🟢",
    category: "color",
    effects: [
      { type: "color-balance", name: "Color Balance", enabled: true, params: { red: -20, green: 30, blue: -10 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 25 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -15 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 35, radius: 45, feather: 40 } },
    ],
  },
  // ── Artistic ──
  {
    id: "pop-art",
    name: "Pop Art",
    description: "Bold posterized colors",
    icon: "🎭",
    category: "stylistic",
    effects: [
      { type: "posterize", name: "Posterize", enabled: true, params: { levels: 4 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 40 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 20 } },
    ],
  },
  {
    id: "lomo",
    name: "Lomo",
    description: "Lomography camera look",
    icon: "📷",
    category: "film",
    effects: [
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 30 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 20 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 50, radius: 35, feather: 30 } },
      { type: "cross-process", name: "Cross Process", enabled: true, params: { strength: 30 } },
    ],
  },
  {
    id: "cross-processed",
    name: "Cross Processed",
    description: "Chemical cross-processing film effect",
    icon: "🧪",
    category: "film",
    effects: [
      { type: "cross-process", name: "Cross Process", enabled: true, params: { strength: 70 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 10 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 20, radius: 55, feather: 45 } },
    ],
  },
  // ── Retro ──
  {
    id: "70s",
    name: "70s Throwback",
    description: "Warm faded 70s film stock",
    icon: "✌",
    category: "film",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 20 } },
      { type: "vintage", name: "Vintage", enabled: true, params: { strength: 40 } },
      { type: "film-grain", name: "Film Grain", enabled: true, params: { amount: 20, size: 60 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 25, radius: 50, feather: 40 } },
      { type: "fade-to-black", name: "Fade", enabled: true, params: { strength: 10 } },
    ],
  },
  {
    id: "80s-neon",
    name: "80s Neon",
    description: "Retro synthwave vibes",
    icon: "🌆",
    category: "color",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: -15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 25 } },
      { type: "hue", name: "Hue Shift", enabled: true, params: { amount: 350 } },
      { type: "glow", name: "Glow", enabled: true, params: { amount: 20, radius: 8 } },
      { type: "chromatic-aberration", name: "Chromatic Aberration", enabled: true, params: { offset: 2 } },
    ],
  },
  {
    id: "polaroid",
    name: "Polaroid",
    description: "Instant camera look",
    icon: "📸",
    category: "film",
    effects: [
      { type: "temperature", name: "Temperature", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -10 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: -5 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 15, radius: 65, feather: 55 } },
    ],
  },
  // ── Dramatic ──
  {
    id: "dramatic-bw",
    name: "Dramatic B&W",
    description: "Deep blacks, bright whites",
    icon: "🖤",
    category: "filter",
    effects: [
      { type: "grayscale", name: "Grayscale", enabled: true, params: { amount: 100 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 40 } },
      { type: "sharpen", name: "Sharpen", enabled: true, params: { amount: 30 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 30, radius: 45, feather: 35 } },
    ],
  },
  {
    id: "high-key",
    name: "High Key",
    description: "Bright, low-contrast airy look",
    icon: "☀",
    category: "light",
    effects: [
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 25 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: -15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -20 } },
      { type: "glow", name: "Glow", enabled: true, params: { amount: 15, radius: 10 } },
    ],
  },
  {
    id: "low-key",
    name: "Low Key",
    description: "Dark, moody dramatic look",
    icon: "🌑",
    category: "light",
    effects: [
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: -20 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 30 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: -15 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 45, radius: 40, feather: 35 } },
    ],
  },
  // ── Quick Looks ──
  {
    id: "sharp-pop",
    name: "Sharp Pop",
    description: "Sharpened and contrasty",
    icon: "🔪",
    category: "stylistic",
    effects: [
      { type: "sharpen", name: "Sharpen", enabled: true, params: { amount: 80 } },
      { type: "contrast", name: "Contrast", enabled: true, params: { amount: 15 } },
      { type: "saturation", name: "Saturation", enabled: true, params: { amount: 10 } },
    ],
  },
  {
    id: "soft-focus",
    name: "Soft Focus",
    description: "Flattering soft portrait look",
    icon: "🪞",
    category: "stylistic",
    effects: [
      { type: "glow", name: "Glow", enabled: true, params: { amount: 30, radius: 12 } },
      { type: "brightness", name: "Brightness", enabled: true, params: { amount: 8 } },
      { type: "vignette", name: "Vignette", enabled: true, params: { amount: 10, radius: 60, feather: 60 } },
    ],
  },
];

export function getPresetById(id: string): EffectPreset | undefined {
  return EFFECT_PRESETS.find((p) => p.id === id);
}

export function getPresetsByCategory(category: string): EffectPreset[] {
  return EFFECT_PRESETS.filter((p) => p.category === category);
}
