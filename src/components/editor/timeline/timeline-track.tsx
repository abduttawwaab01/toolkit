"use client";

import { useCallback, useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { TimelineClip } from "./timeline-clip";
import { TransitionBar } from "@/components/editor/effects/transition-bar";
import { pixelToTime } from "@/lib/timeline-utils";
import type { Track, Clip } from "@/types/editor";
import type { MediaItem } from "@/types/media";

interface TimelineTrackProps {
  track: Track;
  index: number;
}

interface TimelineTrackProps {
  track: Track;
  index: number;
  onClipContextMenu: (e: React.MouseEvent, clipId: string) => void;
}

export function TimelineTrack({ track, index, onClipContextMenu }: TimelineTrackProps) {
  const { selectedTrackId, selectTrack, clips, zoom, scrollLeft, addClip, transitions } = useEditorStore();
  const trackClips = clips.filter((c) => c.trackId === track.id);
  const trackTransitions = transitions.filter((t) => t.trackId === track.id);
  const isSelected = selectedTrackId === track.id;
  const [dragOver, setDragOver] = useState(false);

  // ─── Drop handler: create clip from media item ───
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (track.locked) return;

      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;

      try {
        const media: MediaItem = JSON.parse(raw);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft;
        const dropTime = pixelToTime(x, zoom, 0);
        const snappedTime = Math.max(0, dropTime);

        // Map media type to track type
        let clipType: Clip["type"] = "video";
        if (media.type === "audio") clipType = "audio";

        addClip({
          trackId: track.id,
          type: clipType,
          name: media.name,
          src: media.url,
          thumbnail: media.thumbnailUrl,
          startTime: snappedTime,
          duration: media.duration || 5,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          volume: 1,
          volumeKeyframes: [],
          effects: [],
          opacity: 1,
          scale: 1,
          rotation: 0,
          positionX: 0,
          positionY: 0,
        });
      } catch {
        // Invalid drag data
      }
    },
    [track.id, track.locked, zoom, scrollLeft, addClip],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const top = index * track.height;

  return (
    <div
      className={`absolute left-0 right-0 border-b border-border-subtle transition-all ${
        isSelected ? "bg-neon-cyan/5" : "hover:bg-glass-light"
      } ${track.locked ? "opacity-50" : ""} ${dragOver ? "bg-neon-cyan/10 ring-2 ring-neon-cyan/40" : ""}`}
      style={{ top, height: track.height }}
      onClick={(e) => {
        e.stopPropagation();
        selectTrack(track.id);
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Track label (fixed left) */}
      <div
        className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pr-2 text-xs font-medium text-text-secondary gap-2 border-r border-border-subtle bg-surface-secondary z-10"
        style={{ width: 120 }}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
        <span className="truncate">{track.name}</span>
        {track.muted && <span className="text-neon-pink text-[10px]">M</span>}
        {track.locked && <span className="text-text-tertiary text-[10px]">🔒</span>}
      </div>

      {/* Drop indicator */}
      {dragOver && (
        <div className="absolute left-[120px] right-0 top-0 bottom-0 border-2 border-dashed border-neon-cyan/40 rounded-lg pointer-events-none" />
      )}

      {/* Clips on this track */}
      <div className="absolute left-[120px] right-0 top-0 bottom-0">
        {trackClips.map((clip) => (
          <TimelineClip key={clip.id} clip={clip} track={track} trackIndex={index} onContextMenu={onClipContextMenu} />
        ))}
        {/* Transition bars */}
        {trackTransitions.map((t) => (
          <TransitionBar key={t.id} transition={t} />
        ))}
      </div>
    </div>
  );
}
