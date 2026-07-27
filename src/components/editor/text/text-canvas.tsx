"use client";

import { memo, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { getTextStyleCss, getAnimationCss } from "@/lib/text/index";

export const TextCanvas = memo(function TextCanvas() {
  const clips = useEditorStore((s) => s.clips);
  const playhead = useEditorStore((s) => s.playhead);

  // Find all text clips that should be visible based on playhead
  const visibleTexts = useMemo(() => {
    return clips.filter((clip) => {
      if (clip.type !== "text" || !clip.textContent) return false;
      return playhead >= clip.startTime && playhead <= clip.startTime + clip.duration;
    });
  }, [clips, playhead]);

  if (visibleTexts.length === 0) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden">
      {visibleTexts.map((clip) => {
        const styleCss = getTextStyleCss(clip.textStyle!);
        const animCss = clip.textAnimation
          ? getAnimationCss(clip.textAnimation, clip.duration)
          : {};

        const relTime = playhead - clip.startTime;
        const progress = clip.duration > 0 ? relTime / clip.duration : 0;

        // Animate subtitles
        const currentSub = clip.subtitles?.find(
          (s) => relTime >= s.start && relTime <= s.end,
        );

        // Typewriter effect
        const text = clip.textContent || "";
        const animType = clip.textAnimation?.type;
        const stagger = clip.textAnimation?.stagger || 0;
        const charCount = Math.min(
          text.length,
          animType === "typewriter"
            ? Math.floor(relTime / (stagger || 0.03))
            : text.length,
        );

        return (
          <div
            key={clip.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: clip.opacity,
              transform: `translate(${clip.positionX}px, ${clip.positionY}px) scale(${clip.scale}) rotate(${clip.rotation}deg)`,
              ...animCss,
            }}
          >
            {/* Subtitles rendering */}
            {currentSub ? (
              <div style={styleCss}>
                {currentSub.text}
              </div>
            ) : (
              /* Regular text rendering */
              <div style={styleCss}>
                {animType === "typewriter"
                  ? text.slice(0, Math.max(0, charCount))
                  : text}
              </div>
            )}

            {/* Fade in/out overlays */}
            {clip.fadeIn && relTime < clip.fadeIn && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{
                  opacity: 1 - relTime / clip.fadeIn,
                }}
              />
            )}
            {clip.fadeOut && clip.duration - relTime < clip.fadeOut && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{
                  opacity: 1 - (clip.duration - relTime) / clip.fadeOut,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
