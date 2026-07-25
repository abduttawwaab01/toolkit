"use client";

import { useState } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import type { CurvePoint, HSLChannels, ColorBalanceChannels } from "@/types/image-editor";

type GradeTab = "curves" | "hsl" | "balance" | "vignette";

const HSL_CHANNELS: { key: keyof HSLChannels; label: string; color: string }[] = [
  { key: "red", label: "Reds", color: "#ff4444" },
  { key: "green", label: "Greens", color: "#44ff44" },
  { key: "blue", label: "Blues", color: "#4488ff" },
  { key: "cyan", label: "Cyans", color: "#44dddd" },
  { key: "magenta", label: "Magentas", color: "#ff44ff" },
  { key: "yellow", label: "Yellows", color: "#ffff44" },
];

export function ColorGradePanel() {
  const [tab, setTab] = useState<GradeTab>("curves");
  const curves = useImageEditorStore((s) => s.curves);
  const setCurves = useImageEditorStore((s) => s.setCurves);
  const hsl = useImageEditorStore((s) => s.hsl);
  const setHSL = useImageEditorStore((s) => s.setHSL);
  const colorBalance = useImageEditorStore((s) => s.colorBalance);
  const setColorBalance = useImageEditorStore((s) => s.setColorBalance);
  const vignette = useImageEditorStore((s) => s.vignette);
  const setVignette = useImageEditorStore((s) => s.setVignette);

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Color Grade</h3>
      <div className="flex gap-1">
        {(["curves", "hsl", "balance", "vignette"] as GradeTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${tab === t ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"}`}
          >
            {t === "curves" ? "Curves" : t === "hsl" ? "HSL" : t === "balance" ? "Balance" : "Vignette"}
          </button>
        ))}
      </div>

      {tab === "curves" && <CurvesEditor curves={curves} onChange={setCurves} />}
      {tab === "hsl" && <HSLControls hsl={hsl} onChange={setHSL} />}
      {tab === "balance" && <ColorBalanceControls cb={colorBalance} onChange={setColorBalance} />}
      {tab === "vignette" && <VignetteControls vg={vignette} onChange={setVignette} />}
    </div>
  );
}

function CurvesEditor({ curves, onChange }: { curves: CurvePoint[] | null; onChange: (p: CurvePoint[] | null) => void }) {
  const [editing, setEditing] = useState(false);

  const reset = () => onChange(null);
  const addPoint = () => {
    const pts = curves ? [...curves] : [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    pts.push({ x: 0.5, y: 0.5 });
    pts.sort((a, b) => a.x - b.x);
    onChange(pts);
  };
  const updatePoint = (index: number, x: number, y: number) => {
    if (!curves) return;
    const pts = curves.map((p, i) => i === index ? { x: clamp01(x), y: clamp01(y) } : p);
    onChange(pts);
  };
  const removePoint = (index: number) => {
    if (!curves || curves.length <= 2) return;
    onChange(curves.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button onClick={addPoint} className="px-2 py-1 rounded-lg text-[10px] glass text-text-secondary hover:text-text-primary">+ Point</button>
        {curves && <button onClick={reset} className="px-2 py-1 rounded-lg text-[10px] glass text-text-secondary hover:text-text-primary">Reset</button>}
      </div>
      {curves && (
        <div className="glass rounded-lg p-2 space-y-1 max-h-[200px] overflow-y-auto">
          {curves.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <span className="text-text-tertiary w-4">{i}</span>
              <input type="number" min={0} max={1} step={0.01} value={Number(p.x.toFixed(2))}
                onChange={(e) => updatePoint(i, Number(e.target.value), p.y)}
                className="w-16 glass rounded px-1.5 py-0.5 text-[10px] font-mono"
              />
              <input type="range" min={0} max={1} step={0.01} value={p.y}
                onChange={(e) => updatePoint(i, p.x, Number(e.target.value))}
                className="flex-1 accent-neon-cyan h-1"
              />
              <span className="font-mono text-neon-cyan w-8 text-right">{Math.round(p.y * 255)}</span>
              <button onClick={() => removePoint(i)} className="text-neon-pink hover:opacity-70 disabled:opacity-20" disabled={curves.length <= 2}>✕</button>
            </div>
          ))}
        </div>
      )}
      {!curves && <p className="text-[10px] text-text-tertiary">No curve adjustments. Click "+ Point" to start.</p>}
    </div>
  );
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function HSLControls({ hsl, onChange }: { hsl: HSLChannels; onChange: (ch: keyof HSLChannels, v: Partial<{ hue: number; saturation: number; luminance: number }>) => void }) {
  const [activeChannel, setActiveChannel] = useState<keyof HSLChannels>("red");
  const ch = hsl[activeChannel];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {HSL_CHANNELS.map((c) => (
          <button key={c.key} onClick={() => setActiveChannel(c.key)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all flex items-center gap-1 ${
              activeChannel === c.key ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
          </button>
        ))}
      </div>
      <Slider label="Hue" value={ch.hue} min={-180} max={180} onChange={(v) => onChange(activeChannel, { hue: v })} />
      <Slider label="Saturation" value={ch.saturation} min={-100} max={100} onChange={(v) => onChange(activeChannel, { saturation: v })} />
      <Slider label="Luminance" value={ch.luminance} min={-100} max={100} onChange={(v) => onChange(activeChannel, { luminance: v })} />
    </div>
  );
}

function ColorBalanceControls({ cb, onChange }: { cb: ColorBalanceChannels; onChange: (range: "shadows" | "midtones" | "highlights", channel: "cyanRed" | "magentaGreen" | "yellowBlue", value: number) => void }) {
  const [range, setRange] = useState<"shadows" | "midtones" | "highlights">("midtones");
  const r = cb[range];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["shadows", "midtones", "highlights"] as const).map((rng) => (
          <button key={rng} onClick={() => setRange(rng)}
            className={`px-2 py-1 rounded-lg text-[10px] transition-all ${range === rng ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"}`}
          >{rng === "shadows" ? "Shadows" : rng === "midtones" ? "Midtones" : "Highlights"}</button>
        ))}
      </div>
      <Slider label="Cyan ↔ Red" value={r.cyanRed} min={-50} max={50} onChange={(v) => onChange(range, "cyanRed", v)} />
      <Slider label="Magenta ↔ Green" value={r.magentaGreen} min={-50} max={50} onChange={(v) => onChange(range, "magentaGreen", v)} />
      <Slider label="Yellow ↔ Blue" value={r.yellowBlue} min={-50} max={50} onChange={(v) => onChange(range, "yellowBlue", v)} />
    </div>
  );
}

function VignetteControls({ vg, onChange }: { vg: any; onChange: (s: any) => void }) {
  return (
    <div className="space-y-2">
      <Slider label="Amount" value={vg.amount} min={-100} max={100} onChange={(v) => onChange({ amount: v })} />
      <Slider label="Feather" value={vg.feather} min={0} max={100} onChange={(v) => onChange({ feather: v })} />
      <Slider label="Roundness" value={vg.roundness} min={0} max={100} onChange={(v) => onChange({ roundness: v })} />
      <Slider label="Highlights" value={vg.highlights} min={0} max={100} onChange={(v) => onChange({ highlights: v })} />
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const isOff = value === 0 || (min < 0 && max > 0 && value === 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] text-text-secondary">{label}</label>
        <span className={`text-[10px] font-mono tabular-nums ${isOff ? "text-text-tertiary" : "text-neon-cyan"}`}>
          {value > 0 ? "+" : ""}{Number(value.toFixed(1))}
        </span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neon-cyan h-1"
      />
    </div>
  );
}
