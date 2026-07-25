"use client";

import { useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  duration: number;
  buffered: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function PlayerControls({
  videoRef,
  duration,
  buffered,
  isFullscreen,
  onToggleFullscreen,
}: PlayerControlsProps) {
  const seekRef = useRef<HTMLDivElement>(null);
  const { isPlaying, playhead, setIsPlaying, setPlayhead, previewMuted, toggleMute } = useEditorStore();

  // ─── Seek bar interaction ───
  const handleSeek = useCallback(
    (clientX: number) => {
      const seek = seekRef.current;
      const video = videoRef.current;
      if (!seek || !duration || !video) return;

      const rect = seek.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = ratio * duration;
      video.currentTime = time;
      setPlayhead(time);
    },
    [duration, videoRef, setPlayhead],
  );

  const handleSeekMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleSeek(e.clientX);

      const handleMove = (ev: MouseEvent) => handleSeek(ev.clientX);
      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [handleSeek],
  );

  // ─── Keyboard volume control ───
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videoRef, toggleMute]);

  const progress = duration > 0 ? (playhead / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {/* Gradient fade for controls */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Controls row */}
      <div className="relative px-3 pb-2 pt-8 flex flex-col gap-1.5">
        {/* Seek bar */}
        <div
          ref={seekRef}
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/seek hover:h-2 transition-all"
          onMouseDown={handleSeekMouseDown}
        >
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 bg-white/20 rounded-full pointer-events-none"
            style={{ width: `${bufferedPct}%` }}
          />
          {/* Progress */}
          <div
            className="absolute inset-y-0 left-0 bg-neon-cyan rounded-full pointer-events-none transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 bg-neon-cyan rounded-full shadow-lg shadow-neon-cyan/50 opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle Mute (M)"
            >
              {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Time */}
            <span className="text-[11px] text-white/60 font-mono tabular-nums ml-1">
              {formatTime(playhead)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right side */}
          <button
            onClick={onToggleFullscreen}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
