"use client";

import { useEditorStore } from "@/lib/editor-store";
import { getTransitionDefinition } from "@/lib/effects/transitions";
import { clipLeft, clipWidth } from "@/lib/timeline-utils";
import type { Transition } from "@/types/editor";

interface TransitionBarProps {
  transition: Transition;
}

export function TransitionBar({ transition }: TransitionBarProps) {
  const { clips, zoom, scrollLeft } = useEditorStore();
  const clipIn = clips.find((c) => c.id === transition.clipInId);
  const clipOut = clips.find((c) => c.id === transition.clipOutId);
  const def = getTransitionDefinition(transition.type);

  if (!clipIn || !clipOut) return null;

  const inEnd = clipIn.startTime + clipIn.duration;
  const outStart = clipOut.startTime;
  const overlapStart = Math.max(clipIn.startTime, outStart);
  const overlapEnd = Math.min(inEnd, outStart + transition.duration);
  const centerTime = (overlapStart + overlapEnd) / 2;

  const left = clipLeft({ startTime: centerTime - transition.duration / 2 }, zoom, scrollLeft);
  const widthVal = clipWidth({ duration: transition.duration, speed: 1 }, zoom);

  // Color by type
  const typeColors: Record<string, string> = {
    crossfade: "from-cyan-400/30 to-blue-500/30 border-cyan-400/40",
    "fade-to-black": "from-gray-800/40 to-gray-900/40 border-gray-400/30",
    "fade-to-white": "from-white/20 to-gray-200/20 border-white/30",
    "slide-left": "from-purple-400/30 to-pink-500/30 border-purple-400/40",
    "slide-right": "from-purple-400/30 to-pink-500/30 border-purple-400/40",
    "wipe-left": "from-amber-400/30 to-orange-500/30 border-amber-400/40",
    "wipe-right": "from-amber-400/30 to-orange-500/30 border-amber-400/40",
    "zoom-in": "from-emerald-400/30 to-green-500/30 border-emerald-400/40",
    "zoom-out": "from-emerald-400/30 to-green-500/30 border-emerald-400/40",
  };

  const gradient = typeColors[transition.type] || "from-cyan-400/30 to-blue-500/30 border-cyan-400/40";

  return (
    <div
      className={`absolute top-0 bottom-0 rounded-md border bg-gradient-to-r ${gradient} z-20 flex items-center justify-center pointer-events-none`}
      style={{ left, width: Math.max(widthVal, 12), minWidth: 12 }}
      title={`${def?.name ?? transition.type} · ${transition.duration.toFixed(1)}s`}
    >
      <span className="text-[9px] font-bold text-white/60 drop-shadow-sm">
        {def?.icon ?? "⟷"}
      </span>
    </div>
  );
}
