"use client";

import { useCallback } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { ImageCanvas } from "./image-canvas";
import { AdjustPanel } from "./adjust-panel";
import { FiltersPanel } from "./filters-panel";
import { CropPanel } from "./crop-panel";
import { DrawPanel } from "./draw-panel";
import { ResizePanel } from "./resize-panel";
import { FramePanel } from "./frame-panel";
import { ExportDialog } from "./export-dialog";
import type { ImageTool } from "@/types/image-editor";

const TOOLS: { key: ImageTool; label: string; icon: string }[] = [
  { key: "adjust", label: "Adjust", icon: "◐" },
  { key: "filters", label: "Filters", icon: "🎨" },
  { key: "crop", label: "Crop", icon: "✂" },
  { key: "draw", label: "Draw", icon: "✏️" },
  { key: "resize", label: "Resize", icon: "⬜" },
  { key: "frame", label: "Frame", icon: "🖼" },
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

  const renderPanel = useCallback(() => {
    switch (activeTool) {
      case "adjust": return <AdjustPanel />;
      case "filters": return <FiltersPanel />;
      case "crop": return <CropPanel />;
      case "draw": return <DrawPanel />;
      case "resize": return <ResizePanel />;
      case "frame": return <FramePanel />;
      default: return <AdjustPanel />;
    }
  }, [activeTool]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050508]">
      {/* Top toolbar */}
      <header className="glass border-b border-border-subtle h-11 flex items-center justify-between px-3 shrink-0 z-10">
        <div className="flex items-center gap-1">
          <button onClick={closeEditor} className="px-2 py-1 rounded-lg text-xs text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all mr-2">
            ✕ Close
          </button>
          <div className="w-px h-5 bg-border-subtle mx-1" />
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTool(t.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                activeTool === t.key ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
              }`}
            >
              <span className="text-[13px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={history.length === 0}
            className="px-2 py-1.5 rounded-lg text-[11px] text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all disabled:opacity-30"
          >
            ↩ Undo
          </button>
          <button onClick={redo} disabled={future.length === 0}
            className="px-2 py-1.5 rounded-lg text-[11px] text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-all disabled:opacity-30"
          >
            ↪ Redo
          </button>
          <div className="w-px h-5 bg-border-subtle mx-1" />
          <button onClick={toggleBeforeAfter}
            className={`px-2 py-1.5 rounded-lg text-[11px] transition-all ${
              showBeforeAfter ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            Before / After
          </button>
          <button onClick={resetAll}
            className="px-2 py-1.5 rounded-lg text-[11px] text-text-tertiary hover:text-neon-pink hover:bg-glass-medium transition-all"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <ImageCanvas />

        {/* Right panel */}
        <aside className="w-[240px] glass border-l border-border-subtle overflow-y-auto flex flex-col shrink-0">
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {renderPanel()}
          </div>

          {/* Export at bottom of panel */}
          <div className="border-t border-border-subtle p-3">
            <ExportDialog />
          </div>
        </aside>
      </div>
    </div>
  );
}
