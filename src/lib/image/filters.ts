import type { FilterDef } from "@/types/image-editor";

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const IMAGE_FILTERS: FilterDef[] = [
  // ── Warm ──
  {
    id: "golden-hour", name: "Golden Hour", category: "warm",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, r * 1.15, t)),
        clamp(mix(g, g * 0.85, t)),
        clamp(mix(b, b * 0.65, t)),
      ];
    },
  },
  {
    id: "warm-glow", name: "Warm Glow", category: "warm",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, Math.min(255, r * 1.2), t)),
        clamp(mix(g, Math.min(255, g * 1.05), t)),
        clamp(mix(b, Math.min(255, b * 0.8), t)),
      ];
    },
  },
  {
    id: "sunset", name: "Sunset", category: "warm",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, Math.min(255, r * 1.3), t)),
        clamp(mix(g, Math.min(255, g * 0.8), t)),
        clamp(mix(b, Math.min(255, b * 0.5), t)),
      ];
    },
  },
  {
    id: "toasty", name: "Toasty", category: "warm",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + 40, t)),
        clamp(mix(g, gray + 15, t)),
        clamp(mix(b, gray - 10, t)),
      ];
    },
  },

  // ── Cool ──
  {
    id: "cool-wave", name: "Cool Wave", category: "cool",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, r * 0.8, t)),
        clamp(mix(g, g * 0.9, t)),
        clamp(mix(b, Math.min(255, b * 1.2), t)),
      ];
    },
  },
  {
    id: "icy", name: "Icy", category: "cool",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, r * 0.7, t)),
        clamp(mix(g, g * 0.85, t)),
        clamp(mix(b, Math.min(255, b * 1.3), t)),
      ];
    },
  },
  {
    id: "mint", name: "Mint", category: "cool",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, r * 0.75, t)),
        clamp(mix(g, Math.min(255, g * 1.15), t)),
        clamp(mix(b, Math.min(255, b * 1.1), t)),
      ];
    },
  },
  {
    id: "teal-orange", name: "Teal & Orange", category: "cool",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const lr = r / 255, lg = g / 255, lb = b / 255;
      const l = 0.299 * lr + 0.587 * lg + 0.114 * lb;
      const teal = [0.1, 0.5, 0.6];
      const orange = [1.0, 0.6, 0.1];
      return [
        clamp(255 * mix(l, (l > 0.5 ? orange[0] : teal[0]), t)),
        clamp(255 * mix(lg, (l > 0.5 ? orange[1] : teal[1]), t)),
        clamp(255 * mix(lb, (l > 0.5 ? orange[2] : teal[2]), t)),
      ];
    },
  },

  // ── Vintage ──
  {
    id: "vintage", name: "Vintage Film", category: "vintage",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const fade = gray * 0.15 + 20;
      return [
        clamp(mix(r, gray + fade + 15, t)),
        clamp(mix(g, gray + fade - 5, t)),
        clamp(mix(b, gray + fade - 20, t)),
      ];
    },
  },
  {
    id: "retro", name: "Retro", category: "vintage",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + 20, t)),
        clamp(mix(g, gray + 5, t)),
        clamp(mix(b, gray - 10, t)),
      ];
    },
  },
  {
    id: "kodak", name: "Kodak Chrome", category: "vintage",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, Math.min(255, r * 1.1 + 10), t)),
        clamp(mix(g, g * 1.05, t)),
        clamp(mix(b, Math.max(0, b * 0.85 - 5), t)),
      ];
    },
  },
  {
    id: "fade", name: "Fade", category: "vintage",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const fade = 40 * t;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + fade, t * 0.7)),
        clamp(mix(g, gray + fade, t * 0.7)),
        clamp(mix(b, gray + fade, t * 0.7)),
      ];
    },
  },
  {
    id: "polaroid", name: "Polaroid", category: "vintage",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + 30, t)),
        clamp(mix(g, gray + 25, t)),
        clamp(mix(b, gray + 15, t)),
      ];
    },
  },

  // ── Black & White ──
  {
    id: "grayscale", name: "Classic B&W", category: "bw",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray, t)),
        clamp(mix(g, gray, t)),
        clamp(mix(b, gray, t)),
      ];
    },
  },
  {
    id: "high-contrast-bw", name: "High Contrast BW", category: "bw",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const hc = gray > 128 ? Math.min(255, gray * 1.4) : Math.max(0, gray * 0.6);
      return [
        clamp(mix(r, hc, t)),
        clamp(mix(g, hc, t)),
        clamp(mix(b, hc, t)),
      ];
    },
  },
  {
    id: "sepia", name: "Sepia", category: "bw",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + 40, t)),
        clamp(mix(g, gray + 20, t)),
        clamp(mix(b, gray - 15, t)),
      ];
    },
  },
  {
    id: "silver", name: "Silver Tone", category: "bw",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const silver = Math.max(0, Math.min(255, gray + (gray - 128) * 0.3));
      return [
        clamp(mix(r, silver, t)),
        clamp(mix(g, silver, t)),
        clamp(mix(b, silver, t)),
      ];
    },
  },

  // ── Dramatic ──
  {
    id: "noir", name: "Film Noir", category: "dramatic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const noir = clamp((gray - 128) * 1.6 + 128);
      return [
        clamp(mix(r, noir, t)),
        clamp(mix(g, noir, t)),
        clamp(mix(b, noir, t)),
      ];
    },
  },
  {
    id: "dramatic", name: "Dramatic", category: "dramatic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrast = (gray - 128) * 1.3 + 128;
      return [
        clamp(mix(r, clamp(r + (contrast - gray) * 1.2), t)),
        clamp(mix(g, clamp(g + (contrast - gray) * 1.2), t)),
        clamp(mix(b, clamp(b + (contrast - gray) * 1.2), t)),
      ];
    },
  },
  {
    id: "hard-boost", name: "Hard Boost", category: "dramatic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const boost = (v: number) => v > 128 ? Math.min(255, v * 1.3) : Math.max(0, v * 0.7);
      return [
        clamp(mix(r, boost(r), t)),
        clamp(mix(g, boost(g), t)),
        clamp(mix(b, boost(b), t)),
      ];
    },
  },
  {
    id: "moody", name: "Moody", category: "dramatic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const dark = gray * 0.8;
      return [
        clamp(mix(r, dark + 10, t)),
        clamp(mix(g, dark - 5, t)),
        clamp(mix(b, dark + 20, t)),
      ];
    },
  },

  // ── Artistic ──
  {
    id: "dreamy", name: "Dreamy", category: "artistic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, gray + (r - gray) * 0.5 + 20, t)),
        clamp(mix(g, gray + (g - gray) * 0.5 + 20, t)),
        clamp(mix(b, gray + (b - gray) * 0.5 + 30, t)),
      ];
    },
  },
  {
    id: "pastel", name: "Pastel", category: "artistic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const pastel = (v: number) => (v + gray * 2) / 3 + 30;
      return [
        clamp(mix(r, pastel(r), t)),
        clamp(mix(g, pastel(g), t)),
        clamp(mix(b, pastel(b), t)),
      ];
    },
  },
  {
    id: "duotone-blue", name: "Duotone Blue", category: "artistic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const shadow = [10, 20, 80];
      const highlight = [200, 220, 255];
      const nt = gray / 255;
      return [
        clamp(mix(r, mix(shadow[0], highlight[0], nt), t)),
        clamp(mix(g, mix(shadow[1], highlight[1], nt), t)),
        clamp(mix(b, mix(shadow[2], highlight[2], nt), t)),
      ];
    },
  },
  {
    id: "duotone-sunset", name: "Duotone Sunset", category: "artistic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const shadow = [80, 10, 30];
      const highlight = [255, 180, 100];
      const nt = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return [
        clamp(mix(r, mix(shadow[0], highlight[0], nt), t)),
        clamp(mix(g, mix(shadow[1], highlight[1], nt), t)),
        clamp(mix(b, mix(shadow[2], highlight[2], nt), t)),
      ];
    },
  },
  {
    id: "invert", name: "Invert", category: "artistic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      return [
        clamp(mix(r, 255 - r, t)),
        clamp(mix(g, 255 - g, t)),
        clamp(mix(b, 255 - b, t)),
      ];
    },
  },

  // ── Cinematic ──
  {
    id: "cinematic", name: "Cinematic", category: "cinematic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const teal = [r * 0.8, g * 0.9, Math.min(255, b * 1.2)];
      const orange = [Math.min(255, r * 1.2), g * 0.9, b * 0.7];
      const result = gray > 128 ? orange : teal;
      return [
        clamp(mix(r, result[0], t)),
        clamp(mix(g, result[1], t)),
        clamp(mix(b, result[2], t)),
      ];
    },
  },
  {
    id: "blockbuster", name: "Blockbuster", category: "cinematic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const boost = (v: number) => clamp((v - 128) * 1.2 + 128 + 10);
      const sat = (v: number, gray: number) => clamp(gray + (v - gray) * 1.3);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, boost(sat(r, gray)), t)),
        clamp(mix(g, boost(sat(g, gray)), t)),
        clamp(mix(b, boost(sat(b, gray)), t)),
      ];
    },
  },
  {
    id: "hdr", name: "HDR Look", category: "cinematic",
    apply: (r, g, b, s) => {
      const t = s / 100;
      const tone = (v: number) => clamp(255 * (v / 255) ** 0.85);
      const sharpen = (v: number, gv: number) => clamp(v + (v - gv) * 0.3);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        clamp(mix(r, sharpen(tone(r), tone(gray)), t)),
        clamp(mix(g, sharpen(tone(g), tone(gray)), t)),
        clamp(mix(b, sharpen(tone(b), tone(gray)), t)),
      ];
    },
  },
]

export function getFilterById(id: string): FilterDef | undefined {
  return IMAGE_FILTERS.find((f) => f.id === id)
}

export const FILTER_CATEGORIES = [
  { key: "warm", label: "Warm", color: "#ff6b35" },
  { key: "cool", label: "Cool", color: "#4facfe" },
  { key: "vintage", label: "Vintage", color: "#a67c52" },
  { key: "bw", label: "B&W", color: "#888" },
  { key: "dramatic", label: "Dramatic", color: "#333" },
  { key: "artistic", label: "Artistic", color: "#bf6aff" },
  { key: "cinematic", label: "Cinematic", color: "#ff006e" },
]
