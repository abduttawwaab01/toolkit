"use client";

import { useState } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";

const GRADIENT_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Gold", colors: ["#000000", "#ffaa00", "#ffffff"] },
  { name: "Neon", colors: ["#000000", "#ff00ff", "#00ffff"] },
  { name: "Fire", colors: ["#000000", "#ff0000", "#ffff00", "#ffffff"] },
  { name: "Ocean", colors: ["#000033", "#0066ff", "#00ffff", "#ffffff"] },
  { name: "Pastel", colors: ["#ff6b9d", "#c44dff", "#6e44ff"] },
  { name: "Vintage", colors: ["#2d1b00", "#8b6914", "#f5deb3", "#ffffff"] },
  { name: "Noir", colors: ["#000000", "#333333", "#888888", "#ffffff"] },
  { name: "Forest", colors: ["#001a00", "#004d00", "#00cc00", "#ffffff"] },
];

export function EffectsPanel() {
  const [tab, setTab] = useState<"gradient" | "posterize" | "threshold" | "pixelate">("gradient");

  const gradientMap = useImageEditorStore((s) => s.gradientMap);
  const posterize = useImageEditorStore((s) => s.posterize);
  const threshold = useImageEditorStore((s) => s.threshold);
  const pixelate = useImageEditorStore((s) => s.pixelate);
  const setGradientMap = useImageEditorStore((s) => s.setGradientMap);
  const setPosterize = useImageEditorStore((s) => s.setPosterize);
  const setThreshold = useImageEditorStore((s) => s.setThreshold);
  const setPixelate = useImageEditorStore((s) => s.setPixelate);

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Effects</h3>
      <div className="flex gap-1">
        {(["gradient", "posterize", "threshold", "pixelate"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${tab === t ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"}`}
          >{t === "gradient" ? "Gradient Map" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "gradient" && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-tertiary">Map luminance values to a color gradient</p>
          <div className="grid grid-cols-2 gap-1.5">
            {GRADIENT_PRESETS.map((g) => (
              <button key={g.name} onClick={() => setGradientMap(gradientMap?.colors === g.colors ? null : { colors: g.colors, dither: false })}
                className={`glass rounded-lg p-2 transition-all active:scale-95 ${gradientMap?.colors === g.colors ? "ring-1 ring-neon-cyan" : "hover:bg-glass-medium"}`}
              >
                <div className="h-4 rounded mb-1" style={{
                  background: `linear-gradient(to right, ${g.colors.join(", ")})`,
                }} />
                <span className="text-[9px] text-text-secondary">{g.name}</span>
              </button>
            ))}
          </div>
          {gradientMap && (
            <button onClick={() => setGradientMap(null)} className="text-[10px] text-neon-pink hover:underline">Remove gradient map</button>
          )}
        </div>
      )}

      {tab === "posterize" && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-tertiary">Reduce the number of color levels</p>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-text-secondary">Levels</label>
              <span className="text-[10px] font-mono text-neon-cyan">{posterize ?? "—"}</span>
            </div>
            <input type="range" min={2} max={64} step={1}
              value={posterize ?? 8}
              onChange={(e) => setPosterize(Number(e.target.value) >= 64 ? null : Number(e.target.value))}
              className="w-full accent-neon-cyan h-1"
            />
          </div>
          {posterize && <button onClick={() => setPosterize(null)} className="text-[10px] text-neon-pink hover:underline">Remove</button>}
        </div>
      )}

      {tab === "threshold" && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-tertiary">Convert to pure black and white at a cutoff point</p>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-text-secondary">Level</label>
              <span className="text-[10px] font-mono text-neon-cyan">{threshold ?? "—"}</span>
            </div>
            <input type="range" min={0} max={255} step={1}
              value={threshold ?? 128}
              onChange={(e) => setThreshold(Number(e.target.value) <= 0 || Number(e.target.value) >= 255 ? null : Number(e.target.value))}
              className="w-full accent-neon-cyan h-1"
            />
          </div>
          {threshold && <button onClick={() => setThreshold(null)} className="text-[10px] text-neon-pink hover:underline">Remove</button>}
        </div>
      )}

      {tab === "pixelate" && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-tertiary">Pixelate the image by block size</p>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-text-secondary">Block Size</label>
              <span className="text-[10px] font-mono text-neon-cyan">{pixelate ? `${pixelate}px` : "—"}</span>
            </div>
            <input type="range" min={2} max={50} step={1}
              value={pixelate ?? 2}
              onChange={(e) => setPixelate(Number(e.target.value) <= 2 ? null : Number(e.target.value))}
              className="w-full accent-neon-cyan h-1"
            />
          </div>
          {pixelate && <button onClick={() => setPixelate(null)} className="text-[10px] text-neon-pink hover:underline">Remove</button>}
        </div>
      )}
    </div>
  );
}
