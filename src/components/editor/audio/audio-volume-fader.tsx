"use client";

import { useRef, useState, useCallback } from "react";

interface AudioVolumeFaderProps {
  label: string;
  volume: number;
  muted: boolean;
  solo?: boolean;
  color: string;
  showSolo?: boolean;
  onChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle?: () => void;
}

export function AudioVolumeFader({
  label,
  volume,
  muted,
  solo,
  color,
  showSolo,
  onChange,
  onMuteToggle,
  onSoloToggle,
}: AudioVolumeFaderProps) {
  const faderRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = useCallback(
    (clientY: number) => {
      setDragging(true);
      const startY = clientY;
      const startVol = volume;

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        const currentY = "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
        const dy = startY - currentY;
        const newVol = Math.max(0, Math.min(2, startVol + dy / 100));
        onChange(newVol);
      };

      const handleUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleUp);
    },
    [volume, onChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart],
  );

  const dbVolume = volume === 0 ? -Infinity : 20 * Math.log10(volume);
  const displayDb = volume === 0 ? "−∞" : `${dbVolume.toFixed(1)}`;

  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1">
      {/* Label */}
      <span className="text-[9px] text-text-tertiary truncate max-w-[60px] text-center leading-tight">
        {label}
      </span>

      {/* Fader track */}
      <div
        ref={faderRef}
        className="relative w-4 h-24 glass rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
          style={{
            height: `${(volume / 2) * 100}%`,
            background: muted
              ? "linear-gradient(to top, #ff4d6a, #ff6b8a)"
              : `linear-gradient(to top, ${color}88, ${color})`,
            opacity: dragging ? 0.8 : muted ? 0.4 : 0.6,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-border-subtle"
          style={{
            bottom: `calc(${(volume / 2) * 100}% - 6px)`,
          }}
        />
      </div>

      {/* Volume display */}
      <span className="text-[9px] font-mono text-text-tertiary tabular-nums">
        {muted ? "MUTED" : displayDb}
      </span>

      {/* Buttons row */}
      <div className="flex items-center gap-1">
        <button
          onClick={onMuteToggle}
          className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
            muted ? "bg-neon-pink/20 text-neon-pink" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
          title="Mute"
        >
          M
        </button>
        {showSolo && onSoloToggle && (
          <button
            onClick={onSoloToggle}
            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
              solo ? "bg-amber-400/20 text-amber-400" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
            }`}
            title="Solo"
          >
            S
          </button>
        )}
      </div>
    </div>
  );
}
