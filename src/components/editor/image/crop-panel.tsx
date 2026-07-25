"use client";

import { useRef, useState, useCallback } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import type { CropRect } from "@/types/image-editor";

const ASPECT_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "21:9", value: 21 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:5", value: 4 / 5 },
];

export function CropPanel() {
  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const cropRect = useImageEditorStore((s) => s.cropRect);
  const setCropRect = useImageEditorStore((s) => s.setCropRect);
  const commitCrop = useImageEditorStore((s) => s.commitCrop);
  const rotate = useImageEditorStore((s) => s.rotate);
  const flipH = useImageEditorStore((s) => s.flipH);
  const flipV = useImageEditorStore((s) => s.flipV);
  const [aspect, setAspect] = useState<number | null>(null);
  const [straighten, setStraighten] = useState(0);

  const initCrop = useCallback(() => {
    if (!displayCanvas) return;
    setCropRect({ x: 0, y: 0, w: displayCanvas.width, h: displayCanvas.height });
  }, [displayCanvas, setCropRect]);

  if (!displayCanvas) return null;

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Crop & Transform</h3>

      {!cropRect && (
        <button onClick={initCrop} className="w-full glass rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-all">
          Start Crop
        </button>
      )}

      {cropRect && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">Aspect Ratio</label>
            <div className="flex flex-wrap gap-1">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.label}
                  onClick={() => setAspect(ar.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                    aspect === ar.value ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary">X</label>
              <input type="number" value={Math.round(cropRect.x)} onChange={(e) => setCropRect({ ...cropRect, x: Number(e.target.value) })} className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Y</label>
              <input type="number" value={Math.round(cropRect.y)} onChange={(e) => setCropRect({ ...cropRect, y: Number(e.target.value) })} className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Width</label>
              <input type="number" value={Math.round(cropRect.w)} onChange={(e) => setCropRect({ ...cropRect, w: Number(e.target.value) })} className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary">Height</label>
              <input type="number" value={Math.round(cropRect.h)} onChange={(e) => setCropRect({ ...cropRect, h: Number(e.target.value) })} className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5" />
            </div>
          </div>

          <button onClick={commitCrop} className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg px-3 py-2 text-xs font-medium transition-all">
            Apply Crop
          </button>
        </div>
      )}

      <div className="border-t border-border-subtle pt-3">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Transform</h4>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => rotate(90)} className="glass px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1">
            ↻ 90°
          </button>
          <button onClick={() => rotate(-90)} className="glass px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1">
            ↺ 90°
          </button>
          <button onClick={flipH} className="glass px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1">
            ↔ Flip H
          </button>
          <button onClick={flipV} className="glass px-2.5 py-1.5 rounded-lg text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1">
            ↕ Flip V
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-text-secondary">Straighten</label>
            <span className="text-[10px] font-mono text-neon-cyan">{straighten}°</span>
          </div>
          <input type="range" min={-45} max={45} step={1} value={straighten}
            onChange={(e) => setStraighten(Number(e.target.value))}
            className="w-full accent-neon-cyan h-1"
          />
          {straighten !== 0 && (
            <button onClick={() => { rotate(straighten); setStraighten(0); }}
              className="mt-2 w-full glass rounded-lg px-2 py-1.5 text-[10px] text-text-secondary hover:text-text-primary"
            >
              Apply Straighten
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
