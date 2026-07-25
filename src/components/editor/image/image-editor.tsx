"use client";

import { useCallback, useEffect } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { ImageCanvas } from "./image-canvas";
import { AdjustPanel } from "./adjust-panel";
import { ColorGradePanel } from "./color-grade-panel";
import { FiltersPanel } from "./filters-panel";
import { CropPanel } from "./crop-panel";
import { SelectPanel } from "./select-panel";
import { DrawPanel } from "./draw-panel";
import { EffectsPanel } from "./effects-panel";
import { ResizePanel } from "./resize-panel";
import { FramePanel } from "./frame-panel";
import { ExportDialog } from "./export-dialog";
import type { ImageTool, GridType } from "@/types/image-editor";

const TOOLS: { key: ImageTool; label: string; icon: string; shortcut: string }[] = [
  { key: "adjust", label: "Adjust", icon: "◐", shortcut: "1" },
  { key: "color-grade", label: "Color Grade", icon: "🎚", shortcut: "2" },
  { key: "filters", label: "Filters", icon: "🎨", shortcut: "3" },
  { key: "crop", label: "Crop", icon: "✂", shortcut: "4" },
  { key: "select", label: "Select", icon: "▭", shortcut: "5" },
  { key: "draw", label: "Draw", icon: "✏️", shortcut: "6" },
  { key: "effects", label: "Effects", icon: "✨", shortcut: "7" },
  { key: "resize", label: "Resize", icon: "⬜", shortcut: "8" },
  { key: "frame", label: "Frame", icon: "🖼", shortcut: "9" },
];

const GRID_TYPES: { key: GridType; label: string }[] = [
  { key: "none", label: "Off" },
  { key: "rule-of-thirds", label: "Rule of 3rds" },
  { key: "golden-ratio", label: "Golden" },
  { key: "crosshair", label: "Crosshair" },
];

export function ImageEditor() {
  const open = useImageEditorStore((s) => s.open);
  const activeTool = useImageEditorStore((s) => s.activeTool);
  const setActiveTool = useImageEditorStore((s) => s.setActiveTool);
  const closeEditor = useImageEditorStore((s) => s.closeEditor);
  const undo = useImageEditorStore((s) => s.undo);
  const redo = useImageEditorStore((s) => s.redo);
  const resetAll = useImageEditorStore((s) => s.resetAll);
  const toggleBeforeAfter = useImageEditorStore((s) => s.toggleBeforeAfter);
  const showBeforeAfter = useImageEditorStore((s) => s.showBeforeAfter);
  const history = useImageEditorStore((s) => s.history);
  const future = useImageEditorStore((s) => s.future);
  const gridType = useImageEditorStore((s) => s.gridType);
  const setGridType = useImageEditorStore((s) => s.setGridType);
  const showImageInfo = useImageEditorStore((s) => s.showImageInfo);
  const toggleImageInfo = useImageEditorStore((s) => s.toggleImageInfo);
  const eyedropperActive = useImageEditorStore((s) => s.eyedropperActive);
  const setEyedropperActive = useImageEditorStore((s) => s.setEyedropperActive);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable) return;

      const toolMap: Record<string, ImageTool> = {
        "1": "adjust", "2": "color-grade", "3": "filters", "4": "crop",
        "5": "select", "6": "draw", "7": "effects", "8": "resize", "9": "frame",
      };
      if (toolMap[e.key] && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool(toolMap[e.key]);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (e.key === "g") { e.preventDefault(); setEyedropperActive(!eyedropperActive); return; }
      if (e.key === "b") { e.preventDefault(); toggleBeforeAfter(); return; }
      if (e.key === "i") { e.preventDefault(); toggleImageInfo(); return; }
      if (e.key === "Escape") { closeEditor(); return; }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, setActiveTool, undo, redo, toggleBeforeAfter, toggleImageInfo, closeEditor, eyedropperActive, setEyedropperActive]);

  const renderPanel = useCallback(() => {
    switch (activeTool) {
      case "adjust": return <AdjustPanel />;
      case "color-grade": return <ColorGradePanel />;
      case "filters": return <FiltersPanel />;
      case "crop": return <CropPanel />;
      case "select": return <SelectPanel />;
      case "draw": return <DrawPanel />;
      case "effects": return <EffectsPanel />;
      case "resize": return <ResizePanel />;
      case "frame": return <FramePanel />;
      default: return <AdjustPanel />;
    }
  }, [activeTool]);

  const doBgRemove = useCallback(async () => {
    const { chromaKeyRemove } = await import("@/lib/background/index");
    const originalCanvas = useImageEditorStore.getState().originalCanvas;
    if (!originalCanvas) return;
    const result = chromaKeyRemove(originalCanvas, {
      color: [0, 255, 0], similarity: 0.3, smoothness: 0.1, spillReduction: 0,
    });
    // Replace the display canvas with the result
    useImageEditorStore.setState({ displayCanvas: result, renderedCanvas: result });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050508]">
      {/* Top toolbar */}
      <header className="glass border-b border-border-subtle h-11 flex items-center justify-between px-3 shrink-0 z-10 overflow-x-auto">
        <div className="flex items-center gap-0.5">
          <button onClick={closeEditor} className="px-2 py-1.5 rounded-lg text-xs text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all mr-1 shrink-0">
            ✕
          </button>
          <div className="w-px h-5 bg-border-subtle mx-1 shrink-0" />
          {TOOLS.map((t) => (
            <button key={t.key} onClick={() => setActiveTool(t.key)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 shrink-0 ${
                activeTool === t.key ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
              }`}
              title={`${t.label} (${t.shortcut})`}
            >
              <span className="text-[12px]">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Eyedropper */}
          <button onClick={() => setEyedropperActive(!eyedropperActive)}
            className={`px-2 py-1.5 rounded-lg text-[11px] transition-all ${eyedropperActive ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"}`}
            title="Eyedropper (G)"
          >💉{eyedropperActive && <span className="ml-1 text-[10px]">ON</span>}</button>

          {/* Grid */}
          <div className="flex items-center gap-0.5 ml-1">
            {GRID_TYPES.map((g) => (
              <button key={g.key} onClick={() => setGridType(g.key)}
                className={`px-1.5 py-1 rounded text-[9px] transition-all ${gridType === g.key ? "text-neon-cyan" : "text-text-tertiary hover:text-text-primary"}`}
              >{g.label}</button>
            ))}
          </div>

          <div className="w-px h-5 bg-border-subtle mx-1" />

          <button onClick={undo} disabled={history.length === 0}
            className="px-2 py-1.5 rounded-lg text-[10px] text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all disabled:opacity-30" title="Undo (Ctrl+Z)">↩</button>
          <button onClick={redo} disabled={future.length === 0}
            className="px-2 py-1.5 rounded-lg text-[10px] text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all disabled:opacity-30" title="Redo (Ctrl+Shift+Z)">↪</button>
          <button onClick={toggleBeforeAfter}
            className={`px-2 py-1.5 rounded-lg text-[10px] transition-all ${showBeforeAfter ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"}`}
            title="Before/After (B)"
          >◐</button>
          <button onClick={toggleImageInfo}
            className={`px-2 py-1.5 rounded-lg text-[10px] transition-all ${showImageInfo ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"}`}
            title="Image Info (I)"
          >ℹ</button>
          <button onClick={resetAll} className="px-2 py-1.5 rounded-lg text-[10px] text-text-tertiary hover:text-neon-pink hover:bg-glass-medium transition-all" title="Reset All">↺</button>
        </div>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        <ImageCanvas />
        <aside className="w-[250px] glass border-l border-border-subtle overflow-y-auto flex flex-col shrink-0">
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">{renderPanel()}</div>
          <div className="border-t border-border-subtle p-2 space-y-1.5">
            <button onClick={doBgRemove} className="w-full glass rounded-lg px-2 py-1.5 text-[10px] text-neon-cyan hover:bg-glass-medium transition-all flex items-center justify-center gap-1">
              ✨ AI Remove Background
            </button>
            <ExportDialog />
          </div>
        </aside>
      </div>
    </div>
  );
}
