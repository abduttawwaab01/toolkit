"use client";

import { useImageEditorStore } from "@/lib/image-editor-store";
import { applyFrame } from "@/lib/image/editor";
import { useEffect, useRef, useState } from "react";

export function FramePanel() {
  const frame = useImageEditorStore((s) => s.frame);
  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const applyFrameSettings = useImageEditorStore((s) => s.applyFrameSettings);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!displayCanvas) return;
    const hasBorder = frame.borderWidth > 0;
    const hasShadow = frame.shadowBlur > 0;
    const hasRadius = frame.borderRadius > 0;
    if (!hasBorder && !hasShadow && !hasRadius) {
      setPreviewUrl(null);
      return;
    }
    const result = applyFrame(displayCanvas, frame);
    setPreviewUrl(result.toDataURL("image/png"));
  }, [frame, displayCanvas]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Frame & Border</h3>

      {previewUrl && (
        <div className="glass rounded-lg p-2 flex items-center justify-center">
          <img src={previewUrl} alt="Frame preview" className="max-w-full max-h-[120px] rounded" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-text-secondary">Border Width</label>
          <span className="text-[10px] font-mono text-neon-cyan">{frame.borderWidth}px</span>
        </div>
        <input type="range" min={0} max={50} value={frame.borderWidth}
          onChange={(e) => applyFrameSettings({ borderWidth: Number(e.target.value) })}
          className="w-full accent-neon-cyan h-1"
        />
      </div>

      {frame.borderWidth > 0 && (
        <div>
          <label className="text-[10px] text-text-tertiary mb-1 block">Border Color</label>
          <input type="color" value={frame.borderColor}
            onChange={(e) => applyFrameSettings({ borderColor: e.target.value })}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-text-secondary">Border Radius</label>
          <span className="text-[10px] font-mono text-neon-cyan">{frame.borderRadius}px</span>
        </div>
        <input type="range" min={0} max={200} value={frame.borderRadius}
          onChange={(e) => applyFrameSettings({ borderRadius: Number(e.target.value) })}
          className="w-full accent-neon-cyan h-1"
        />
      </div>

      <div className="border-t border-border-subtle pt-3">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Drop Shadow</h4>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-text-secondary">Blur</label>
            <span className="text-[10px] font-mono text-neon-cyan">{frame.shadowBlur}px</span>
          </div>
          <input type="range" min={0} max={50} value={frame.shadowBlur}
            onChange={(e) => applyFrameSettings({ shadowBlur: Number(e.target.value) })}
            className="w-full accent-neon-cyan h-1"
          />
        </div>
        {frame.shadowBlur > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-text-tertiary">Offset X</label>
                <input type="number" value={frame.shadowOffsetX}
                  onChange={(e) => applyFrameSettings({ shadowOffsetX: Number(e.target.value) })}
                  className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary">Offset Y</label>
                <input type="number" value={frame.shadowOffsetY}
                  onChange={(e) => applyFrameSettings({ shadowOffsetY: Number(e.target.value) })}
                  className="w-full glass rounded-lg px-2 py-1 text-xs mt-0.5"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[10px] text-text-tertiary mb-1 block">Shadow Color</label>
              <input type="color" value={frame.shadowColor}
                onChange={(e) => applyFrameSettings({ shadowColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
