"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { Sliders, Image, Upload, Layers, Trash2 } from "lucide-react";

export function OverlayPanel() {
  const toast = useToast();
  const [tab, setTab] = useState<"manage" | "upload">("manage");
  const fileRef = useRef<HTMLInputElement>(null);

  const { tracks, clips, selectedClipId, selectClip } = useEditorStore();
  const overlayClips = clips.filter((c) => c.type === "overlay");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const store = useEditorStore.getState();
    let track = store.tracks.find((t) => t.type === "overlay");
    if (!track) {
      store.addTrack("overlay");
      const updatedTracks = useEditorStore.getState().tracks;
      track = updatedTracks[updatedTracks.length - 1];
      if (track) store.updateTrack(track.id, { name: "Overlays", color: "#a29bfe" });
    }

    if (!track) { toast.error("Error", "Could not create overlay track"); return; }

    const url = URL.createObjectURL(f);
    store.addClip({
      trackId: track.id,
      type: "overlay",
      name: f.name,
      src: url,
      thumbnail: url,
      startTime: store.playhead,
      duration: 5,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Overlay added", `"${f.name}" added as overlay`);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button onClick={() => setTab("manage")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${tab === "manage" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Layers size={10} /> Overlays
        </button>
        <button onClick={() => setTab("upload")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${tab === "upload" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Upload size={10} /> Upload
        </button>
      </div>

      {tab === "upload" && (
        <div onClick={() => fileRef.current?.click()}
          className="glass rounded-xl p-4 border-2 border-dashed border-border-subtle hover:border-neon-cyan/30 cursor-pointer text-center transition-all group">
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
          <Image size={20} className="mx-auto text-neon-cyan mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-[11px] text-text-primary font-medium">Upload Image Overlay</p>
          <p className="text-[9px] text-text-tertiary">PNG, JPG, GIF, WebP, or video</p>
        </div>
      )}

      {tab === "manage" && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {overlayClips.length === 0 ? (
            <div className="glass rounded-xl p-4 text-center">
              <Layers size={16} className="mx-auto text-text-tertiary mb-1" />
              <p className="text-[10px] text-text-tertiary">No overlays yet</p>
              <p className="text-[8px] text-text-tertiary">Upload images or add emojis to create overlays</p>
            </div>
          ) : (
            overlayClips.map((clip) => (
              <div key={clip.id}
                onClick={() => selectClip(clip.id)}
                className={`glass rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-all ${
                  selectedClipId === clip.id ? "ring-1 ring-neon-cyan" : "hover:bg-glass-medium"
                }`}>
                {clip.src ? (
                  <img src={clip.src} alt="" className="size-8 rounded object-cover" />
                ) : (
                  <div className="size-8 rounded glass flex items-center justify-center">
                    <Image size={12} className="text-text-tertiary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-primary font-medium truncate">{clip.name}</p>
                  <p className="text-[8px] text-text-tertiary">
                    {clip.startTime.toFixed(1)}s &middot; {clip.positionX.toFixed(0)},{clip.positionY.toFixed(0)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => useEditorStore.getState().removeClip(clip.id)}
                    className="size-5 rounded glass flex items-center justify-center text-text-tertiary hover:text-neon-pink transition-all">
                    <Trash2 size={8} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
