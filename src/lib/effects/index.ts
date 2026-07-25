import type { EffectDefinition, Effect, EffectParamDefinition } from "@/types/editor";

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // ── Color ──
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

  // ── Blur ──
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

  // ── Filter ──
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
    description: "Letterbox + teal/orange color grade",
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

  // ── Transform ──
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
        const r = Math.max(0, Math.min(1, 0.5 + t * 0.3));
        const b = Math.max(0, Math.min(1, 0.5 - t * 0.3));
        filters.push(`sepia(${t * 0.3}) saturate(${1 + t * 0.2})`);
        break;
      }
      case "gaussian-blur":
        filters.push(`blur(${p.radius as number}px)`);
        break;
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
