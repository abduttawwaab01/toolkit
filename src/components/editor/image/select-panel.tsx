"use client";

import { useImageEditorStore } from "@/lib/image-editor-store";
import type { SelectTool, SelectionState } from "@/types/image-editor";

export function SelectPanel() {
  const selection = useImageEditorStore((s) => s.selection);
  const selectTool = useImageEditorStore((s) => s.selectTool);
  const selectFeather = useImageEditorStore((s) => s.selectFeather);
  const setSelection = useImageEditorStore((s) => s.setSelection);
  const setSelectTool = useImageEditorStore((s) => s.setSelectTool);
  const setSelectFeather = useImageEditorStore((s) => s.setSelectFeather);
  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);

  const newSelection = (type: SelectTool) => {
    if (!displayCanvas) return;
    setSelectTool(type);
    setSelection({
      type, x: Math.round(displayCanvas.width * 0.15), y: Math.round(displayCanvas.height * 0.15),
      w: Math.round(displayCanvas.width * 0.7), h: Math.round(displayCanvas.height * 0.7),
      feather: selectFeather, invert: false,
    });
  };

  const updateSelection = (updates: Partial<SelectionState>) => {
    if (!selection) return;
    setSelection({ ...selection, ...updates });
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Selection</h3>

      <div className="flex gap-1">
        <button onClick={() => newSelection("rect")}
          className={`px-3 py-1.5 rounded-lg text-[10px] transition-all ${selectTool === "rect" && selection ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"}`}
        >▭ Rectangle</button>
        <button onClick={() => newSelection("ellipse")}
          className={`px-3 py-1.5 rounded-lg text-[10px] transition-all ${selectTool === "ellipse" && selection ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"}`}
        >⬭ Ellipse</button>
      </div>

      {selection && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary">X</label>
              <input type="number" value={selection.x} onChange={(e) => updateSelection({ x: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Y</label>
              <input type="number" value={selection.y} onChange={(e) => updateSelection({ y: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Width</label>
              <input type="number" value={selection.w} onChange={(e) => updateSelection({ w: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Height</label>
              <input type="number" value={selection.h} onChange={(e) => updateSelection({ h: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-text-tertiary">Feather: {selection.feather}px</label>
            </div>
            <input type="range" min={0} max={100} value={selection.feather}
              onChange={(e) => updateSelection({ feather: Number(e.target.value) })}
              className="w-full accent-neon-cyan h-1"
            />
          </div>

          <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
            <input type="checkbox" checked={selection.invert}
              onChange={(e) => updateSelection({ invert: e.target.checked })}
              className="accent-neon-cyan" />
            Invert selection
          </label>

          <button onClick={() => setSelection(null)} className="w-full glass rounded-lg px-3 py-1.5 text-[10px] text-text-tertiary hover:text-neon-pink transition-all">
            Clear Selection
          </button>
        </div>
      )}

      {!selection && (
        <p className="text-[10px] text-text-tertiary">Click Rectangle or Ellipse to create a selection. Adjustments and filters will only apply within the selection area.</p>
      )}
    </div>
  );
}
