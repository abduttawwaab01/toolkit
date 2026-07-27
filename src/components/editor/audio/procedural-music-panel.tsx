"use client";

import { useState } from "react";
import { Music, Play, Square, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";
import { MUSIC_GENRES, generateBackgroundMusic } from "@/lib/procedural-audio";

export function ProceduralMusicPanel() {
  const [selectedGenre, setSelectedGenre] = useState("lo-fi");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(30);

  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateBackgroundMusic(selectedGenre, duration);
      setPreviewUrl(result.url);
    } catch {
      // Generation failed
    }
    setGenerating(false);
  };

  const togglePreview = () => {
    if (!previewUrl) return;
    if (isPlaying) {
      const audio = document.querySelector<HTMLAudioElement>("#music-preview");
      audio?.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(previewUrl);
      audio.id = "music-preview";
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const addToTimeline = () => {
    if (!previewUrl) return;
    const audioTrack = tracks.find((t) => t.type === "audio");
    if (!audioTrack) return;
    pushHistory();
    addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: `${MUSIC_GENRES.find((g) => g.id === selectedGenre)?.name || "Music"} Background`,
      src: previewUrl,
      thumbnail: null,
      volumeKeyframes: [],
      startTime: playhead,
      duration: duration,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      volume: 0.5,
      effects: [],
      opacity: 1,
      scale: 1,
      rotation: 0,
      positionX: 0,
      positionY: 0,
    });
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Music size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-medium text-text-primary">Background Music</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {MUSIC_GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => { setSelectedGenre(genre.id); setPreviewUrl(null); }}
            className={`px-2 py-1 rounded-lg text-[9px] transition-all ${
              selectedGenre === genre.id
                ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                : "glass text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[9px] text-text-tertiary">Duration:</span>
        {[15, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`px-2 py-0.5 rounded text-[9px] transition-all ${
              duration === d
                ? "bg-neon-cyan/20 text-neon-cyan"
                : "glass text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {d}s
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-text-secondary text-[10px] hover:text-text-primary transition-all disabled:opacity-40"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Generate
        </button>

        {previewUrl && (
          <>
            <button onClick={togglePreview} className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-text-secondary text-[10px] hover:text-text-primary transition-all">
              {isPlaying ? <Square size={12} /> : <Play size={12} />}
              {isPlaying ? "Stop" : "Preview"}
            </button>
            <button onClick={addToTimeline} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[10px] hover:bg-neon-cyan/30 transition-all">
              <Plus size={12} /> Add
            </button>
          </>
        )}
      </div>

      <p className="text-[8px] text-text-tertiary">Music is generated procedurally in-browser using Web Audio API. No external API calls.</p>
    </div>
  );
}
