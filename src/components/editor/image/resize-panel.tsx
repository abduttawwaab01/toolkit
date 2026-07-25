"use client";

import { useImageEditorStore } from "@/lib/image-editor-store";

const PRESETS = [
  { label: "Small (640×)", w: 640 },
  { label: "Medium (1024×)", w: 1024 },
  { label: "Large (1920×)", w: 1920 },
  { label: "HD (1280×720)", w: 1280, h: 720 },
  { label: "Full HD (1920×1080)", w: 1920, h: 1080 },
  { label: "4K (3840×2160)", w: 3840, h: 2160 },
  { label: "Square (1080×1080)", w: 1080, h: 1080 },
  { label: "Story (1080×1920)", w: 1080, h: 1920 },
];

export function ResizePanel() {
  const exportWidth = useImageEditorStore((s) => s.exportWidth);
  const exportHeight = useImageEditorStore((s) => s.exportHeight);
  const exportLockAspect = useImageEditorStore((s) => s.exportLockAspect);
  const originalWidth = useImageEditorStore((s) => s.originalWidth);
  const originalHeight = useImageEditorStore((s) => s.originalHeight);
  const commitResize = useImageEditorStore((s) => s.commitResize);
  const setExportWidth = useImageEditorStore((s) => s.setExportWidth);
  const setExportHeight = useImageEditorStore((s) => s.setExportHeight);

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Resize</h3>

      <div className="text-[11px] text-text-secondary">
        Original: {originalWidth} × {originalHeight}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-tertiary">Width</label>
          <input type="number" value={exportWidth} min={1}
            onChange={(e) => setExportWidth(Number(e.target.value))}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-neon-cyan/30"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary">Height</label>
          <input type="number" value={exportHeight} min={1}
            onChange={(e) => setExportHeight(Number(e.target.value))}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-0.5 focus:outline-none focus:border-neon-cyan/30"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
        <input type="checkbox" checked={exportLockAspect}
          onChange={() => useImageEditorStore.getState().exportLockAspect = !exportLockAspect}
          className="accent-neon-cyan"
        />
        Maintain aspect ratio
      </label>

      <div>
        <label className="text-[10px] text-text-tertiary mb-1 block">Presets</label>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                if (p.h) {
                  setExportWidth(p.w);
                  useImageEditorStore.getState().exportLockAspect = false;
                  setExportHeight(p.h);
                } else {
                  const ratio = originalHeight / originalWidth;
                  setExportWidth(p.w);
                  useImageEditorStore.getState().exportLockAspect = true;
                  setExportHeight(Math.round(p.w * ratio));
                }
              }}
              className="px-2 py-1 rounded-lg text-[10px] glass text-text-tertiary hover:text-text-primary transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={commitResize} className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg px-3 py-2 text-xs font-medium transition-all">
        Apply Resize
      </button>
    </div>
  );
}
