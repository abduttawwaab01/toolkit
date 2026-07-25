"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Trash2, ArrowRightFromLine, ArrowLeftFromLine, VolumeX } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";

interface ContextMenuProps {
  clipId: string | null;
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
}

export function TimelineContextMenu({ clipId, x, y, open, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(
    (action: string) => {
      if (!clipId) return;
      const store = useEditorStore.getState();
      const clip = store.clips.find((c) => c.id === clipId);
      if (!clip) return;

      switch (action) {
        case "split": {
          if (store.playhead > clip.startTime && store.playhead < clip.startTime + clip.duration) {
            store.splitClip(clipId, store.playhead);
          }
          break;
        }
        case "delete":
          store.removeClip(clipId);
          break;
        case "ripple-delete":
          store.rippleDeleteClip(clipId);
          break;
        case "set-in-point": {
          const newTrimStart = Math.max(0, store.playhead - clip.startTime);
          store.updateClip(clipId, {
            trimStart: newTrimStart + clip.trimStart,
            duration: clip.duration - newTrimStart,
            startTime: store.playhead,
          });
          break;
        }
        case "set-out-point": {
          const newTrimEnd = Math.max(0, clip.startTime + clip.duration - store.playhead);
          store.updateClip(clipId, {
            trimEnd: newTrimEnd + clip.trimEnd,
            duration: Math.max(0.1, store.playhead - clip.startTime),
          });
          break;
        }
        case "smart-cut": {
          const src = clip.src;
          if (src) {
            (async () => {
              try {
                const { detectSilence, computeSilenceRemoval, renderSilenceRemovedAudio, audioBufferToWav, decodeAudioFile } = await import("@/lib/audio-engine/index");
                const resp = await fetch(src);
                const blob = await resp.blob();
                const file = new File([blob], "audio", { type: blob.type });
                const audioBuffer = await decodeAudioFile(file);
                const segments = await detectSilence(audioBuffer, 0.02, 0.5);
                const result = computeSilenceRemoval(audioBuffer, segments, 0.1);
                if (result.keptRegions.length > 0) {
                  const newBuffer = await renderSilenceRemovedAudio(audioBuffer, result.keptRegions);
                  const wavBlob = audioBufferToWav(newBuffer);
                  const url = URL.createObjectURL(wavBlob);
                  store.updateClip(clipId, { src: url, duration: newBuffer.duration });
                }
              } catch {}
            })();
          }
          break;
        }
      }
      onClose();
    },
    [clipId, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const menuX = typeof window !== "undefined" ? Math.min(x, window.innerWidth - 200) : x;
  const menuY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - 240) : y;

  return (
    <AnimatePresence>
      {open && clipId && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12 }}
          className="fixed z-50 min-w-[180px] glass rounded-xl border border-border-subtle shadow-2xl py-1 overflow-hidden"
          style={{ left: menuX, top: menuY }}
        >
          <MenuItem icon={<Scissors size={13} />} label="Split at Playhead" shortcut="S" onClick={() => handleAction("split")} />
          <div className="h-px bg-border-subtle mx-2 my-1" />
          <MenuItem icon={<ArrowLeftFromLine size={13} />} label="Set In Point" shortcut="I" onClick={() => handleAction("set-in-point")} />
          <MenuItem icon={<ArrowRightFromLine size={13} />} label="Set Out Point" shortcut="O" onClick={() => handleAction("set-out-point")} />
          <div className="h-px bg-border-subtle mx-2 my-1" />
          <MenuItem icon={<Trash2 size={13} />} label="Delete" shortcut="Del" onClick={() => handleAction("delete")} />
          <MenuItem icon={<Trash2 size={13} />} label="Ripple Delete" shortcut="Shift+Del" onClick={() => handleAction("ripple-delete")} />
          <div className="h-px bg-border-subtle mx-2 my-1" />
          <MenuItem icon={<VolumeX size={13} />} label="Smart Cut (Remove Silence)" shortcut="" onClick={() => handleAction("smart-cut")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors"
      onClick={onClick}
    >
      <span className="text-text-tertiary shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className="text-[10px] text-text-tertiary font-mono">{shortcut}</span>
    </button>
  );
}
