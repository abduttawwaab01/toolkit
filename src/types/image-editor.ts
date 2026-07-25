export type ImageTool = "adjust" | "color-grade" | "filters" | "crop" | "select" | "draw" | "effects" | "resize" | "frame"

export type DrawTool = "brush" | "eraser" | "blur" | "sharpen" | "clone" | "rect" | "circle" | "line" | "arrow" | "text" | "redeye"

export type SelectTool = "rect" | "ellipse"

export type GridType = "none" | "rule-of-thirds" | "golden-ratio" | "crosshair"

export interface CropRect {
  x: number; y: number; w: number; h: number
}

export interface FrameSettings {
  borderWidth: number; borderColor: string; borderRadius: number
  shadowBlur: number; shadowColor: string; shadowOffsetX: number; shadowOffsetY: number
}

export interface HistorySnapshot {
  adjustments: Record<string, number>
  curves: CurvePoint[] | null
  hsl: HSLChannels
  colorBalance: ColorBalanceChannels
  vignette: VignetteSettings
  activeFilter: string | null; filterStrength: number
  rotation: number; flippedH: boolean; flippedV: boolean
  cropRect: CropRect | null; resizeTo: { w: number; h: number } | null
  frame: FrameSettings
  gradientMap: GradientMapSettings | null
  posterize: number | null; threshold: number | null; pixelate: number | null
  selection: SelectionState | null
}

export interface CurvePoint {
  x: number; y: number
}

export interface HSLChannel {
  hue: number; saturation: number; luminance: number
}

export interface HSLChannels {
  red: HSLChannel; green: HSLChannel; blue: HSLChannel
  cyan: HSLChannel; magenta: HSLChannel; yellow: HSLChannel
}

export interface ColorBalanceChannel {
  cyanRed: number; magentaGreen: number; yellowBlue: number
}

export interface ColorBalanceChannels {
  shadows: ColorBalanceChannel; midtones: ColorBalanceChannel; highlights: ColorBalanceChannel
}

export interface VignetteSettings {
  amount: number; feather: number; roundness: number; highlights: number
}

export interface SelectionState {
  type: SelectTool; x: number; y: number; w: number; h: number; feather: number; invert: boolean
}

export interface GradientMapSettings {
  colors: string[]; dither: boolean
}

export interface AdjustmentDef {
  key: string; label: string; min: number; max: number; step: number; default: number
}

export const ADJUSTMENT_DEFINITIONS: AdjustmentDef[] = [
  { key: "exposure", label: "Exposure", min: -4, max: 4, step: 0.1, default: 0 },
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1, default: 0 },
  { key: "tint", label: "Tint", min: -100, max: 100, step: 1, default: 0 },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1, default: 0 },
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1, default: 0 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1, default: 0 },
  { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1, default: 0 },
  { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1, default: 0 },
  { key: "whites", label: "Whites", min: -100, max: 100, step: 1, default: 0 },
  { key: "blacks", label: "Blacks", min: -100, max: 100, step: 1, default: 0 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1, default: 0 },
  { key: "clarity", label: "Clarity", min: 0, max: 100, step: 1, default: 0 },
  { key: "sharpen", label: "Sharpen", min: 0, max: 100, step: 1, default: 0 },
  { key: "denoise", label: "Denoise", min: 0, max: 100, step: 1, default: 0 },
  { key: "gamma", label: "Gamma", min: 10, max: 300, step: 1, default: 100 },
]

export interface FilterDef {
  id: string; name: string
  category: "warm" | "cool" | "vintage" | "bw" | "dramatic" | "artistic" | "cinematic"
  apply: (r: number, g: number, b: number, strength: number) => [number, number, number]
}

export const DRAW_BLEND_MODES = [
  { id: "source-over", label: "Normal" },
  { id: "multiply", label: "Multiply" },
  { id: "screen", label: "Screen" },
  { id: "overlay", label: "Overlay" },
  { id: "soft-light", label: "Soft Light" },
  { id: "hard-light", label: "Hard Light" },
  { id: "color-dodge", label: "Dodge" },
  { id: "color-burn", label: "Burn" },
  { id: "difference", label: "Difference" },
  { id: "exclusion", label: "Exclusion" },
] as const

export const EXPORT_FORMATS = ["png", "jpeg", "webp"] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export const DEFAULT_HSL: HSLChannels = {
  red: { hue: 0, saturation: 0, luminance: 0 },
  green: { hue: 0, saturation: 0, luminance: 0 },
  blue: { hue: 0, saturation: 0, luminance: 0 },
  cyan: { hue: 0, saturation: 0, luminance: 0 },
  magenta: { hue: 0, saturation: 0, luminance: 0 },
  yellow: { hue: 0, saturation: 0, luminance: 0 },
}

export const DEFAULT_COLOR_BALANCE: ColorBalanceChannels = {
  shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
  midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
  highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
}

export const DEFAULT_VIGNETTE: VignetteSettings = {
  amount: 0, feather: 70, roundness: 50, highlights: 50,
}
