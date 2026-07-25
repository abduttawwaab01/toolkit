"use client";

import { useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { pixelToTime, findSnapPoint } from "@/lib/timeline-utils";

/**
 * Handles dragging clips on the timeline.
 * Supports: move, trim-start, trim-end.
 * Integrated with snap-to-playhead and snap-to-clip-edges.
 */
export function useTimelineDrag() {
  const dragRef = useRef<{
    clipId: string;
    type: "move" | "trim-start" | "trim-end";
    startX: number;
    originalStartTime: number;
    originalDuration: number;
  } | null>(null);

  const startDrag = useCallback(
    (clipId: string, type: "move" | "trim-start" | "trim-end", clientX: number) => {
      const clip = useEditorStore.getState().clips.find((c) => c.id === clipId);
      if (!clip) return;

      dragRef.current = {
        clipId,
        type,
        startX: clientX,
        originalStartTime: clip.startTime,
        originalDuration: clip.duration,
      };

      useEditorStore.getState().setDragState({
        type,
        clipId,
        startX: clientX,
        startTime: clip.startTime,
        originalStartTime: clip.startTime,
        originalDuration: clip.duration,
      });
    },
    [],
  );

  const onDrag = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { zoom, snapEnabled, clips, playhead } = useEditorStore.getState();
      const dx = clientX - drag.startX;
      const dt = pixelToTime(dx, zoom, 0);

      if (drag.type === "move") {
        let newTime = drag.originalStartTime + dt;
        if (snapEnabled) {
          const snap = findSnapPoint(
            { id: drag.clipId, startTime: newTime, duration: drag.originalDuration, speed: 1 },
            clips,
            playhead,
            zoom,
          );
          if (snap !== null) newTime = snap;
        }
        useEditorStore.getState().moveClip(drag.clipId, Math.max(0, newTime));
      }

      if (drag.type === "trim-end") {
        const newDuration = Math.max(0.1, drag.originalDuration + dt);
        useEditorStore.getState().updateClip(drag.clipId, { duration: newDuration });
      }
    },
    [],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    useEditorStore.getState().clearDragState();
  }, []);

  return { startDrag, onDrag, endDrag };
}
