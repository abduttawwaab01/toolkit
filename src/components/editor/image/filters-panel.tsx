"use client";

import React, { useRef, useEffect } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { IMAGE_FILTERS, FILTER_CATEGORIES } from "@/lib/image/filters";

function FilterPreview({ filterId, name, category }: { filterId: string; name: string; category: string }) {
  const sourceCanvas = useImageEditorStore((s) => s.sourceCanvas);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cat = FILTER_CATEGORIES.find((c) => c.key === category);

  useEffect(() => {
    if (!canvasRef.current || !sourceCanvas) return;
    const filter = IMAGE_FILTERS.find((f) => f.id === filterId);
    if (!filter) return;
    const preview = document.createElement("canvas");
    preview.width = 80;
    preview.height = 60;
    const ctx = preview.getContext("2d")!;
    ctx.drawImage(sourceCanvas, 0, 0, 80, 60);
    const imageData = ctx.getImageData(0, 0, 80, 60);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = filter.apply(data[i], data[i + 1], data[i + 2], 80);
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(imageData, 0, 0);
    canvasRef.current.width = 80;
    canvasRef.current.height = 60;
    canvasRef.current.getContext("2d")!.drawImage(preview, 0, 0);
  }, [sourceCanvas, filterId]);

  const isActive = useImageEditorStore((s) => s.activeFilter) === filterId;
  const applyFilter = useImageEditorStore((s) => s.applyFilter);

  return (
    <button
      onClick={() => applyFilter(isActive ? null : filterId)}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all active:scale-95 ${
        isActive ? "bg-neon-cyan/15 ring-1 ring-neon-cyan" : "hover:bg-glass-medium"
      }`}
    >
      <canvas
        ref={canvasRef}
        width={80}
        height={60}
        className="w-[76px] h-[56px] rounded-md object-cover"
        style={{ border: cat ? `1px solid ${cat.color}33` : undefined }}
      />
      <div className="flex items-center gap-1">
        {cat && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
        <span className="text-[10px] text-text-secondary truncate max-w-[68px]">{name}</span>
      </div>
    </button>
  );
}

export function FiltersPanel() {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const activeFilter = useImageEditorStore((s) => s.activeFilter);
  const filterStrength = useImageEditorStore((s) => s.filterStrength);
  const setFilterStrength = useImageEditorStore((s) => s.setFilterStrength);

  const filtered = activeCategory
    ? IMAGE_FILTERS.filter((f) => f.category === activeCategory)
    : IMAGE_FILTERS;

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Filters</h3>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all ${
            !activeCategory ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
          }`}
        >
          All
        </button>
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all flex items-center gap-1 ${
              activeCategory === cat.key ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {filtered.map((f) => (
          <FilterPreview key={f.id} filterId={f.id} name={f.name} category={f.category} />
        ))}
      </div>

      {activeFilter && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-text-secondary">Strength</label>
            <span className="text-[10px] font-mono text-neon-cyan">{filterStrength}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={1} value={filterStrength}
            onChange={(e) => setFilterStrength(Number(e.target.value))}
            className="w-full accent-neon-cyan h-1"
          />
        </div>
      )}
    </div>
  );
}
