"use client";

import { create } from "zustand";
import type {
  ImageTool, CropRect, DrawTool, SelectTool, FrameSettings, HistorySnapshot,
  CurvePoint, HSLChannels, ColorBalanceChannels, VignetteSettings,
  SelectionState, GradientMapSettings, GridType,
} from "@/types/image-editor";
import { DEFAULT_HSL, DEFAULT_COLOR_BALANCE, DEFAULT_VIGNETTE } from "@/types/image-editor";
import {
  renderAdjustments, cloneCanvas, applyCrop, applyRotation, applyFlip,
  resizeCanvas, applyFrame, createDrawingCanvas, applyPixelateCanvas,
} from "@/lib/image/editor";
import { getFilterById } from "@/lib/image/filters";

interface DrawingEntry {
  id: string; tool: DrawTool;
  data: { text?: string; font?: string; fontSize?: number };
}

interface ImageEditorState {
  open: boolean; sourceSrc: string | null;
  sourceCanvas: HTMLCanvasElement | null; displayCanvas: HTMLCanvasElement | null;
  drawingCanvas: HTMLCanvasElement | null; drawingEntries: DrawingEntry[];
  originalCanvas: HTMLCanvasElement | null;
  originalWidth: number; originalHeight: number;
  renderedCanvas: HTMLCanvasElement | null;
  adjustments: Record<string, number>;

  // Advanced color
  curves: CurvePoint[] | null;
  hsl: HSLChannels;
  colorBalance: ColorBalanceChannels;
  vignette: VignetteSettings;
  gradientMap: GradientMapSettings | null;
  posterize: number | null;
  threshold: number | null;
  pixelate: number | null;

  activeFilter: string | null; filterStrength: number;
  cropRect: CropRect | null; rotation: number; flippedH: boolean; flippedV: boolean;
  resizeTo: { w: number; h: number } | null;
  frame: FrameSettings;

  // Drawing
  drawTool: DrawTool;
  brushSize: number; brushColor: string; brushOpacity: number;
  shapeFill: string; shapeStroke: string; shapeStrokeWidth: number;
  textFont: string; textSize: number;

  // Clone stamp
  cloneSrcX: number; cloneSrcY: number; cloneSampled: boolean;

  // Selection
  selection: SelectionState | null;
  selectTool: SelectTool;
  selectFeather: number;

  // Eyedropper
  eyedropperActive: boolean;
  eyedropperColor: { r: number; g: number; b: number; hex: string } | null;

  // UI
  activeTool: ImageTool;
  zoom: number; panX: number; panY: number;
  showBeforeAfter: boolean;
  gridType: GridType;
  showImageInfo: boolean;

  // Export
  exportFormat: "png" | "jpeg" | "webp";
  exportQuality: number; exportWidth: number; exportHeight: number; exportLockAspect: boolean;

  // History
  history: HistorySnapshot[]; future: HistorySnapshot[];

  // Actions
  openEditor: (src: string) => Promise<void>;
  closeEditor: () => void;
  setActiveTool: (t: ImageTool) => void;

  setAdjustment: (key: string, value: number) => void;
  setCurves: (points: CurvePoint[] | null) => void;
  setHSL: (channel: keyof HSLChannels, values: Partial<{ hue: number; saturation: number; luminance: number }>) => void;
  setColorBalance: (range: "shadows" | "midtones" | "highlights", channel: "cyanRed" | "magentaGreen" | "yellowBlue", value: number) => void;
  setVignette: (settings: Partial<VignetteSettings>) => void;
  setGradientMap: (gm: GradientMapSettings | null) => void;
  setPosterize: (v: number | null) => void;
  setThreshold: (v: number | null) => void;
  setPixelate: (v: number | null) => void;

  applyFilter: (id: string | null) => void;
  setFilterStrength: (s: number) => void;
  setCropRect: (r: CropRect | null) => void;
  commitCrop: () => void;
  rotate: (a: number) => void;
  flipH: () => void;
  flipV: () => void;
  commitResize: () => void;
  setResizeTo: (v: { w: number; h: number } | null) => void;
  applyFrameSettings: (s: Partial<FrameSettings>) => void;

  setDrawTool: (t: DrawTool) => void;
  setBrushSize: (s: number) => void;
  setBrushColor: (c: string) => void;
  setBrushOpacity: (o: number) => void;
  addDrawingEntry: (e: DrawingEntry) => void;
  clearDrawingEntries: () => void;
  removeDrawingEntry: (id: string) => void;
  setShapeStrokeWidth: (w: number) => void;
  setShapeFill: (c: string) => void;
  setShapeStroke: (c: string) => void;
  setTextFont: (f: string) => void;
  setTextSize: (s: number) => void;
  setCloneSrc: (x: number, y: number) => void;

  setSelection: (s: SelectionState | null) => void;
  setSelectTool: (t: SelectTool) => void;
  setSelectFeather: (f: number) => void;

  setEyedropperActive: (a: boolean) => void;
  setEyedropperColor: (c: { r: number; g: number; b: number; hex: string } | null) => void;

  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  toggleBeforeAfter: () => void;
  setGridType: (g: GridType) => void;
  toggleImageInfo: () => void;

  setExportFormat: (f: "png" | "jpeg" | "webp") => void;
  setExportQuality: (q: number) => void;
  setExportWidth: (w: number) => void;
  setExportHeight: (h: number) => void;

  undo: () => void;
  redo: () => void;
  resetAll: () => void;
  reRender: () => void;
  getFinalCanvas: () => HTMLCanvasElement | null;
}

function defaultAdjustments(): Record<string, number> {
  return { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, tint: 0, vibrance: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, clarity: 0, sharpen: 0, denoise: 0, gamma: 100 };
}

function defaultFrame(): FrameSettings {
  return { borderWidth: 0, borderColor: "#ffffff", borderRadius: 0, shadowBlur: 0, shadowColor: "#000000", shadowOffsetX: 0, shadowOffsetY: 0 };
}

function snapshot(state: ImageEditorState): HistorySnapshot {
  return {
    adjustments: { ...state.adjustments },
    curves: state.curves ? state.curves.map((p) => ({ ...p })) : null,
    hsl: JSON.parse(JSON.stringify(state.hsl)),
    colorBalance: JSON.parse(JSON.stringify(state.colorBalance)),
    vignette: { ...state.vignette },
    activeFilter: state.activeFilter, filterStrength: state.filterStrength,
    rotation: state.rotation, flippedH: state.flippedH, flippedV: state.flippedV,
    cropRect: state.cropRect ? { ...state.cropRect } : null,
    resizeTo: state.resizeTo ? { ...state.resizeTo } : null,
    frame: { ...state.frame },
    gradientMap: state.gradientMap ? { ...state.gradientMap, colors: [...state.gradientMap.colors] } : null,
    posterize: state.posterize, threshold: state.threshold, pixelate: state.pixelate,
    selection: state.selection ? { ...state.selection } : null,
  };
}

const MAX_HISTORY = 50;

export const useImageEditorStore = create<ImageEditorState>()((set, get) => ({
  open: false, sourceSrc: null, sourceCanvas: null, displayCanvas: null,
  drawingCanvas: null, drawingEntries: [], originalCanvas: null,
  originalWidth: 0, originalHeight: 0, renderedCanvas: null,
  adjustments: defaultAdjustments(),
  curves: null, hsl: { ...DEFAULT_HSL }, colorBalance: { ...DEFAULT_COLOR_BALANCE },
  vignette: { ...DEFAULT_VIGNETTE },
  gradientMap: null, posterize: null, threshold: null, pixelate: null,
  activeFilter: null, filterStrength: 50,
  cropRect: null, rotation: 0, flippedH: false, flippedV: false,
  resizeTo: null, frame: defaultFrame(),
  drawTool: "brush", brushSize: 10, brushColor: "#ffffff", brushOpacity: 1,
  shapeFill: "transparent", shapeStroke: "#ffffff", shapeStrokeWidth: 3,
  textFont: "Arial", textSize: 48, cloneSrcX: 0, cloneSrcY: 0, cloneSampled: false,
  selection: null, selectTool: "rect", selectFeather: 0,
  eyedropperActive: false, eyedropperColor: null,
  activeTool: "adjust", zoom: 1, panX: 0, panY: 0,
  showBeforeAfter: false, gridType: "none", showImageInfo: false,
  exportFormat: "png", exportQuality: 0.92, exportWidth: 0, exportHeight: 0, exportLockAspect: true,
  history: [], future: [],

  openEditor: async (src) => {
    const { loadImageToCanvas } = await import("@/lib/image/editor");
    const { canvas, width, height } = await loadImageToCanvas(src);
    const orig = cloneCanvas(canvas);
    set({
      open: true, sourceSrc: src, sourceCanvas: canvas, originalCanvas: orig,
      originalWidth: width, originalHeight: height, displayCanvas: canvas,
      renderedCanvas: cloneCanvas(canvas),
      drawingCanvas: createDrawingCanvas(width, height), drawingEntries: [],
      adjustments: defaultAdjustments(),
      curves: null, hsl: { ...DEFAULT_HSL }, colorBalance: { ...DEFAULT_COLOR_BALANCE },
      vignette: { ...DEFAULT_VIGNETTE },
      gradientMap: null, posterize: null, threshold: null, pixelate: null,
      activeFilter: null, filterStrength: 50, cropRect: null,
      rotation: 0, flippedH: false, flippedV: false, resizeTo: null, frame: defaultFrame(),
      selection: null, selectFeather: 0, eyedropperActive: false, eyedropperColor: null,
      activeTool: "adjust", zoom: 1, panX: 0, panY: 0, showBeforeAfter: false,
      gridType: "none", showImageInfo: false,
      exportFormat: "png", exportQuality: 0.92, exportWidth: width, exportHeight: height, exportLockAspect: true,
      history: [], future: [],
    });
  },

  closeEditor: () => set({ open: false, displayCanvas: null }),

  setActiveTool: (t) => set({ activeTool: t }),

  setAdjustment: (key, value) => {
    set((s) => ({ adjustments: { ...s.adjustments, [key]: value } }));
    get().reRender();
  },
  setCurves: (points) => { set({ curves: points }); get().reRender(); },
  setHSL: (channel, values) => {
    set((s) => ({ hsl: { ...s.hsl, [channel]: { ...s.hsl[channel], ...values } } }));
    get().reRender();
  },
  setColorBalance: (range, channel, value) => {
    set((s) => ({ colorBalance: { ...s.colorBalance, [range]: { ...s.colorBalance[range], [channel]: value } } }));
    get().reRender();
  },
  setVignette: (settings) => { set((s) => ({ vignette: { ...s.vignette, ...settings } })); get().reRender(); },
  setGradientMap: (gm) => { set({ gradientMap: gm }); get().reRender(); },
  setPosterize: (v) => { set({ posterize: v }); get().reRender(); },
  setThreshold: (v) => { set({ threshold: v }); get().reRender(); },
  setPixelate: (v) => { set({ pixelate: v }); get().reRender(); },

  applyFilter: (id) => { set({ activeFilter: id }); get().reRender(); },
  setFilterStrength: (s) => { set({ filterStrength: s }); get().reRender(); },
  setCropRect: (r) => set({ cropRect: r }),

  commitCrop: () => {
    const { cropRect, renderedCanvas, originalCanvas } = get();
    if (!cropRect || !renderedCanvas || !originalCanvas) return;
    set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [] }));
    const cropped = applyCrop(renderedCanvas, cropRect);
    set({
      originalCanvas: cropped, renderedCanvas: cloneCanvas(cropped), displayCanvas: cropped,
      drawingCanvas: createDrawingCanvas(cropped.width, cropped.height), drawingEntries: [],
      cropRect: null, originalWidth: cropped.width, originalHeight: cropped.height,
      exportWidth: cropped.width, exportHeight: cropped.height, zoom: 1, panX: 0, panY: 0,
    });
  },

  rotate: (angle) => {
    set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [], rotation: (s.rotation + angle) % 360 }));
    get().reRender();
  },
  flipH: () => { set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [], flippedH: !s.flippedH })); get().reRender(); },
  flipV: () => { set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [], flippedV: !s.flippedV })); get().reRender(); },

  commitResize: () => {
    const { renderedCanvas, exportWidth, exportHeight } = get();
    if (!renderedCanvas) return;
    set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [] }));
    const resized = resizeCanvas(renderedCanvas, exportWidth, exportHeight);
    set({ originalCanvas: resized, renderedCanvas: cloneCanvas(resized), displayCanvas: resized, drawingCanvas: createDrawingCanvas(resized.width, resized.height), drawingEntries: [], originalWidth: resized.width, originalHeight: resized.height, resizeTo: null, zoom: 1, panX: 0, panY: 0 });
  },

  setResizeTo: (v) => set({ resizeTo: v }),
  applyFrameSettings: (s) => set((st) => ({ frame: { ...st.frame, ...s } })),
  setDrawTool: (t) => set({ drawTool: t }),
  setBrushSize: (s) => set({ brushSize: s }),
  setBrushColor: (c) => set({ brushColor: c }),
  setBrushOpacity: (o) => set({ brushOpacity: o }),
  addDrawingEntry: (e) => set((s) => ({ drawingEntries: [...s.drawingEntries, e] })),
  clearDrawingEntries: () => set({ drawingEntries: [] }),
  removeDrawingEntry: (id) => set((s) => ({ drawingEntries: s.drawingEntries.filter((d) => d.id !== id) })),
  setShapeStrokeWidth: (w) => set({ shapeStrokeWidth: w }),
  setShapeFill: (c) => set({ shapeFill: c }),
  setShapeStroke: (c) => set({ shapeStroke: c }),
  setTextFont: (f) => set({ textFont: f }),
  setTextSize: (s) => set({ textSize: s }),
  setCloneSrc: (x, y) => set({ cloneSrcX: x, cloneSrcY: y, cloneSampled: true }),

  setSelection: (s) => set({ selection: s }),
  setSelectTool: (t) => set({ selectTool: t }),
  setSelectFeather: (f) => set({ selectFeather: f }),

  setEyedropperActive: (a) => set({ eyedropperActive: a }),
  setEyedropperColor: (c) => set({ eyedropperColor: c }),

  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(10, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleBeforeAfter: () => set((s) => ({ showBeforeAfter: !s.showBeforeAfter })),
  setGridType: (g) => set({ gridType: g }),
  toggleImageInfo: () => set((s) => ({ showImageInfo: !s.showImageInfo })),

  setExportFormat: (f) => set({ exportFormat: f }),
  setExportQuality: (q) => set({ exportQuality: q }),
  setExportWidth: (w) => {
    const { exportLockAspect, originalWidth, originalHeight } = get();
    if (exportLockAspect && originalWidth > 0) {
      set({ exportWidth: w, exportHeight: Math.round(w * (originalHeight / originalWidth)) });
    } else set({ exportWidth: w });
  },
  setExportHeight: (h) => {
    const { exportLockAspect, originalWidth, originalHeight } = get();
    if (exportLockAspect && originalHeight > 0) {
      set({ exportHeight: h, exportWidth: Math.round(h * (originalWidth / originalHeight)) });
    } else set({ exportHeight: h });
  },

  undo: () => {
    const { history, originalCanvas } = get();
    if (history.length === 0 || !originalCanvas) return;
    const prev = history[history.length - 1];
    set((s) => ({
      history: history.slice(0, -1),
      future: [snapshot(s), ...s.future.slice(-(MAX_HISTORY - 1))],
      adjustments: prev.adjustments, curves: prev.curves, hsl: prev.hsl,
      colorBalance: prev.colorBalance, vignette: prev.vignette,
      activeFilter: prev.activeFilter, filterStrength: prev.filterStrength,
      rotation: prev.rotation, flippedH: prev.flippedH, flippedV: prev.flippedV,
      cropRect: prev.cropRect, resizeTo: prev.resizeTo, frame: prev.frame,
      gradientMap: prev.gradientMap, posterize: prev.posterize,
      threshold: prev.threshold, pixelate: prev.pixelate, selection: prev.selection,
    }));
    get().reRender();
  },

  redo: () => {
    const { future, originalCanvas } = get();
    if (future.length === 0 || !originalCanvas) return;
    const next = future[0];
    set((s) => ({
      future: future.slice(1),
      history: [...s.history, snapshot(s)].slice(-MAX_HISTORY),
      adjustments: next.adjustments, curves: next.curves, hsl: next.hsl,
      colorBalance: next.colorBalance, vignette: next.vignette,
      activeFilter: next.activeFilter, filterStrength: next.filterStrength,
      rotation: next.rotation, flippedH: next.flippedH, flippedV: next.flippedV,
      cropRect: next.cropRect, resizeTo: next.resizeTo, frame: next.frame,
      gradientMap: next.gradientMap, posterize: next.posterize,
      threshold: next.threshold, pixelate: next.pixelate, selection: next.selection,
    }));
    get().reRender();
  },

  resetAll: () => {
    const { originalCanvas, originalWidth, originalHeight } = get();
    if (!originalCanvas) return;
    set((s) => ({ history: [...s.history.slice(-(MAX_HISTORY - 1)), snapshot(s)], future: [] }));
    const reset = cloneCanvas(originalCanvas);
    set({
      adjustments: defaultAdjustments(), curves: null,
      hsl: { ...DEFAULT_HSL }, colorBalance: { ...DEFAULT_COLOR_BALANCE },
      vignette: { ...DEFAULT_VIGNETTE },
      gradientMap: null, posterize: null, threshold: null, pixelate: null,
      activeFilter: null, filterStrength: 50, rotation: 0, flippedH: false, flippedV: false,
      cropRect: null, resizeTo: null, frame: defaultFrame(),
      selection: null, zoom: 1, panX: 0, panY: 0,
      originalCanvas: reset, renderedCanvas: cloneCanvas(reset), displayCanvas: reset,
      drawingCanvas: createDrawingCanvas(reset.width, reset.height), drawingEntries: [],
      originalWidth: reset.width, originalHeight: reset.height,
      exportWidth: reset.width, exportHeight: reset.height,
    });
  },

  reRender: () => {
    const { originalCanvas, adjustments, curves, hsl, colorBalance, vignette,
      gradientMap, posterize, threshold, activeFilter, filterStrength, selection,
      rotation, flippedH, flippedV, pixelate } = get();
    if (!originalCanvas) return;
    const filterFn = activeFilter ? getFilterById(activeFilter) : null;
    let result = renderAdjustments(
      originalCanvas, adjustments, curves, hsl, colorBalance,
      vignette, gradientMap, posterize, threshold,
      filterFn?.apply ?? null, filterStrength, selection,
    );
    if (pixelate && pixelate > 1) result = applyPixelateCanvas(result, pixelate);
    if (rotation !== 0) result = applyRotation(result, rotation);
    if (flippedH || flippedV) result = applyFlip(result, flippedH, flippedV);
    set({ renderedCanvas: result, displayCanvas: result, exportWidth: result.width, exportHeight: result.height });
  },

  getFinalCanvas: () => {
    const { renderedCanvas, drawingCanvas, frame } = get();
    if (!renderedCanvas) return null;
    let result = cloneCanvas(renderedCanvas);
    if (drawingCanvas) result.getContext("2d")!.drawImage(drawingCanvas, 0, 0);
    if (frame.borderWidth > 0 || frame.shadowBlur > 0 || frame.borderRadius > 0) result = applyFrame(result, frame);
    return result;
  },
}));
