"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { PlayerControls } from "./player-controls";
import { PlayerWaveform } from "./player-waveform";
import { cssFilterFromEffects, cssTransformFromClip } from "@/lib/effects/index";
import { TextCanvas } from "@/components/editor/text/text-canvas";
import { OverlayRenderer } from "@/components/editor/player/overlay-renderer";
import { getKeyframeTransforms } from "@/components/editor/ai/keyframe-animation-panel";

/**
 * Preview Player
 *
 * Synced bidirectionally with the timeline playhead:
 * - Playing video → updates playhead in store via RAF loop
 * - Clicking timeline → sets video.currentTime
 * - Play/pause in store → triggers video.play/pause
 *
 * Handles the case where no clip is selected (shows empty state).
 */
export function Player() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlaying = useEditorStore((s) => s.isPlaying);
  const playhead = useEditorStore((s) => s.playhead);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const previewMuted = useEditorStore((s) => s.previewMuted);
  const clips = useEditorStore((s) => s.clips);
  const project = useEditorStore((s) => s.project);

  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const videoSrc = selectedClip?.src || null;

  const clipFilterStyle = useMemo(() => {
    if (!selectedClip) return {};
    const filter = cssFilterFromEffects(selectedClip.effects);
    const baseTransform = cssTransformFromClip(selectedClip);
    const kfTransforms = getKeyframeTransforms(
      selectedClip.animationKeyframes,
      selectedClip.duration,
      Math.max(0, playhead - selectedClip.startTime),
    );

    const mergedClip = { ...selectedClip, ...kfTransforms };
    const kfTransform = cssTransformFromClip(mergedClip);
    const transform = kfTransform || baseTransform;

    return {
      filter: filter || undefined,
      transform: transform || undefined,
      opacity: kfTransforms.opacity !== undefined ? kfTransforms.opacity : undefined,
    };
  }, [selectedClip, playhead]);

  // ─── Sync: store → video (external playhead/timeline seek) ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    // Only seek if difference is meaningful (avoids feedback loop with RAF)
    if (Math.abs(video.currentTime - playhead) > 0.05) {
      video.currentTime = playhead;
    }
  }, [playhead, videoSrc]);

  // ─── Sync: store.isPlaying → video.play/pause ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoSrc]);

  // ─── Sync: video → store (RAF loop updating playhead) ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const v = videoRef.current;
      if (!v || v.paused) return;
      useEditorStore.getState().setPlayhead(v.currentTime);

      // Check if video ended
      if (v.ended) {
        useEditorStore.getState().setIsPlaying(false);
        return;
      }

      // Update buffered
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, videoSrc]);

  // ─── Reset state when source changes ───
  useEffect(() => {
    setDuration(0);
    setBuffered(0);
    if (!isPlaying) setPlayhead(0);
  }, [videoSrc]);

  // ─── Fullscreen toggle ───
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ─── No clip selected ───
  if (!videoSrc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-secondary rounded-2xl relative min-h-[200px]">
        <div className="text-center">
          <div className="size-20 mx-auto mb-3 glass rounded-2xl flex items-center justify-center">
            <svg className="size-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm">Preview</p>
          <p className="text-text-tertiary text-xs mt-1">Select a clip or drag media to the timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-player-container
      className="flex-1 flex flex-col bg-surface-secondary rounded-2xl relative overflow-hidden min-h-[200px] group"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        preload="auto"
        muted={previewMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
        style={clipFilterStyle}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
      />

      {/* Canvas overlay (for overlays, emoji, images, PiP, background removal) */}
      <OverlayRenderer playhead={playhead} />

      {/* Time display top-left */}
      <div className="absolute top-3 left-3 glass rounded-lg px-2.5 py-1 z-10">
        <span className="text-[11px] font-mono text-text-primary tabular-nums">
          {formatTime(playhead)} / {formatTime(duration)}
        </span>
      </div>

      {/* Resolution badge */}
      <div className="absolute top-3 right-3 glass rounded-lg px-2 py-1 z-10 hidden sm:block">
        <span className="text-[10px] text-text-tertiary">{project.width}×{project.height}</span>
      </div>

      {/* Click to toggle play */}
      <button
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
        onClick={() => {
          const store = useEditorStore.getState();
          if (store.isPlaying) store.setIsPlaying(false);
          else store.setIsPlaying(true);
        }}
      >
        {!isPlaying && (
          <div className="size-16 glass rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="size-8 text-text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </button>

      {/* Controls overlay at bottom */}
      <PlayerControls
        videoRef={videoRef}
        duration={duration}
        buffered={buffered}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Text overlays (subtitles, titles, text clips) */}
      <TextCanvas />

      {/* Audio processor + waveform — always active for track-level audio effects */}
      {videoSrc && <PlayerWaveform isPlaying={isPlaying} />}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
