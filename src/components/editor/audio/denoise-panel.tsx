"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { denoiseAudioAI, denoiseAudioDSP } from "@/lib/ai/denoise";
import { Volume2, VolumeX, Play, Square, Plus, Upload, Sparkles, Gauge } from "lucide-react";

export function DenoisePanel() {
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ original: string; processed: string } | null>(null);
  const [playing, setPlaying] = useState<"original" | "processed" | null>(null);
  const [mode, setMode] = useState<"ai" | "dsp">("ai");
  const [dspStrength, setDspStrength] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Invalid file", "Please select an audio file");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const originalUrl = URL.createObjectURL(file);

      if (mode === "ai") {
        const aiResult = await denoiseAudioAI(file, {
          denoiseOnly: false,
          onProgress: setProgress,
        });
        setResult({ original: originalUrl, processed: aiResult.audio });
        toast.success("AI Denoise complete", "Background noise removed and audio enhanced");
      } else {
        setProgress(50);
        const dspBlob = await denoiseAudioDSP(file, { strength: dspStrength });
        const processedUrl = URL.createObjectURL(dspBlob);
        setResult({ original: originalUrl, processed: processedUrl });
        setProgress(100);
        toast.success("DSP Denoise complete", "Quick noise reduction applied");
      }
    } catch (error: any) {
      toast.error("Denoising failed", error.message || "Could not denoise audio");
    } finally {
      setProcessing(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [mode, dspStrength, toast]);

  const handlePlay = useCallback((which: "original" | "processed") => {
    if (playing === which) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    if (!result) return;

    audioRef.current?.pause();
    const url = which === "original" ? result.original : result.processed;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(null);
    setPlaying(which);
    audio.play().catch(() => setPlaying(null));
  }, [result, playing]);

  const handleAddToTimeline = useCallback(() => {
    if (!result?.processed) return;

    const store = useEditorStore.getState();
    const audioTrack = store.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      toast.error("No audio track", "Add an audio track first");
      return;
    }

    store.addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: `Denoised (${mode === "ai" ? "AI" : "DSP"})`,
      src: result.processed,
      thumbnail: null,
      startTime: store.playhead,
      duration: 10,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Added to timeline", "Denoised audio clip added");
  }, [result, mode, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Volume2 size={12} className="text-neon-cyan" />
          <span className="text-[10px] font-medium text-text-primary">AI Noise Removal</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("ai")}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all ${
              mode === "ai" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}
          >
            <Sparkles size={8} className="inline mr-0.5" />AI
          </button>
          <button
            onClick={() => setMode("dsp")}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all ${
              mode === "dsp" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}
          >
            <Gauge size={8} className="inline mr-0.5" />Quick
          </button>
        </div>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        {mode === "ai"
          ? "AI-powered noise removal using DeepFilterNet3. Removes background noise, hiss, hum, traffic, and wind while preserving speech clarity. Best quality."
          : "Instant browser-based noise reduction using EQ and compression. Fast but less precise than AI."}
      </p>

      {mode === "dsp" && (
        <div>
          <div className="flex justify-between text-[8px] mb-0.5">
            <span className="text-text-tertiary">Strength</span>
            <span className="text-text-primary font-mono">{Math.round(dspStrength * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={dspStrength}
            onChange={(e) => setDspStrength(Number(e.target.value))}
            className="w-full h-1 accent-neon-cyan cursor-pointer"
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={processing}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50"
      >
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-cyan">
              {mode === "ai" ? `Enhancing... ${progress}%` : "Processing..."}
            </span>
          </>
        ) : (
          <>
            <Upload size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary">Select Audio File</span>
          </>
        )}
      </button>

      {processing && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <p className="text-[9px] text-text-tertiary uppercase tracking-wider">A/B Comparison</p>

          {/* Original */}
          <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <div className="size-2 rounded-full shrink-0 bg-text-tertiary" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-primary font-medium">Original</p>
            </div>
            <button
              onClick={() => handlePlay("original")}
              className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
            >
              {playing === "original" ? <Square size={10} /> : <Play size={10} />}
            </button>
          </div>

          {/* Processed */}
          <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2 border border-neon-cyan/20">
            <div className="size-2 rounded-full shrink-0 bg-neon-cyan" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-neon-cyan font-medium">
                Denoised {mode === "ai" ? "(AI)" : "(DSP)"}
              </p>
            </div>
            <button
              onClick={() => handlePlay("processed")}
              className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
            >
              {playing === "processed" ? <Square size={10} /> : <Play size={10} />}
            </button>
          </div>

          <button
            onClick={handleAddToTimeline}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all active:scale-[0.98]"
          >
            <Plus size={11} /> Add Denoised to Timeline
          </button>
        </div>
      )}
    </div>
  );
}
