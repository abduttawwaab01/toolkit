"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";

const KEY_HANDLERS: Record<string, (store: ReturnType<typeof useEditorStore.getState>) => void> = {
  " ": (s) => s.togglePlay(),
  Home: (s) => s.setPlayhead(0),
  End: (s) => s.setPlayhead(s.project.duration),
  ArrowLeft: (s) => s.setPlayhead(s.playhead - 1 / s.project.fps),
  ArrowRight: (s) => s.setPlayhead(s.playhead + 1 / s.project.fps),
  Backspace: (s) => { if (s.selectedClipId) s.removeClip(s.selectedClipId); },
  Delete: (s) => { if (s.selectedClipId) s.removeClip(s.selectedClipId); },
  s: (s) => {
    if (s.selectedClipId) {
      const clip = s.clips.find((c) => c.id === s.selectedClipId);
      if (clip && s.playhead > clip.startTime && s.playhead < clip.startTime + clip.duration) {
        s.splitClip(s.selectedClipId, s.playhead);
      }
    }
  },
  n: (s) => s.toggleSnap(),
  i: (s) => {
    if (s.selectedClipId) {
      const clip = s.clips.find((c) => c.id === s.selectedClipId);
      if (clip && s.playhead > clip.startTime && s.playhead < clip.startTime + clip.duration) {
        const newTrimStart = Math.max(0, s.playhead - clip.startTime);
        s.updateClip(s.selectedClipId, {
          trimStart: newTrimStart + clip.trimStart,
          duration: clip.duration - newTrimStart,
          startTime: s.playhead,
        });
      }
    }
  },
  o: (s) => {
    if (s.selectedClipId) {
      const clip = s.clips.find((c) => c.id === s.selectedClipId);
      if (clip && s.playhead > clip.startTime && s.playhead < clip.startTime + clip.duration) {
        const newDuration = Math.max(0.1, s.playhead - clip.startTime);
        const newTrimEnd = Math.max(0, clip.duration - newDuration + clip.trimEnd);
        s.updateClip(s.selectedClipId, {
          duration: newDuration,
          trimEnd: newTrimEnd,
        });
      }
    }
  },
};

export function useTimelineKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) {
        if (key === "z" && e.shiftKey) { e.preventDefault(); useEditorStore.getState().redo(); return; }
        if (key === "z") { e.preventDefault(); useEditorStore.getState().undo(); return; }
        if (key === "=" || key === "+") { e.preventDefault(); useEditorStore.getState().zoomIn(); return; }
        if (key === "-") { e.preventDefault(); useEditorStore.getState().zoomOut(); return; }
        return;
      }

      if (e.shiftKey && (e.key === "Delete" || e.key === "Backspace")) {
        if (useEditorStore.getState().selectedClipId) {
          e.preventDefault();
          useEditorStore.getState().rippleDeleteClip(useEditorStore.getState().selectedClipId!);
          return;
        }
      }

      const handler = KEY_HANDLERS[e.key];
      if (handler) {
        e.preventDefault();
        handler(useEditorStore.getState());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
