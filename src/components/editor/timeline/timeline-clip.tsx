"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor-store";
import {
  clipLeft,
  clipWidth,
  pixelToTime,
  findTrimSnapPoint,
  hasOverlap,
} from "@/lib/timeline-utils";
import type { Clip, Track } from "@/types/editor";

interface TimelineClipProps {
  clip: Clip;
  track: Track;
  trackIndex: number;
  onContextMenu: (e: React.MouseEvent, clipId: string) => void;
}

export function TimelineClip({ clip, track, trackIndex, onContextMenu }: TimelineClipProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const [ghostTrim, setGhostTrim] = useState<{ edge: "start" | "end"; startTime: number; duration: number } | null>(null);
  const {
    zoom,
    scrollLeft,
    selectedClipId,
    selectClip,
    trimClip,
    snapEnabled,
    clips,
    playhead,
    dragState,
    setDragState,
    clearDragState,
  } = useEditorStore();

  const isSelected = selectedClipId === clip.id;
  const left = clipLeft(clip, zoom, scrollLeft);
  const width = clipWidth(clip, zoom);
  const trackClips = clips.filter((c) => c.trackId === clip.trackId);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, edge: "start" | "end" | "middle" | null) => {
      e.preventDefault();
      e.stopPropagation();
      selectClip(clip.id);
      if (track.locked) return;

      const startX = e.clientX;
      const originalStart = clip.startTime;
      const originalDuration = clip.duration;
      const originalTrimStart = clip.trimStart;
      const originalTrimEnd = clip.trimEnd;
      const originalSpeed = clip.speed;

      setDragState({
        type: edge === "start" ? "trim-start" : edge === "end" ? "trim-end" : "move",
        clipId: clip.id,
        startX,
        startTime: originalStart,
        originalStartTime: originalStart,
        originalDuration,
      });

      const isTrim = edge === "start" || edge === "end";

      const handleMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dt = pixelToTime(dx, zoom, 0) - pixelToTime(0, zoom, 0);

        if (!isTrim) {
          let newTime = originalStart + dt;
          if (snapEnabled) {
            const snapTime = findTrimSnapPoint(
              newTime,
              clip.id,
              clips,
              playhead,
              zoom,
            );
            if (snapTime !== null) newTime = snapTime;
          }
          newTime = Math.max(0, newTime);
          useEditorStore.getState().moveClip(clip.id, newTime);
          return;
        }

        if (edge === "start") {
          let newStartTime = originalStart + dt;
          let newTrimStart = originalTrimStart + dt;
          let newDuration = originalDuration - dt;

          if (newTrimStart < 0) {
            const excess = -newTrimStart;
            newTrimStart = 0;
            newStartTime = originalStart + dt + excess;
            newDuration = originalDuration - dt - excess;
          }

          if (snapEnabled) {
            const snapTime = findTrimSnapPoint(newStartTime, clip.id, clips, playhead, zoom);
            if (snapTime !== null) {
              const snapDt = snapTime - originalStart;
              newStartTime = snapTime;
              newTrimStart = Math.max(0, originalTrimStart + snapDt);
              newDuration = originalDuration - snapDt;
            }
          }

          newDuration = Math.max(0.1, newDuration);
          newStartTime = Math.max(0, newStartTime);

          setGhostTrim({ edge: "start", startTime: newStartTime, duration: newDuration });
        }

        if (edge === "end") {
          let newDuration = originalDuration + dt;

          if (snapEnabled) {
            const edgeTime = originalStart + originalDuration + dt;
            const snapTime = findTrimSnapPoint(edgeTime, clip.id, clips, playhead, zoom);
            if (snapTime !== null) {
              newDuration = snapTime - originalStart;
            }
          }

          newDuration = Math.max(0.1, newDuration);
          const newTrimEnd = Math.max(0, originalTrimEnd - dt);

          setGhostTrim({ edge: "end", startTime: originalStart, duration: newDuration });
        }
      };

      const handleUp = () => {
        if (isTrim && ghostTrim) {
          const newStart = edge === "start" ? ghostTrim.startTime : clip.startTime;
          const newDur = ghostTrim.duration;
          const newTrimStart = edge === "start" ? Math.max(0, clip.trimStart + (newStart - clip.startTime)) : clip.trimStart;
          const newTrimEnd = edge === "end" ? Math.max(0, clip.trimEnd + (clip.duration - newDur)) : clip.trimEnd;
          trimClip(clip.id, edge, newStart, newDur, newTrimStart, newTrimEnd);
          setGhostTrim(null);
        }
        clearDragState();
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [clip, zoom, selectedClipId, selectClip, trimClip, setDragState, clearDragState, snapEnabled, clips, playhead, track.locked, dragState, ghostTrim],
  );

  const typeColors: Record<string, string> = {
    video: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    audio: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    text: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    overlay: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
  };

  const isTrimming = dragState.type === "trim-start" || dragState.type === "trim-end";
  const ghostLeft = ghostTrim ? clipLeft({ startTime: ghostTrim.startTime }, zoom, scrollLeft) : left;
  const ghostWidth = ghostTrim ? clipWidth({ duration: ghostTrim.duration, speed: clip.speed }, zoom) : width;

  return (
    <>
      <motion.div
        ref={clipRef}
        layout
        className={`absolute top-1 bottom-1 rounded-lg border cursor-grab active:cursor-grabbing bg-gradient-to-br overflow-hidden group ${
          typeColors[clip.type] || "from-gray-500/20 to-gray-600/10 border-gray-500/30"
        } ${isSelected ? "ring-2 ring-neon-cyan shadow-lg shadow-neon-cyan/20" : ""} ${
          isTrimming ? "opacity-60" : ""
        }`}
        style={{ left, width, minWidth: 20 }}
        onMouseDown={(e) => {
          if (e.button === 2) return;
          handleMouseDown(e, "middle");
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectClip(clip.id);
        }}
        onContextMenu={(e) => onContextMenu(e, clip.id)}
      >
        {/* Trim handle left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:w-3 hover:bg-white/20 transition-all z-10 rounded-l-lg"
          style={{ background: isSelected ? "rgba(0,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
          onMouseDown={(e) => handleMouseDown(e, "start")}
        />

        {/* Waveform / thumbnail strip */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {Array.from({ length: Math.max(1, Math.floor(width / 6)) }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/20"
              style={{ left: i * 6 }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-2 py-1 h-full flex flex-col justify-center relative z-[1]">
          <span className="text-[11px] font-medium text-text-primary truncate leading-tight">
            {clip.name}
          </span>
          <span className="text-[10px] text-text-tertiary">
            {clip.duration.toFixed(1)}s
            {clip.trimStart > 0 && ` · in:${clip.trimStart.toFixed(1)}s`}
            {clip.trimEnd > 0 && ` · out:${clip.trimEnd.toFixed(1)}s`}
            {clip.speed !== 1 && ` ×${clip.speed}`}
          </span>
        </div>

        {/* Trim handle right */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:w-3 hover:bg-white/20 transition-all z-10 rounded-r-lg"
          style={{ background: isSelected ? "rgba(0,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
          onMouseDown={(e) => handleMouseDown(e, "end")}
        />
      </motion.div>

      {/* Ghost trim preview */}
      {ghostTrim && (
        <div
          className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed border-neon-cyan/50 pointer-events-none z-20"
          style={{
            left: ghostLeft,
            width: Math.max(ghostWidth, 20),
          }}
        >
          <div className="absolute inset-0 bg-neon-cyan/5 rounded-lg" />
        </div>
      )}
    </>
  );
}
