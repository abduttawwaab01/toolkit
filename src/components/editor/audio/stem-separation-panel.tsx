"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { separateAudioStems, STEM_INFO, dataUriToBlob } from "@/lib/ai/stem-separation";
import { Scissors, Play, Square, Plus, Upload, RefreshCw } from "lucide-react";

export function StemSeparationPanel() {
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [stems, setStems] = useState<"2" | "4">("4");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobPolling, setJobPolling] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollJob = useCallback(async (id: string) => {
    setJobPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (data.status === "DONE") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setJobPolling(false);
          setJobId(null);
          toast.success("Separation complete", "Background stem separation finished");
        } else if (data.status === "FAILED") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setJobPolling(false);
          setJobId(null);
          toast.error("Separation failed", data.error || "Background job failed");
        }
      } catch {
        // retry on next interval
      }
    }, 3000);
  }, [toast]);

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
    setJobId(null);

    try {
      const separationResult = await separateAudioStems(file, {
        stems,
        onProgress: setProgress,
      });

      if (separationResult.stems && Object.keys(separationResult.stems).length > 0) {
        setResult(separationResult.stems);
        toast.success("Separation complete", `${Object.keys(separationResult.stems).length} stems extracted`);
      }
    } catch (error: any) {
      toast.error("Separation failed", error.message || "Could not separate audio stems");
    } finally {
      setProcessing(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [stems, toast]);

  const handlePlayStem = useCallback((stemName: string) => {
    if (playing === stemName) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    if (!result?.[stemName]) return;

    audioRef.current?.pause();
    const blob = dataUriToBlob(result[stemName]);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      setPlaying(null);
      URL.revokeObjectURL(url);
    };
    setPlaying(stemName);
    audio.play().catch(() => {
      setPlaying(null);
      URL.revokeObjectURL(url);
    });
  }, [result, playing]);

  const handleAddToTimeline = useCallback((stemName: string) => {
    if (!result?.[stemName]) return;

    const store = useEditorStore.getState();
    const audioTrack = store.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      toast.error("No audio track", "Add an audio track first");
      return;
    }

    const blob = dataUriToBlob(result[stemName]);
    const url = URL.createObjectURL(blob);
    const info = STEM_INFO[stemName] || { label: stemName, color: "#4facfe" };

    store.addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: info.label,
      src: url,
      thumbnail: null,
      startTime: store.playhead,
      duration: 10,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Stem added", `"${info.label}" added to timeline`);
  }, [result, toast]);

  const handleAddAllStems = useCallback(() => {
    if (!result) return;
    Object.keys(result).forEach((stemName) => {
      handleAddToTimeline(stemName);
    });
  }, [result, handleAddToTimeline]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors size={12} className="text-neon-cyan" />
          <span className="text-[10px] font-medium text-text-primary">AI Stem Separation</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setStems("2")}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all ${
              stems === "2" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}
          >
            2 Stems
          </button>
          <button
            onClick={() => setStems("4")}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-medium transition-all ${
              stems === "4" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}
          >
            4 Stems
          </button>
        </div>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        {stems === "4"
          ? "Separates audio into vocals, drums, bass, and other instruments using Demucs AI."
          : "Separates audio into vocals and accompaniment."}
        {stems === "2" && (
          <span className="block mt-1 text-[7px] text-neon-cyan">
            Now renders true accompaniment (drums + bass + other mixed) server-side.
          </span>
        )}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.aac,.ogg,.m4a,.flac,.opus"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={processing || jobPolling}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50"
      >
        {processing || jobPolling ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-cyan">
              {jobPolling ? "Waiting in queue..." : `Separating... ${progress}%`}
            </span>
          </>
        ) : (
          <>
            <Upload size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary">Select Audio File (MP3, WAV, AAC, OGG, FLAC, OPUS, M4A)</span>
          </>
        )}
      </button>

      {processing && progress > 0 && !jobPolling && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {jobPolling && (
        <div className="glass rounded-lg px-2.5 py-2 flex items-center gap-2">
          <RefreshCw size={10} className="text-neon-cyan animate-spin shrink-0" />
          <span className="text-[9px] text-neon-cyan">
            Large file queued — processing in background...
          </span>
        </div>
      )}

      {result && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-text-tertiary uppercase tracking-wider">Separated Stems</p>
            {Object.keys(result).length > 1 && (
              <button
                onClick={handleAddAllStems}
                className="text-[8px] text-neon-cyan hover:underline"
              >
                Add All to Timeline
              </button>
            )}
          </div>
          {Object.entries(result).map(([stemName, _dataUri]) => {
            const info = STEM_INFO[stemName] || { label: stemName, color: "#4facfe", icon: "🎵" };
            const isPlaying = playing === stemName;
            return (
              <div
                key={stemName}
                className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2 hover:bg-glass-medium transition-all"
              >
                <div
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-primary font-medium truncate">{info.label}</p>
                </div>
                <button
                  onClick={() => handlePlayStem(stemName)}
                  className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
                >
                  {isPlaying ? <Square size={10} /> : <Play size={10} />}
                </button>
                <button
                  onClick={() => handleAddToTimeline(stemName)}
                  className="size-6 rounded-lg glass flex items-center justify-center text-neon-cyan hover:bg-neon-cyan/20 transition-all"
                >
                  <Plus size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
