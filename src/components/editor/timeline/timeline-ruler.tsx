"use client";

import { useMemo, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { getTimeInterval, pixelToTime } from "@/lib/timeline-utils";

export function TimelineRuler() {
  const { project, zoom, scrollLeft, setPlayhead } = useEditorStore();
  const { interval, labelEvery } = useMemo(() => getTimeInterval(zoom), [zoom]);

  const markers = useMemo(() => {
    const m = [];
    for (let t = 0; t <= project.duration; t += interval) {
      const labelIdx = Math.round(t / interval);
      const showLabel = labelIdx % labelEvery === 0;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      m.push({
        time: t,
        x: t * zoom - scrollLeft,
        label: showLabel ? `${mins}:${secs.toString().padStart(2, "0")}` : "",
        isMajor: showLabel,
      });
    }
    return m;
  }, [project.duration, zoom, scrollLeft, interval, labelEvery]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const time = pixelToTime(x, zoom, 0);
      setPlayhead(Math.max(0, Math.min(time, project.duration)));
    },
    [zoom, scrollLeft, setPlayhead, project.duration],
  );

  return (
    <div
      className="relative h-7 glass border-b border-border-subtle shrink-0 cursor-crosshair select-none"
      onClick={handleClick}
    >
      <div className="absolute inset-0" style={{ left: -scrollLeft }}>
        {markers.map((m) => (
          <div
            key={m.time}
            className="absolute top-0 h-full"
            style={{ left: m.x, transform: "translateX(-50%)" }}
          >
            <div className={`w-px h-full ${m.isMajor ? "bg-border-default" : "bg-border-subtle"}`} />
            {m.label && (
              <span className="absolute top-1 left-2 text-[10px] text-text-tertiary whitespace-nowrap">
                {m.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
