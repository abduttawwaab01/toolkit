"use client";

import { useCallback, WheelEvent } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { clampZoom } from "@/lib/timeline-utils";

/**
 * Handles timeline zoom via:
 * - Ctrl+Scroll (pinch equivalent on trackpad)
 * - Scroll wheel (horizontal scroll when not holding Ctrl)
 */
export function useTimelineZoom() {
  const { zoom, scrollLeft, setZoom, setScrollLeft } = useEditorStore();

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = -e.deltaY * 0.001;
        const newZoom = clampZoom(zoom * (1 + factor));
        setZoom(newZoom);
      } else {
        setScrollLeft(scrollLeft + e.deltaX + e.deltaY);
      }
    },
    [zoom, scrollLeft, setZoom, setScrollLeft],
  );

  return { handleWheel };
}
