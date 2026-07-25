"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useTouch, type TouchGesture } from "@/components/ui/hooks/use-touch";
import { Play, Square, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";

export function MobilePlayer() {
  const { isPlaying, togglePlay, playhead, setPlayhead, project, previewMuted, toggleMute, clips } = useEditorStore();
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeClip = clips.find((c) => c.type === "video" && c.startTime <= playhead && c.startTime + c.duration >= playhead);

  const showControlsTemp = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleGesture = useCallback((gesture: TouchGesture) => {
    switch (gesture.type) {
      case "tap":
        showControlsTemp();
        break;
      case "doubletap":
        togglePlay();
        break;
      case "swipe-left":
      case "swipe-right": {
        const dir = gesture.type === "swipe-right" ? -1 : 1;
        const seekAmount = 5;
        setPlayhead(Math.max(0, Math.min(project.duration, playhead + dir * seekAmount)));
        break;
      }
      case "swipe-up":
        setIsFullscreen((p) => !p);
        break;
    }
  }, [togglePlay, playhead, setPlayhead, project.duration, showControlsTemp]);

  const { handlers } = useTouch({
    onGesture: handleGesture,
    threshold: 20,
  });

  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  // Sync video element
  useEffect(() => {
    const video = containerRef.current?.querySelector("video");
    if (video && video !== videoRef.current) {
      videoRef.current = video;
    }
  });

  const progress = project.duration > 0 ? (playhead / project.duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
      {...handlers}
    >
      {/* Video element */}
      <video
        className="w-full aspect-video object-contain cursor-pointer"
        src={activeClip?.src || undefined}
        muted={previewMuted}
        playsInline
        onClick={showControlsTemp}
      />

      {!activeClip && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-14 rounded-2xl glass flex items-center justify-center">
            <Play size={24} className="text-neon-cyan ml-1" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-surface-light/30 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setPlayhead(pct * project.duration);
          }}
        >
          <div
            className="h-full bg-neon-cyan transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="size-9 rounded-xl glass flex items-center justify-center active:scale-90 transition-transform"
              aria-label={isPlaying ? "Stop" : "Play"}
            >
              {isPlaying ? <Square size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="size-9 rounded-xl glass flex items-center justify-center active:scale-90 transition-transform"
              aria-label={previewMuted ? "Unmute" : "Mute"}
            >
              {previewMuted ? <VolumeX size={14} className="text-text-tertiary" /> : <Volume2 size={14} className="text-white" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/70 font-mono">
              {Math.floor(playhead / 60)}:{(playhead % 60).toFixed(1).padStart(4, "0")}
            </span>
            <button
              onClick={() => setIsFullscreen((p) => !p)}
              className="size-9 rounded-xl glass flex items-center justify-center active:scale-90 transition-transform"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={14} className="text-white" /> : <Maximize2 size={14} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
