"use client";

import { useRef, useCallback, useState, WheelEvent } from "react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor-store";
import { pixelToTime, clampZoom } from "@/lib/timeline-utils";
import { TimelineRuler } from "./timeline-ruler";
import { TimelinePlayhead } from "./timeline-playhead";
import { TimelineTrack } from "./timeline-track";
import { TimelineContextMenu } from "./timeline-context-menu";
import { useTimelineKeyboard } from "./hooks/use-timeline-keyboard";

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null);
  const {
    tracks,
    clips,
    zoom,
    scrollLeft,
    setZoom,
    setScrollLeft,
    setPlayhead,
    project,
    snapEnabled,
  } = useEditorStore();

  const handleContextMenu = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    setContextMenu({ clipId, x: e.clientX, y: e.clientY });
  }, []);

  useTimelineKeyboard();

  // Handle timeline click to move playhead
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left + scrollLeft;
      const time = pixelToTime(x, zoom, 0);
      setPlayhead(time);
    },
    [zoom, scrollLeft, setPlayhead],
  );

  // Scroll wheel → horizontal scroll or zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newZoom = clampZoom(zoom * (1 + delta));
        setZoom(newZoom);
      } else {
        setScrollLeft(scrollLeft + e.deltaX || scrollLeft + e.deltaY);
      }
    },
    [zoom, scrollLeft, setZoom, setScrollLeft],
  );

  // Total timeline width
  const totalWidth = project.duration * zoom + 200;

  return (
    <div className="flex flex-col h-full bg-surface-secondary rounded-xl overflow-hidden border border-border-subtle">
      {/* Ruler */}
      <TimelineRuler />

      {/* Tracks area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-crosshair"
        onClick={handleTimelineClick}
        onWheel={handleWheel}
        style={{ scrollbarWidth: "thin" }}
      >
        <motion.div
          className="absolute inset-0 min-w-full"
          style={{ width: totalWidth, x: -scrollLeft }}
        >
          {/* Track backgrounds */}
          {tracks.map((track, index) => (
            <TimelineTrack key={track.id} track={track} index={index} onClipContextMenu={handleContextMenu} />
          ))}

          {/* Playhead */}
          <TimelinePlayhead />
        </motion.div>
      </div>

      {/* Timeline bottom controls */}
      <div className="flex items-center justify-between px-3 py-1.5 glass border-t border-border-subtle text-xs text-text-tertiary">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom(clampZoom(zoom * 1.3))}
            className="glass px-2 py-0.5 rounded hover:text-text-primary"
          >
            +
          </button>
          <span>{Math.round(zoom)}%</span>
          <button
            onClick={() => setZoom(clampZoom(zoom / 1.3))}
            className="glass px-2 py-0.5 rounded hover:text-text-primary"
          >
            −
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className={snapEnabled ? "text-neon-cyan" : ""}>Snap</span>
          <span>{project.fps} fps</span>
          <span>{project.width}×{project.height}</span>
        </div>
      </div>

      {/* Context menu */}
      <TimelineContextMenu
        clipId={contextMenu?.clipId ?? null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
