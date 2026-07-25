"use client";

import { useState, useCallback } from "react";

interface EqualizerBand {
  freq: string;
  label: string;
  gain: number;
}

interface AudioEqualizerProps {
  onChange: (bands: number[]) => void;
}

const DEFAULT_BANDS: EqualizerBand[] = [
  { freq: "32", label: "32", gain: 0 },
  { freq: "64", label: "64", gain: 0 },
  { freq: "125", label: "125", gain: 0 },
  { freq: "250", label: "250", gain: 0 },
  { freq: "500", label: "500", gain: 0 },
  { freq: "1k", label: "1K", gain: 0 },
  { freq: "2k", label: "2K", gain: 0 },
  { freq: "4k", label: "4K", gain: 0 },
  { freq: "8k", label: "8K", gain: 0 },
  { freq: "16k", label: "16K", gain: 0 },
];

export function AudioEqualizer({ onChange }: AudioEqualizerProps) {
  const [bands, setBands] = useState<EqualizerBand[]>(DEFAULT_BANDS);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const handleBandChange = useCallback(
    (index: number, gain: number) => {
      const newBands = bands.map((b, i) => (i === index ? { ...b, gain: Math.max(-12, Math.min(12, gain)) } : b));
      setBands(newBands);
      onChange(newBands.map((b) => b.gain));
    },
    [bands, onChange],
  );

  const handleReset = () => {
    const resetBands = bands.map((b) => ({ ...b, gain: 0 }));
    setBands(resetBands);
    onChange(resetBands.map((b) => b.gain));
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-left glass rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        Equalizer (10-band)
      </button>
    );
  }

  return (
    <div className="glass rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Equalizer</span>
        <div className="flex gap-1">
          <button onClick={handleReset} className="text-[9px] text-text-tertiary hover:text-text-primary px-1">
            Reset
          </button>
          <button onClick={() => setExpanded(false)} className="text-[9px] text-text-tertiary hover:text-text-primary px-1">
            ▲
          </button>
        </div>
      </div>

      {/* EQ graph */}
      <div className="relative h-20 mb-1" style={{ touchAction: "none" }}>
        {/* Background grid */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-border-subtle absolute" style={{ top: "50%" }} />
          <div className="w-full h-px bg-border-subtle/30 absolute" style={{ top: "25%" }} />
          <div className="w-full h-px bg-border-subtle/30 absolute" style={{ top: "75%" }} />
        </div>

        {/* EQ curve (polyline) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <polyline
            points={bands
              .map((b, i) => {
                const x = (i / (bands.length - 1)) * 100;
                const y = 50 - (b.gain / 12) * 40;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(0, 245, 212, 0.6)"
            strokeWidth={2}
          />
          {/* Glow */}
          <polyline
            points={bands
              .map((b, i) => {
                const x = (i / (bands.length - 1)) * 100;
                const y = 50 - (b.gain / 12) * 40;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(0, 245, 212, 0.15)"
            strokeWidth={6}
          />
        </svg>

        {/* Band draggers */}
        {bands.map((band, i) => {
          const x = (i / (bands.length - 1)) * 100;
          const y = 50 - (band.gain / 12) * 40;
          return (
            <div
              key={band.freq}
              className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-neon-cyan bg-surface-secondary cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseDown={(e) => {
                e.preventDefault();
                setDragging(i);
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (!rect) return;

                const handleMove = (ev: MouseEvent) => {
                  const rect2 = e.currentTarget?.parentElement?.getBoundingClientRect();
                  if (!rect2) return;
                  const dy = ev.clientY - rect2.top;
                  const pctY = (dy / rect2.height) * 100;
                  const gain = Math.round((50 - pctY) * (12 / 40) * 10) / 10;
                  handleBandChange(i, gain);
                };

                const handleUp = () => {
                  setDragging(null);
                  document.removeEventListener("mousemove", handleMove);
                  document.removeEventListener("mouseup", handleUp);
                };

                document.addEventListener("mousemove", handleMove);
                document.addEventListener("mouseup", handleUp);
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-neon-cyan font-mono whitespace-nowrap opacity-0 group-hover:opacity-100">
                {band.gain > 0 ? "+" : ""}{band.gain.toFixed(1)}dB
              </div>
            </div>
          );
        })}
      </div>

      {/* Frequency labels */}
      <div className="flex justify-between px-0.5">
        {bands.map((band, i) => (
          <span
            key={band.freq}
            className={`text-[7px] text-text-tertiary ${i % 2 === 0 ? "" : "opacity-50"}`}
          >
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
