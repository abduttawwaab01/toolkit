"use client";

import { useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";

/**
 * Returns snap points for the current timeline state.
 * Used by the drag system to align clips.
 */
export function useTimelineSnap() {
  const { clips, playhead, snapEnabled } = useEditorStore();

  const snapPoints = useMemo(() => {
    if (!snapEnabled) return [];

    const points: number[] = [0, playhead];

    for (const clip of clips) {
      points.push(clip.startTime);
      points.push(clip.startTime + clip.duration / clip.speed);
    }

    // Remove duplicates and sort
    return [...new Set(points)].sort((a, b) => a - b);
  }, [clips, playhead, snapEnabled]);

  return { snapPoints };
}
