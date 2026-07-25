"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";

type SaveStatus = "saved" | "saving" | "unsaved" | "offline";

export function useAutoSave(interval = 30000) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const lastSaveRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getStateHash = useCallback(() => {
    const state = useEditorStore.getState();
    return JSON.stringify({
      clips: state.clips,
      tracks: state.tracks,
      transitions: state.transitions,
      masterVolume: state.masterVolume,
    });
  }, []);

  const save = useCallback(async () => {
    setStatus("saving");

    try {
      const state = useEditorStore.getState();
      const data = {
        clips: state.clips,
        tracks: state.tracks,
        transitions: state.transitions,
        masterVolume: state.masterVolume,
        playhead: state.playhead,
        zoom: state.zoom,
      };

      // Save to localStorage
      localStorage.setItem("toolkit_project", JSON.stringify(data));
      localStorage.setItem("toolkit_project_saved_at", Date.now().toString());

      lastSaveRef.current = getStateHash();
      setStatus("saved");

      // Also attempt server save if available
      try {
        await fetch("/api/projects/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: state.project.id,
            name: state.project.name,
            data,
          }),
        }).catch(() => { /* offline is fine */ });
      } catch {
        // Silently fail - will save to localStorage
      }
    } catch {
      setStatus("offline");
    }
  }, [getStateHash]);

  // Auto-save on interval
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const currentHash = getStateHash();
      if (currentHash !== lastSaveRef.current) {
        save();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, interval, getStateHash]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentHash = getStateHash();
      if (currentHash !== lastSaveRef.current) {
        const state = useEditorStore.getState();
        localStorage.setItem("toolkit_project", JSON.stringify({
          clips: state.clips,
          tracks: state.tracks,
          transitions: state.transitions,
          masterVolume: state.masterVolume,
          playhead: state.playhead,
          zoom: state.zoom,
        }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [getStateHash]);

  return { status, save, setStatus };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "saving" || status === "unsaved") {
      setVisible(true);
    } else if (status === "saved") {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    } else {
      setVisible(true);
    }
  }, [status]);

  if (!visible) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
      status === "saved" ? "text-neon-cyan bg-neon-cyan/10" :
      status === "saving" ? "text-blue-400 bg-blue-400/10" :
      status === "offline" ? "text-yellow-500 bg-yellow-500/10" :
      "text-text-tertiary bg-glass-medium"
    }`}>
      {status === "saved" && <Check size={10} />}
      {status === "saving" && <Loader2 size={10} className="animate-spin" />}
      {status === "offline" && <CloudOff size={10} />}
      {status === "unsaved" && <Cloud size={10} />}
      {status === "saved" ? "Saved" :
       status === "saving" ? "Saving..." :
       status === "offline" ? "Offline" : "Unsaved"}
    </div>
  );
}
