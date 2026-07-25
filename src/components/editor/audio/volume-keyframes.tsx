"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";

export function VolumeKeyframeEditor() {
  const { selectedClipId, clips, playhead, addVolumeKeyframe, removeVolumeKeyframe, updateVolumeKeyframe } = useEditorStore();
  const clip = clips.find((c) => c.id === selectedClipId);
  const [selectedKfIndex, setSelectedKfIndex] = useState<number | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  if (!clip) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-text-tertiary">Select a clip to edit volume keyframes</p>
      </div>
    );
  }

  const kfs = clip.volumeKeyframes || [];
  const duration = clip.duration;

  const handleGraphClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = graphRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      const time = Math.max(0, Math.min(duration, x * duration));
      const value = Math.max(0, Math.min(1, y));
      addVolumeKeyframe(clip.id, time, value);
    },
    [clip.id, duration, addVolumeKeyframe],
  );

  const handleKeyframeDrag = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedKfIndex(index);
      const rect = graphRef.current?.getBoundingClientRect();
      if (!rect) return;

      const handleMove = (ev: MouseEvent) => {
        const rect2 = graphRef.current?.getBoundingClientRect();
        if (!rect2) return;
        const x = (ev.clientX - rect2.left) / rect2.width;
        const y = 1 - (ev.clientY - rect2.top) / rect2.height;
        const time = Math.max(0, Math.min(duration, x * duration));
        const value = Math.max(0, Math.min(1, y));
        updateVolumeKeyframe(clip.id, index, { time, value });
      };

      const handleUp = () => {
        setSelectedKfIndex(null);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [clip.id, duration, updateVolumeKeyframe],
  );

  const addKeyframeAtPlayhead = () => {
    const relTime = Math.max(0, Math.min(duration, playhead - clip.startTime));
    addVolumeKeyframe(clip.id, relTime, 1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
          Volume Envelope
        </h4>
        <button
          onClick={addKeyframeAtPlayhead}
          className="text-[9px] px-2 py-0.5 rounded glass text-text-secondary hover:text-text-primary"
        >
          + at playhead
        </button>
      </div>

      {/* Graph editor */}
      <div
        ref={graphRef}
        className="relative h-20 glass rounded-lg cursor-crosshair overflow-hidden"
        onClick={handleGraphClick}
      >
        {/* Background grid */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 h-px bg-border-subtle/30"
              style={{ top: `${pct}%` }}
            />
          ))}
        </div>

        {/* Volume envelope line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {kfs.length > 0 && (
            <polyline
              points={kfs
                .map((kf) => {
                  const x = (kf.time / duration) * 100;
                  const y = (1 - kf.value) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(0, 245, 212, 0.7)"
              strokeWidth={2}
            />
          )}
        </svg>

        {/* Keyframe handles */}
        {kfs.map((kf, i) => {
          const x = (kf.time / duration) * 100;
          const y = (1 - kf.value) * 100;
          return (
            <div
              key={i}
              className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 cursor-grab active:cursor-grabbing transition-all ${
                selectedKfIndex === i
                  ? "border-neon-cyan bg-neon-cyan/30 scale-125"
                  : "border-neon-cyan bg-surface-secondary"
              }`}
              style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }}
              onMouseDown={(e) => handleKeyframeDrag(i, e)}
            />
          );
        })}

        {/* Empty state */}
        {kfs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] text-text-tertiary">Click to add keyframes</span>
          </div>
        )}
      </div>

      {/* Keyframe list */}
      {kfs.length > 0 && (
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {kfs.map((kf, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] ${
                selectedKfIndex === i ? "bg-neon-cyan/10" : "glass"
              }`}
            >
              <span className="text-text-tertiary font-mono w-12">
                {kf.time.toFixed(2)}s
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={kf.value}
                onChange={(e) => updateVolumeKeyframe(clip.id, i, { value: Number(e.target.value) })}
                className="flex-1 h-1 accent-neon-cyan"
              />
              <span className="text-text-primary font-mono w-8 text-right">
                {Math.round(kf.value * 100)}%
              </span>
              <button
                onClick={() => removeVolumeKeyframe(clip.id, i)}
                className="text-text-tertiary hover:text-neon-pink px-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
