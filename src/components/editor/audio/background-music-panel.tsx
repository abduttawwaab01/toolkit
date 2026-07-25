"use client";

import { useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { Upload, Music } from "lucide-react";

export function BackgroundMusicPanel() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleBgMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const store = useEditorStore.getState();
    let track = store.tracks.find((t) => t.type === "audio" && t.name === "Background Music");

    if (!track) {
      store.addTrack("audio");
      const tracks = useEditorStore.getState().tracks;
      track = tracks[tracks.length - 1];
      if (track) store.updateTrack(track.id, { name: "Background Music", color: "#e17055" });
    }

    if (!track) { toast.error("Error", "Could not create audio track"); return; }

    const url = URL.createObjectURL(f);
    store.addClip({
      trackId: track.id,
      type: "audio",
      name: f.name,
      src: url,
      thumbnail: null,
      startTime: 0,
      duration: 30,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 0.5,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Background music added", `"${f.name}" added to music track`);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div onClick={() => fileRef.current?.click()}
        className="glass rounded-xl p-4 border-2 border-dashed border-border-subtle hover:border-neon-cyan/30 cursor-pointer text-center transition-all group">
        <input ref={fileRef} type="file" accept="audio/*" onChange={handleBgMusicUpload} className="hidden" />
        <Music size={20} className="mx-auto text-neon-cyan mb-2 group-hover:scale-110 transition-transform" />
        <p className="text-[11px] text-text-primary font-medium mb-0.5">Upload Background Music</p>
        <p className="text-[9px] text-text-tertiary">MP3, WAV, AAC, OGG, FLAC</p>
        <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-neon-cyan">
          <Upload size={10} /> Click to select file
        </div>
      </div>

      <div className="glass rounded-xl p-3 text-center">
        <p className="text-[9px] text-text-tertiary">Background music is added to a dedicated audio track. Use the Mixer tab to adjust volume and effects.</p>
      </div>
    </div>
  );
}
