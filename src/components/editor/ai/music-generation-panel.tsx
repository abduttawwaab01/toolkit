"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { generateMusic, MUSIC_GEN_PRESETS } from "@/lib/ai/music-generation";
import { Music, Play, Plus, Wand2 } from "lucide-react";

export function MusicGenerationPanel() {
  const toast = useToast();
  const { addClip, tracks } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [duration, setDuration] = useState(8);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultAudio, setResultAudio] = useState<string | null>(null);

  const handlePresetClick = useCallback((presetId: string) => {
    const preset = MUSIC_GEN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setPrompt(preset.prompt);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { toast.error("Prompt required", "Enter a description of the music you want"); return; }

    setProcessing(true);
    setProgress(0);
    setResultAudio(null);
    try {
      const result = await generateMusic({
        prompt: prompt.trim(),
        duration,
        onProgress: setProgress,
      });
      setResultAudio(result.audio);
      toast.success("Music generated", `${duration}s of music created`);
    } catch (error: any) {
      toast.error("Generation failed", error.message || "Could not generate music");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [prompt, duration, toast]);

  const handleAddToTimeline = useCallback(() => {
    if (!resultAudio) return;
    const store = useEditorStore.getState();
    const audioTrack = store.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      toast.error("No audio track", "Add an audio track first");
      return;
    }
    store.addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: `Music - ${prompt.slice(0, 25)}...`,
      src: resultAudio,
      thumbnail: null,
      startTime: store.playhead,
      duration,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1,
      scale: 1,
      rotation: 0,
      positionX: 0,
      positionY: 0,
    });
    toast.success("Added", "Generated music added to timeline");
  }, [resultAudio, prompt, duration, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Music size={12} className="text-neon-orange" />
        <span className="text-[10px] font-medium text-text-primary">AI Music Generator</span>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        Generate original music from text descriptions using Meta's MusicGen AI.
      </p>

      {/* Style Presets */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Style Presets</label>
        <div className="flex flex-wrap gap-1">
          {MUSIC_GEN_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => handlePresetClick(preset.id)}
              className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                selectedPreset === preset.id
                  ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/30"
                  : "glass text-text-tertiary border border-border-subtle hover:text-text-primary"
              }`}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Description</label>
        <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setSelectedPreset(null); }}
          placeholder="Describe the music you want to generate..."
          rows={3}
          className="w-full glass rounded-lg px-2.5 py-2 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50 resize-none" />
      </div>

      {/* Duration */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Duration: {duration}s</label>
        <input type="range" min={1} max={30} value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full accent-neon-orange h-1 mt-1" />
        <div className="flex justify-between text-[8px] text-text-tertiary mt-0.5">
          <span>1s</span><span>30s</span>
        </div>
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={processing || !prompt.trim()}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50">
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-orange border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-orange">Generating... {progress}%</span>
          </>
        ) : (
          <>
            <Wand2 size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary font-medium">Generate Music</span>
          </>
        )}
      </button>

      {processing && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div className="h-full bg-neon-orange transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Result */}
      {resultAudio && (
        <div className="space-y-2">
          <audio src={resultAudio} controls className="w-full h-8" />
          <button onClick={handleAddToTimeline}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-orange/20 text-neon-orange text-[10px] font-semibold hover:bg-neon-orange/30 transition-all active:scale-[0.98]">
            <Plus size={11} /> Add to Timeline
          </button>
        </div>
      )}
    </div>
  );
}
