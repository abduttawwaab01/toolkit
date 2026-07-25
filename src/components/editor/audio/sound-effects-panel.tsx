"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { SOUND_EFFECT_PRESETS, SOUND_EFFECT_CATEGORIES, generateSoundEffect } from "@/lib/sound-effects/index";
import { Play, Square, Plus } from "lucide-react";

export function SoundEffectsPanel() {
  const toast = useToast();
  const [category, setCategory] = useState("transitions");
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedUrlsRef = useRef<Record<string, string>>({});
  const filtered = SOUND_EFFECT_PRESETS.filter((s) => s.category === category);

  const getOrGenerateUrl = async (id: string): Promise<string | null> => {
    if (generatedUrlsRef.current[id]) return generatedUrlsRef.current[id];
    const preset = SOUND_EFFECT_PRESETS.find((s) => s.id === id);
    if (!preset) return null;
    try {
      const blob = await generateSoundEffect(preset);
      const url = URL.createObjectURL(blob);
      generatedUrlsRef.current[id] = url;
      return url;
    } catch {
      return null;
    }
  };

  const handlePlay = async (id: string) => {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    setPlaying(id);
    setLoadingId(id);
    const url = await getOrGenerateUrl(id);
    setLoadingId(null);

    if (!url) {
      toast.error("Error", "Could not generate sound effect");
      setPlaying(null);
      return;
    }

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(null);
    audio.play().catch(() => setPlaying(null));
  };

  const handleAddToTimeline = async (id: string) => {
    const store = useEditorStore.getState();
    const audioTrack = store.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      toast.error("No audio track", "Add an audio track first");
      return;
    }

    const preset = SOUND_EFFECT_PRESETS.find((s) => s.id === id);
    if (!preset) return;

    setLoadingId(id);
    const url = await getOrGenerateUrl(id);
    setLoadingId(null);

    if (!url) {
      toast.error("Error", "Could not generate sound effect");
      return;
    }

    store.addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: preset.name,
      src: url,
      thumbnail: null,
      startTime: store.playhead,
      duration: preset.duration,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Sound effect added", `"${preset.name}" added to timeline`);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {SOUND_EFFECT_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-medium capitalize transition-all ${
              category === cat ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary hover:text-text-primary border border-border-subtle"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filtered.map((sfx) => (
          <div key={sfx.id}
            className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2 hover:bg-glass-medium transition-all">
            <span className="text-sm">{sfx.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-primary font-medium truncate">{sfx.name}</p>
              <p className="text-[8px] text-text-tertiary truncate">{sfx.description}</p>
            </div>
            <span className="text-[8px] text-text-tertiary font-mono w-8 text-right">{sfx.duration.toFixed(1)}s</span>
            <button onClick={() => handlePlay(sfx.id)}
              className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              {loadingId === sfx.id ? (
                <span className="size-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : playing === sfx.id ? (
                <Square size={10} />
              ) : (
                <Play size={10} />
              )}
            </button>
            <button onClick={() => handleAddToTimeline(sfx.id)}
              className="size-6 rounded-lg glass flex items-center justify-center text-neon-cyan hover:bg-neon-cyan/20 transition-all">
              <Plus size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
