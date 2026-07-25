"use client";

import { useRef, useCallback, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { pixelToTime, timeToPixel, generateRulerMarkers } from "@/lib/timeline-utils";
import { useTouch, type TouchGesture } from "@/components/ui/hooks/use-touch";

export function MobileTimeline() {
  const { clips, tracks, playhead, zoom, scrollLeft, setPlayhead, setZoom, setScrollLeft } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef({ startScroll: 0, startZoom: 100 });

  const handleGesture = useCallback((gesture: TouchGesture) => {
    switch (gesture.type) {
      case "tap":
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const relX = gesture.x - rect.left + scrollLeft;
          const time = pixelToTime(relX, zoom, 0);
          setPlayhead(Math.max(0, time));
        }
        break;
      case "doubletap":
        setPlayhead(0);
        break;
      case "swipe-left":
        setScrollLeft(scrollLeft + 100);
        break;
      case "swipe-right":
        setScrollLeft(Math.max(0, scrollLeft - 100));
        break;
    }
  }, [zoom, scrollLeft, setPlayhead, setScrollLeft]);

  const { handlers } = useTouch({
    onGesture: handleGesture,
    onDragStart: () => {
      scrollRef.current.startScroll = scrollLeft;
    },
    onDragMove: (x, y, dx) => {
      if (containerRef.current) {
        setScrollLeft(Math.max(0, scrollRef.current.startScroll - dx));
      }
    },
    threshold: 10,
  });

  const totalDuration = useMemo(() => {
    const maxEnd = clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    return Math.max(30, Math.ceil(maxEnd));
  }, [clips]);

  const markers = useMemo(() => generateRulerMarkers(totalDuration, zoom), [totalDuration, zoom]);
  const containerWidth = useMemo(() => timeToPixel(totalDuration, zoom, 0) + 200, [totalDuration, zoom]);

  return (
    <div className="select-none touch-none">
      <div className="h-6 bg-surface/80 border-b border-border-subtle relative overflow-hidden">
        <div
          className="absolute h-full"
          style={{ width: containerWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {markers.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full flex items-start"
              style={{ left: timeToPixel(m.time, zoom, 0) }}
            >
              <div className="w-px h-2 bg-border-subtle" />
              <span className="text-[8px] text-text-tertiary ml-1 font-mono">
                {m.time >= 60 ? `${Math.floor(m.time / 60)}:${(m.time % 60).toString().padStart(2, "0")}` : `${m.time.toFixed(1)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: Math.max(tracks.length * 44, 120) }}
        {...handlers}
      >
        <div
          className="absolute inset-0"
          style={{ width: containerWidth, transform: `translateX(-${scrollLeft}px)` }}
        >
          {tracks.map((track, ti) => (
            <div
              key={track.id}
              className="absolute left-0 right-0 border-b border-border-subtle/50"
              style={{ top: ti * 44, height: 44 }}
            >
              <div className="flex items-center gap-1 px-1.5 py-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                <span className="text-[8px] text-text-tertiary font-mono truncate">{track.name.slice(0, 8)}</span>
              </div>
            </div>
          ))}

          {clips.map((clip) => {
            const track = tracks.find((t) => t.id === clip.trackId);
            const trackIndex = tracks.indexOf(track!);
            if (trackIndex === -1) return null;

            return (
              <div
                key={clip.id}
                className="absolute rounded-md flex items-center px-1.5 overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
                style={{
                  left: timeToPixel(clip.startTime, zoom, 0),
                  width: Math.max(timeToPixel(clip.duration, zoom, 0), 4),
                  top: trackIndex * 44 + 2,
                  height: 40,
                  backgroundColor: clip.type === "video" ? "#4facfe" : clip.type === "audio" ? "#00f5d4" : "#bf6aff",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  useEditorStore.getState().selectClip(clip.id);
                }}
              >
                <span className="text-[8px] text-white font-medium truncate drop-shadow-md">{clip.name}</span>
              </div>
            );
          })}

          <div
            className="absolute top-0 w-0.5 bg-neon-cyan z-10 pointer-events-none"
            style={{
              left: timeToPixel(playhead, zoom, 0),
              height: "100%",
              boxShadow: "0 0 8px rgba(0, 245, 212, 0.6)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-1.5 border-t border-border-subtle">
        <button onClick={() => setZoom(zoom / 1.5)} className="size-6 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all text-[11px]" aria-label="Zoom out">−</button>
        <span className="text-[9px] text-text-tertiary font-mono min-w-[40px] text-center">{Math.round(zoom)}%</span>
        <button onClick={() => setZoom(zoom * 1.5)} className="size-6 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all text-[11px]" aria-label="Zoom in">+</button>
      </div>
    </div>
  );
}
