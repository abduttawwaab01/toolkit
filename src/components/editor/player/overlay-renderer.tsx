"use client";

import { memo, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { cssTransformFromClip } from "@/lib/effects/index";

interface OverlayRendererProps {
  playhead: number;
}

export const OverlayRenderer = memo(function OverlayRenderer({ playhead }: OverlayRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number>(0);
  const playheadRef = useRef(playhead);
  playheadRef.current = playhead;

  // Individual primitive selectors — stable references, no unnecessary re-renders
  const clips = useEditorStore((s) => s.clips);
  const width = useEditorStore((s) => s.project.width);
  const height = useEditorStore((s) => s.project.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ph = playheadRef.current;

      const activeClips = clips.filter(
        (c) => c.type === "overlay" && ph >= c.startTime && ph < c.startTime + c.duration,
      );
      const usedIds = new Set<string>();

      for (const clip of activeClips) {
        usedIds.add(clip.id);
        const relTime = ph - clip.startTime;

        let opacity = clip.opacity;
        if (clip.fadeIn && relTime < clip.fadeIn) opacity *= relTime / clip.fadeIn;
        if (clip.fadeOut && clip.duration - relTime < clip.fadeOut) opacity *= (clip.duration - relTime) / clip.fadeOut;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(clip.positionX + canvas.width / 2, clip.positionY + canvas.height / 2);
        ctx.scale(clip.scale, clip.scale);
        ctx.rotate((clip.rotation * Math.PI) / 180);

        const size = Math.min(canvas.width, canvas.height) * 0.15;

        if (clip.name.startsWith("Emoji:")) {
          const emoji = clip.name.replace("Emoji: ", "");
          ctx.font = `${size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(emoji, 0, 0);
        } else if (clip.src) {
          let img = imagesRef.current.get(clip.id);
          if (!img) {
            img = new Image();
            img.crossOrigin = "anonymous";
            img.src = clip.src;
            imagesRef.current.set(clip.id, img);
          }
          if (img.complete && img.naturalWidth > 0) {
            const aspect = img.naturalWidth / img.naturalHeight;
            const drawW = size * 2;
            const drawH = drawW / aspect;
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        }

        ctx.restore();
      }

      // Cleanup stale images
      for (const [id] of imagesRef.current) {
        if (!usedIds.has(id)) {
          imagesRef.current.delete(id);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, clips]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
});
