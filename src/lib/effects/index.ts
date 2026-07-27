import type { EffectDefinition, Effect, EffectParamDefinition } from "@/types/editor";

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // ══════════════════════════════════════════════════════════════
  // COLOR (12 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "brightness",
    name: "Brightness",
    category: "color",
    description: "Adjust overall brightness",
    icon: "☀",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "contrast",
    name: "Contrast",
    category: "color",
    description: "Adjust contrast",
    icon: "◐",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "saturation",
    name: "Saturation",
    category: "color",
    description: "Adjust color intensity",
    icon: "🎨",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "hue",
    name: "Hue Shift",
    category: "color",
    description: "Shift colors around the color wheel",
    icon: "🔄",
    params: [
      { key: "amount", label: "Rotation", type: "number", default: 0, min: 0, max: 360, step: 1 },
    ],
  },
  {
    id: "exposure",
    name: "Exposure",
    category: "color",
    description: "Adjust exposure compensation",
    icon: "💡",
    params: [
      { key: "amount", label: "EV", type: "number", default: 0, min: -4, max: 4, step: 0.1 },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    category: "color",
    description: "Warm or cool the image",
    icon: "🌡",
    params: [
      { key: "amount", label: "Temperature", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "vibrance",
    name: "Vibrance",
    category: "color",
    description: "Intelligent saturation that protects skin tones",
    icon: "💎",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "shadows",
    name: "Shadows",
    category: "color",
    description: "Adjust dark areas independently",
    icon: "🌑",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "highlights",
    name: "Highlights",
    category: "color",
    description: "Adjust bright areas independently",
    icon: "🌕",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "gamma",
    name: "Gamma",
    category: "color",
    description: "Adjust midtone brightness",
    icon: "📊",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 1, min: 0.1, max: 3, step: 0.05 },
    ],
  },
  {
    id: "lift-gamma-gain",
    name: "Lift/Gamma/Gain",
    category: "color",
    description: "Professional 3-way color correction",
    icon: "🎛",
    params: [
      { key: "lift", label: "Lift", type: "number", default: 0, min: -100, max: 100, step: 1 },
      { key: "gamma", label: "Gamma", type: "number", default: 0, min: -100, max: 100, step: 1 },
      { key: "gain", label: "Gain", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "color-balance",
    name: "Color Balance",
    category: "color",
    description: "Shift RGB channel balance",
    icon: "🌈",
    params: [
      { key: "red", label: "Red", type: "number", default: 0, min: -100, max: 100, step: 1 },
      { key: "green", label: "Green", type: "number", default: 0, min: -100, max: 100, step: 1 },
      { key: "blue", label: "Blue", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // BLUR (6 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "gaussian-blur",
    name: "Gaussian Blur",
    category: "blur",
    description: "Softens the image with a blur",
    icon: "🌫",
    params: [
      { key: "radius", label: "Radius", type: "number", default: 2, min: 0, max: 50, step: 0.5 },
    ],
  },
  {
    id: "motion-blur",
    name: "Motion Blur",
    category: "blur",
    description: "Directional blur for motion effect",
    icon: "🏃",
    params: [
      { key: "radius", label: "Radius", type: "number", default: 5, min: 0, max: 50, step: 0.5 },
      { key: "angle", label: "Angle", type: "number", default: 0, min: 0, max: 360, step: 1 },
    ],
  },
  {
    id: "radial-blur",
    name: "Radial Blur",
    category: "blur",
    description: "Spin blur radiating from center",
    icon: "🌀",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 5, min: 0, max: 50, step: 1 },
    ],
  },
  {
    id: "zoom-blur",
    name: "Zoom Blur",
    category: "blur",
    description: "Blur that radiates outward from center",
    icon: "🚀",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 5, min: 0, max: 50, step: 1 },
    ],
  },
  {
    id: "lens-blur",
    name: "Lens Blur (Bokeh)",
    category: "blur",
    description: "Camera lens blur with bokeh highlights",
    icon: "📸",
    params: [
      { key: "radius", label: "Radius", type: "number", default: 3, min: 0, max: 30, step: 0.5 },
      { key: "brightness", label: "Highlight Brightness", type: "number", default: 0.5, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: "tilt-shift",
    name: "Tilt Shift",
    category: "blur",
    description: "Miniature/toy effect with selective focus",
    icon: "🏗",
    params: [
      { key: "amount", label: "Blur Strength", type: "number", default: 5, min: 0, max: 20, step: 0.5 },
      { key: "position", label: "Focus Position", type: "number", default: 50, min: 0, max: 100, step: 1 },
      { key: "feather", label: "Feather", type: "number", default: 30, min: 0, max: 100, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // FILTER (12 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "grayscale",
    name: "Grayscale",
    category: "filter",
    description: "Convert to black and white",
    icon: "⚫",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 100, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "sepia",
    name: "Sepia",
    category: "filter",
    description: "Vintage sepia tone",
    icon: "🟫",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 80, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "invert",
    name: "Invert",
    category: "filter",
    description: "Invert all colors",
    icon: "🔲",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 100, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "vintage",
    name: "Vintage",
    category: "filter",
    description: "Warm faded film look",
    icon: "📷",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic",
    category: "filter",
    description: "Teal/orange color grade",
    icon: "🎬",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 60, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "noir",
    name: "Noir",
    category: "filter",
    description: "High contrast black and white film noir",
    icon: "🕵",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 70, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "posterize",
    name: "Posterize",
    category: "filter",
    description: "Reduce color levels for a poster effect",
    icon: "🖼",
    params: [
      { key: "levels", label: "Color Levels", type: "number", default: 4, min: 2, max: 32, step: 1 },
    ],
  },
  {
    id: "threshold",
    name: "Threshold",
    category: "filter",
    description: "Convert to pure black and white",
    icon: "⬛",
    params: [
      { key: "level", label: "Threshold Level", type: "number", default: 128, min: 0, max: 255, step: 1 },
    ],
  },
  {
    id: "duotone",
    name: "Duotone",
    category: "filter",
    description: "Two-tone color mapping",
    icon: "🎭",
    params: [
      { key: "darkR", label: "Dark R", type: "number", default: 0, min: 0, max: 255, step: 1 },
      { key: "darkG", label: "Dark G", type: "number", default: 0, min: 0, max: 255, step: 1 },
      { key: "darkB", label: "Dark B", type: "number", default: 80, min: 0, max: 255, step: 1 },
      { key: "lightR", label: "Light R", type: "number", default: 255, min: 0, max: 255, step: 1 },
      { key: "lightG", label: "Light G", type: "number", default: 200, min: 0, max: 255, step: 1 },
      { key: "lightB", label: "Light B", type: "number", default: 0, min: 0, max: 255, step: 1 },
    ],
  },
  {
    id: "cross-process",
    name: "Cross Process",
    category: "filter",
    description: "Simulate cross-processing film technique",
    icon: "🧪",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "bleach-bypass",
    name: "Bleach Bypass",
    category: "filter",
    description: "Desaturated high-contrast film look",
    icon: "🧴",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "kodachrome",
    name: "Kodachrome",
    category: "filter",
    description: "Classic Kodak slide film color",
    icon: "🎞",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 60, min: 0, max: 100, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // STYLISTIC (10 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "sharpen",
    name: "Sharpen",
    category: "stylistic",
    description: "Enhance edge detail",
    icon: "🔪",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 50, min: 0, max: 200, step: 1 },
    ],
  },
  {
    id: "unsharp-mask",
    name: "Unsharp Mask",
    category: "stylistic",
    description: "Professional sharpening via mask",
    icon: "🎯",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 50, min: 0, max: 200, step: 1 },
      { key: "radius", label: "Radius", type: "number", default: 1, min: 0.5, max: 10, step: 0.5 },
    ],
  },
  {
    id: "vignette",
    name: "Vignette",
    category: "stylistic",
    description: "Darken edges for a focused look",
    icon: "🔘",
    params: [
      { key: "amount", label: "Strength", type: "number", default: 30, min: 0, max: 100, step: 1 },
      { key: "radius", label: "Size", type: "number", default: 50, min: 10, max: 100, step: 1 },
      { key: "feather", label: "Feather", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "emboss",
    name: "Emboss",
    category: "stylistic",
    description: "Raised 3D surface effect",
    icon: "🏔",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "edge-detect",
    name: "Edge Detect",
    category: "stylistic",
    description: "Highlight edges in the image",
    icon: "📐",
    params: [
      { key: "thickness", label: "Edge Thickness", type: "number", default: 1, min: 1, max: 5, step: 1 },
    ],
  },
  {
    id: "film-grain",
    name: "Film Grain",
    category: "stylistic",
    description: "Add realistic film grain noise",
    icon: "📰",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 25, min: 0, max: 100, step: 1 },
      { key: "size", label: "Grain Size", type: "number", default: 50, min: 10, max: 100, step: 1 },
    ],
  },
  {
    id: "chromatic-aberration",
    name: "Chromatic Aberration",
    category: "stylistic",
    description: "RGB channel offset for a lens glitch look",
    icon: "🔴",
    params: [
      { key: "offset", label: "Offset", type: "number", default: 3, min: 0, max: 20, step: 0.5 },
    ],
  },
  {
    id: "glow",
    name: "Glow / Bloom",
    category: "stylistic",
    description: "Soft luminous glow effect",
    icon: "✨",
    params: [
      { key: "amount", label: "Intensity", type: "number", default: 30, min: 0, max: 100, step: 1 },
      { key: "radius", label: "Radius", type: "number", default: 10, min: 1, max: 50, step: 1 },
    ],
  },
  {
    id: "halftone",
    name: "Halftone",
    category: "stylistic",
    description: "Print-style dot pattern",
    icon: "📰",
    params: [
      { key: "dotSize", label: "Dot Size", type: "number", default: 4, min: 1, max: 20, step: 1 },
      { key: "angle", label: "Angle", type: "number", default: 45, min: 0, max: 90, step: 1 },
    ],
  },
  {
    id: "pixelate",
    name: "Pixelate",
    category: "stylistic",
    description: "Mosaic / pixel block effect",
    icon: "👾",
    params: [
      { key: "size", label: "Pixel Size", type: "number", default: 8, min: 1, max: 50, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // LIGHT (6 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "lens-flare",
    name: "Lens Flare",
    category: "light",
    description: "Simulated camera lens flare",
    icon: "💫",
    params: [
      { key: "x", label: "Position X", type: "number", default: 70, min: 0, max: 100, step: 1 },
      { key: "y", label: "Position Y", type: "number", default: 30, min: 0, max: 100, step: 1 },
      { key: "size", label: "Size", type: "number", default: 50, min: 10, max: 100, step: 1 },
      { key: "brightness", label: "Brightness", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "light-leak",
    name: "Light Leak",
    category: "light",
    description: "Analog film light leak overlay",
    icon: "🔆",
    params: [
      { key: "amount", label: "Intensity", type: "number", default: 40, min: 0, max: 100, step: 1 },
      { key: "position", label: "Position", type: "number", default: 0, min: 0, max: 3, step: 1 },
    ],
  },
  {
    id: "bloom",
    name: "Bloom",
    category: "light",
    description: "Bright areas bleed into surroundings",
    icon: "🌟",
    params: [
      { key: "threshold", label: "Threshold", type: "number", default: 0.7, min: 0, max: 1, step: 0.05 },
      { key: "amount", label: "Intensity", type: "number", default: 30, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "shadow-highlight",
    name: "Shadow/Highlight Recovery",
    category: "light",
    description: "Recover detail in shadows and highlights",
    icon: "🌓",
    params: [
      { key: "shadowRecovery", label: "Shadow Recovery", type: "number", default: 0, min: 0, max: 100, step: 1 },
      { key: "highlightRecovery", label: "Highlight Recovery", type: "number", default: 0, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "orbs",
    name: "Orbs / Bokeh Overlay",
    category: "light",
    description: "Floating light orb particles",
    icon: "🔮",
    params: [
      { key: "count", label: "Count", type: "number", default: 12, min: 1, max: 50, step: 1 },
      { key: "size", label: "Size", type: "number", default: 30, min: 5, max: 100, step: 1 },
      { key: "opacity", label: "Opacity", type: "number", default: 30, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "sun-flare",
    name: "Sun Flare",
    category: "light",
    description: "Warm sunbeam overlay",
    icon: "☀",
    params: [
      { key: "intensity", label: "Intensity", type: "number", default: 40, min: 0, max: 100, step: 1 },
      { key: "warmth", label: "Warmth", type: "number", default: 60, min: 0, max: 100, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // FILM (6 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "film-fade",
    name: "Film Fade",
    category: "film",
    description: "Fade to a warm/desaturated look",
    icon: "🎞",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "film-color-shift",
    name: "Film Color Shift",
    category: "film",
    description: "Shift color channels like aged film stock",
    icon: "🎞",
    params: [
      { key: "redShift", label: "Red Shift", type: "number", default: 5, min: -50, max: 50, step: 1 },
      { key: "greenShift", label: "Green Shift", type: "number", default: 0, min: -50, max: 50, step: 1 },
      { key: "blueShift", label: "Blue Shift", type: "number", default: -5, min: -50, max: 50, step: 1 },
    ],
  },
  {
    id: "lut",
    name: "Custom LUT",
    category: "film",
    description: "Apply a .cube 3D LUT color grading file",
    icon: "📦",
    params: [
      { key: "intensity", label: "Intensity", type: "number", default: 100, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "letterbox",
    name: "Letterbox",
    category: "film",
    description: "Cinematic widescreen bars",
    icon: "▬",
    params: [
      { key: "ratio", label: "Aspect Ratio", type: "number", default: 2.35, min: 1.33, max: 3, step: 0.01 },
    ],
  },
  {
    id: "film-damage",
    name: "Film Damage",
    category: "film",
    description: "Scratches, dust, and gate weave",
    icon: "📼",
    params: [
      { key: "scratches", label: "Scratches", type: "number", default: 30, min: 0, max: 100, step: 1 },
      { key: "dust", label: "Dust", type: "number", default: 20, min: 0, max: 100, step: 1 },
      { key: "weave", label: "Gate Weave", type: "number", default: 20, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "flashback",
    name: "Flashback",
    category: "film",
    description: "Overexposed bleach-bypass flashback look",
    icon: "⚡",
    params: [
      { key: "strength", label: "Strength", type: "number", default: 60, min: 0, max: 100, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // DISTORT (5 effects)
  // ══════════════════════════════════════════════════════════════
  {
    id: "fisheye",
    name: "Fisheye",
    category: "distort",
    description: "Spherical distortion effect",
    icon: "🔵",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 50, min: 0, max: 100, step: 1 },
    ],
  },
  {
    id: "wave-distortion",
    name: "Wave Distortion",
    category: "distort",
    description: "Sine wave displacement",
    icon: "🌊",
    params: [
      { key: "amplitude", label: "Amplitude", type: "number", default: 10, min: 0, max: 50, step: 1 },
      { key: "frequency", label: "Frequency", type: "number", default: 5, min: 1, max: 30, step: 1 },
      { key: "speed", label: "Speed", type: "number", default: 1, min: 0, max: 5, step: 0.1 },
    ],
  },
  {
    id: "glitch",
    name: "Glitch",
    category: "distort",
    description: "Digital corruption / datamosh effect",
    icon: "⚡",
    params: [
      { key: "intensity", label: "Intensity", type: "number", default: 30, min: 0, max: 100, step: 1 },
      { key: "sliceCount", label: "Slice Count", type: "number", default: 5, min: 1, max: 20, step: 1 },
    ],
  },
  {
    id: "barrel-distortion",
    name: "Barrel Distortion",
    category: "distort",
    description: "Lens barrel/pincushion distortion",
    icon: "🔍",
    params: [
      { key: "amount", label: "Amount", type: "number", default: 0, min: -100, max: 100, step: 1 },
    ],
  },
  {
    id: "mirror",
    name: "Mirror",
    category: "distort",
    description: "Reflect the image along an axis",
    icon: "🪞",
    params: [
      { key: "axis", label: "Axis", type: "number", default: 0, min: 0, max: 3, step: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // TRANSFORM (1 effect)
  // ══════════════════════════════════════════════════════════════
  {
    id: "crop",
    name: "Crop",
    category: "transform",
    description: "Crop the edges of the frame",
    icon: "✂",
    params: [
      { key: "left", label: "Left", type: "number", default: 0, min: 0, max: 50, step: 1 },
      { key: "right", label: "Right", type: "number", default: 0, min: 0, max: 50, step: 1 },
      { key: "top", label: "Top", type: "number", default: 0, min: 0, max: 50, step: 1 },
      { key: "bottom", label: "Bottom", type: "number", default: 0, min: 0, max: 50, step: 1 },
    ],
  },
];

export const EFFECT_CATEGORIES = [
  { id: "color", name: "Color", icon: "🎨", count: 12 },
  { id: "blur", name: "Blur", icon: "🌫", count: 6 },
  { id: "filter", name: "Filter", icon: "🎞", count: 12 },
  { id: "stylistic", name: "Stylistic", icon: "✨", count: 10 },
  { id: "light", name: "Light", icon: "💡", count: 6 },
  { id: "film", name: "Film", icon: "📽", count: 6 },
  { id: "distort", name: "Distort", icon: "🌊", count: 5 },
  { id: "transform", name: "Transform", icon: "✂", count: 1 },
] as const;

export function getEffectDefinition(id: string): EffectDefinition | undefined {
  return EFFECT_DEFINITIONS.find((e) => e.id === id);
}

export function createEffect(type: string): Effect {
  const def = getEffectDefinition(type);
  const params: Record<string, number | string | boolean> = {};
  if (def) {
    for (const p of def.params) {
      params[p.key] = p.default;
    }
  }
  return {
    id: crypto.randomUUID(),
    type,
    name: def?.name ?? type,
    enabled: true,
    params,
  };
}

export function getEffectsByCategory(category: string): EffectDefinition[] {
  return EFFECT_DEFINITIONS.filter((e) => e.category === category);
}

export function cssFilterFromEffects(effects: Effect[]): string {
  const filters: string[] = [];

  for (const fx of effects) {
    if (!fx.enabled) continue;
    const p = fx.params;

    switch (fx.type) {
      // ── Color ──
      case "brightness":
        filters.push(`brightness(${1 + (p.amount as number) / 100})`);
        break;
      case "contrast":
        filters.push(`contrast(${1 + (p.amount as number) / 100})`);
        break;
      case "saturation":
        filters.push(`saturate(${1 + (p.amount as number) / 100})`);
        break;
      case "hue":
        filters.push(`hue-rotate(${p.amount as number}deg)`);
        break;
      case "exposure":
        filters.push(`brightness(${Math.pow(2, (p.amount as number))})`);
        break;
      case "temperature": {
        const t = (p.amount as number) / 100;
        filters.push(`sepia(${Math.abs(t) * 0.3}) saturate(${1 + t * 0.2})`);
        break;
      }
      case "vibrance":
        filters.push(`saturate(${1 + (p.amount as number) / 200})`);
        break;
      case "shadows": {
        const sv = (p.amount as number) / 100;
        filters.push(`brightness(${1 + sv * 0.3})`);
        break;
      }
      case "highlights": {
        const hv = (p.amount as number) / 100;
        filters.push(`brightness(${1 - hv * 0.3}) contrast(${1 + hv * 0.1})`);
        break;
      }
      case "gamma":
        filters.push(`brightness(${Math.pow((p.amount as number), 0.5)})`);
        break;

      // ── Blur ──
      case "gaussian-blur":
        filters.push(`blur(${p.radius as number}px)`);
        break;
      case "motion-blur":
        filters.push(`blur(${p.radius as number}px)`);
        break;
      case "lens-blur":
        filters.push(`blur(${p.radius as number}px)`);
        break;
      case "tilt-shift":
        filters.push(`blur(${p.amount as number}px)`);
        break;
      case "radial-blur":
      case "zoom-blur":
        filters.push(`blur(${p.amount as number}px)`);
        break;

      // ── Filter ──
      case "grayscale":
        filters.push(`grayscale(${(p.amount as number) / 100})`);
        break;
      case "sepia":
        filters.push(`sepia(${(p.amount as number) / 100})`);
        break;
      case "invert":
        filters.push(`invert(${(p.amount as number) / 100})`);
        break;
      case "vintage": {
        const s = (p.strength as number) / 100;
        filters.push(`sepia(${s * 0.6}) saturate(${1 - s * 0.3}) brightness(${1 - s * 0.1}) contrast(${1 - s * 0.1})`);
        break;
      }
      case "cinematic": {
        const s = (p.strength as number) / 100;
        filters.push(`saturate(${1 - s * 0.5}) sepia(${s * 0.2}) contrast(${1 + s * 0.15}) brightness(${1 - s * 0.05})`);
        break;
      }
      case "noir": {
        const s = (p.strength as number) / 100;
        filters.push(`grayscale(${s}) contrast(${1 + s * 0.5}) brightness(${1 - s * 0.1})`);
        break;
      }
      case "posterize":
        filters.push(`contrast(${1 + (100 - (p.levels as number) * 3) / 100})`);
        break;
      case "cross-process": {
        const s = (p.strength as number) / 100;
        filters.push(`saturate(${1 + s * 0.3}) contrast(${1 + s * 0.2}) sepia(${s * 0.15}) hue-rotate(${s * 10}deg)`);
        break;
      }
      case "bleach-bypass": {
        const s = (p.strength as number) / 100;
        filters.push(`saturate(${1 - s * 0.6}) contrast(${1 + s * 0.4})`);
        break;
      }
      case "kodachrome": {
        const s = (p.strength as number) / 100;
        filters.push(`saturate(${1 + s * 0.4}) contrast(${1 + s * 0.15}) sepia(${s * 0.1})`);
        break;
      }

      // ── Stylistic ──
      case "sharpen":
        filters.push(`contrast(${1 + (p.amount as number) / 200})`);
        break;
      case "unsharp-mask":
        filters.push(`contrast(${1 + (p.amount as number) / 200})`);
        break;
      case "emboss":
        filters.push(`contrast(${1 + (p.amount as number) / 100}) brightness(${0.8 + (p.amount as number) / 500})`);
        break;
      case "pixelate":
        filters.push(`blur(${(p.size as number) * 0.5}px) contrast(${1.5})`);
        break;

      // ── Film ──
      case "film-fade": {
        const s = (p.strength as number) / 100;
        filters.push(`brightness(${1 + s * 0.1}) saturate(${1 - s * 0.4}) contrast(${1 - s * 0.2})`);
        break;
      }
      case "letterbox":
        break; // Handled via canvas overlay, not CSS filter
      case "flashback": {
        const s = (p.strength as number) / 100;
        filters.push(`brightness(${1 + s * 0.5}) saturate(${1 - s * 0.8}) contrast(${1 - s * 0.3})`);
        break;
      }

      // ── Effects that need canvas rendering (not pure CSS) ──
      // These return empty string for CSS filter but are handled in render pipeline
      case "vignette":
      case "film-grain":
      case "chromatic-aberration":
      case "glow":
      case "halftone":
      case "lens-flare":
      case "light-leak":
      case "bloom":
      case "orbs":
      case "sun-flare":
      case "film-damage":
      case "fisheye":
      case "wave-distortion":
      case "glitch":
      case "barrel-distortion":
      case "mirror":
      case "duotone":
      case "edge-detect":
      case "threshold":
      case "lift-gamma-gain":
      case "color-balance":
      case "shadow-highlight":
      case "film-color-shift":
      case "lut":
        break;
    }
  }

  return filters.join(" ");
}

export function cssTransformFromClip(clip: {
  scale: number;
  rotation: number;
  positionX: number;
  positionY: number;
}): string {
  const transforms: string[] = [];
  transforms.push(`scale(${clip.scale})`);
  if (clip.rotation) transforms.push(`rotate(${clip.rotation}deg)`);
  if (clip.positionX || clip.positionY) transforms.push(`translate(${clip.positionX}px, ${clip.positionY}px)`);
  return transforms.join(" ");
}
