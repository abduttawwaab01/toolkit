"use client";

import { useCallback } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { ADJUSTMENT_DEFINITIONS } from "@/types/image-editor";
import { autoEnhance } from "@/lib/image/editor";

export function AdjustPanel() {
  const adjustments = useImageEditorStore((s) => s.adjustments);
  const setAdjustment = useImageEditorStore((s) => s.setAdjustment);
  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const resetAll = useImageEditorStore((s) => s.resetAll);

  const handleAutoEnhance = useCallback(() => {
    const canvas = displayCanvas;
    if (!canvas) return;
    resetAll();
    const params = autoEnhance(canvas);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== 0) setAdjustment(key, value);
    });
  }, [displayCanvas, resetAll, setAdjustment]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Adjustments</h3>
      <button onClick={handleAutoEnhance} className="w-full bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan rounded-lg px-3 py-2 text-xs font-medium transition-all mb-2">
        Auto Enhance
      </button>
      <div className="space-y-2.5">
        {ADJUSTMENT_DEFINITIONS.map((def) => {
          const val = adjustments[def.key] ?? def.default;
          const isOff = Math.abs(val - def.default) < (def.step || 1) * 0.5;
          return (
            <div key={def.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-text-secondary">{def.label}</label>
                <span className={`text-[10px] font-mono tabular-nums ${isOff ? "text-text-tertiary" : "text-neon-cyan"}`}>
                  {val > 0 ? "+" : ""}{Number(val.toFixed(1))}
                </span>
              </div>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={val}
                onChange={(e) => setAdjustment(def.key, Number(e.target.value))}
                className="w-full accent-neon-cyan h-1"
              />
              <div className="flex justify-between text-[8px] text-text-tertiary px-0.5 -mt-0.5">
                <span>{def.min}</span>
                <span>{def.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
