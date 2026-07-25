"use client";

import { useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { timeToPixel, pixelToTime } from "@/lib/timeline-utils";

export function TimelinePlayhead() {
  const playheadRef = useRef<HTMLDivElement>(null);
  const { playhead, zoom, scrollLeft, setPlayhead, isPlaying, project } = useEditorStore();
  const x = timeToPixel(playhead, zoom, 0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startTime = playhead;

      const handleMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const newTime = pixelToTime(dx, zoom, 0) + startTime;
        setPlayhead(Math.max(0, Math.min(newTime, project.duration)));
      };

      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [playhead, zoom, setPlayhead, project.duration],
  );

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 bottom-0 z-20 pointer-events-none"
      style={{ left: x, transform: "translateX(-50%)" }}
    >
      {/* Handle - draggable triangle */}
      <div
        className="pointer-events-auto w-3 h-3 bg-neon-cyan rotate-45 absolute -top-1 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing shadow-lg shadow-neon-cyan/50 z-10"
        onMouseDown={handleMouseDown}
      />
      {/* Line */}
      <div className="w-px h-full bg-neon-cyan shadow-[0_0_6px_rgba(0,245,212,0.5)]" />
    </div>
  );
}
