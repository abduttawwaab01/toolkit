"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { detectSilence, computeSilenceRemoval, decodeAudioFile } from "@/lib/audio-engine/index";
import type { SilenceSegment } from "@/lib/audio-engine/index";
import { Scissors, Upload, Play, BarChart3, Trash2, SkipForward, Music, Video } from "lucide-react";

export function AISmartCut() {
  const { clips, tracks, addClip, removeClip, pushHistory } = useEditorStore();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"audio" | "video">("audio");
  const [silenceSegments, setSilenceSegments] = useState<SilenceSegment[]>([]);
  const [analysis, setAnalysis] = useState<{
    duration: number;
    totalSilence: number;
    removable: number;
    newDuration: number;
    regions: { start: number; end: number }[];
  } | null>(null);
  const [silenceThreshold, setSilenceThreshold] = useState(0.02);
  const [minSilenceDuration, setMinSilenceDuration] = useState(0.3);
  const [maxSilenceToKeep, setMaxSilenceToKeep] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    setSilenceSegments([]);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus("");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) { setStatus("Select a file first"); return; }

    setLoading(true);
    setStatus("Analyzing audio...");

    try {
      const audioBuffer = await decodeAudioFile(file);
      const segs = await detectSilence(audioBuffer, silenceThreshold, minSilenceDuration);
      const result = computeSilenceRemoval(audioBuffer, segs, maxSilenceToKeep);

      setSilenceSegments(segs);
      setAnalysis({
        duration: audioBuffer.duration,
        totalSilence: segs.reduce((s, seg) => s + seg.duration, 0),
        removable: result.totalRemoved,
        newDuration: result.newDuration,
        regions: result.keptRegions,
      });

      if (segs.length === 0) {
        toast.info("No silence detected", "Try lowering the silence threshold");
        setStatus("No significant silence detected");
      } else {
        setStatus(
          `${segs.length} silence gaps · ` +
          `Remove ${result.totalRemoved.toFixed(1)}s · ` +
          `New duration: ${result.newDuration.toFixed(1)}s ` +
          `(${(result.totalRemoved / audioBuffer.duration * 100).toFixed(0)}% shorter)`,
        );
        toast.success(`Found ${segs.length} silent sections`, `${result.totalRemoved.toFixed(1)}s removable`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      toast.error("Analysis failed", err.message);
    }

    setLoading(false);
  }, [file, silenceThreshold, minSilenceDuration, maxSilenceToKeep, toast]);

  const applyToTimeline = useCallback(() => {
    if (!analysis || !file || analysis.regions.length === 0) return;

    pushHistory();
    toast.info("Applying silence removal...", "Splitting clips at silence boundaries");

    const track = tracks.find((t) => t.type === analysisMode) || tracks[0];
    const isVideo = analysisMode === "video";
    const srcUrl = previewUrl || URL.createObjectURL(file);

    // Remove existing clips on this track (optional)
    const existingClips = useEditorStore.getState().clips.filter((c) => c.trackId === track.id);
    for (const c of existingClips) {
      removeClip(c.id);
    }

    // Add new clips for each kept region
    let clipStart = 0;
    for (const region of analysis.regions) {
      const duration = region.end - region.start;
      if (duration < 0.3) continue;

      addClip({
        trackId: track.id,
        type: isVideo ? "video" : "audio",
        name: `${file.name.replace(/\.[^.]+$/, "")} ${clipStart.toFixed(1)}s`,
        src: srcUrl,
        thumbnail: null,
        startTime: clipStart,
        duration,
        trimStart: region.start,
        trimEnd: region.end,
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

      clipStart += duration;
    }

    setStatus(`✅ Split into ${analysis.regions.length} clips, removed ${analysis.totalSilence.toFixed(1)}s silence`);
    toast.success("Silence removed", `Timeline updated — ${analysis.regions.length} clips created`);
  }, [analysis, file, previewUrl, tracks, analysisMode, addClip, removeClip, pushHistory, toast]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex gap-1">
        {(["audio", "video"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setAnalysisMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              analysisMode === mode
                ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                : "glass border border-border-subtle text-text-tertiary hover:text-text-primary"
            }`}
          >
            {mode === "audio" ? <Music size={12} /> : <Video size={12} />}
            {mode === "audio" ? "Audio" : "Video"}
          </button>
        ))}
      </div>

      {/* File selector */}
      <div
        onClick={() => fileRef.current?.click()}
        className="glass rounded-xl p-4 border-2 border-dashed border-border-subtle hover:border-neon-cyan/30 cursor-pointer text-center transition-all active:scale-[0.98]"
      >
        <input ref={fileRef} type="file" accept="audio/*,video/*" onChange={handleFile} className="hidden" />
        <div className="size-10 mx-auto mb-2 rounded-2xl glass flex items-center justify-center">
          <Upload size={18} className="text-neon-cyan" />
        </div>
        <p className="text-[11px] text-text-primary">{file ? file.name : "Select audio or video file"}</p>
        <p className="text-[9px] text-text-tertiary mt-0.5">
          {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ${analysis ? analysis.duration.toFixed(1) + "s" : ""}` : "Click to browse"}
        </p>
      </div>

      {previewUrl && (
        <div className="glass rounded-xl p-2">
          {analysisMode === "audio" ? (
            <audio src={previewUrl} controls className="w-full h-8" />
          ) : (
            <video src={previewUrl} controls className="w-full rounded-lg max-h-[150px]" />
          )}
        </div>
      )}

      {/* Controls */}
      {file && (
        <div className="space-y-2">
          <div>
            <label className="text-[8px] text-text-tertiary uppercase mb-1 flex justify-between">
              <span>Silence Threshold: {silenceThreshold.toFixed(3)}</span>
              <span className="text-text-secondary">{silenceThreshold < 0.01 ? "Very sensitive" : silenceThreshold < 0.03 ? "Normal" : "Aggressive"}</span>
            </label>
            <input type="range" min={0.001} max={0.1} step={0.001} value={silenceThreshold}
              onChange={(e) => setSilenceThreshold(Number(e.target.value))} className="w-full accent-neon-cyan h-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-text-tertiary uppercase mb-1">Min Silence</label>
              <input type="range" min={0.1} max={2} step={0.1} value={minSilenceDuration}
                onChange={(e) => setMinSilenceDuration(Number(e.target.value))} className="w-full accent-neon-cyan h-1" />
              <span className="text-[8px] text-text-secondary">{minSilenceDuration.toFixed(1)}s</span>
            </div>
            <div>
              <label className="text-[8px] text-text-tertiary uppercase mb-1">Keep Max</label>
              <input type="range" min={0} max={1} step={0.05} value={maxSilenceToKeep}
                onChange={(e) => setMaxSilenceToKeep(Number(e.target.value))} className="w-full accent-neon-cyan h-1" />
              <span className="text-[8px] text-text-secondary">{maxSilenceToKeep.toFixed(2)}s</span>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {loading ? (
              <><span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" /> Analyzing...</>
            ) : (
              <><BarChart3 size={13} /> Detect Silence</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-2">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">Analysis</h4>
              <span className="text-[9px] text-neon-cyan font-semibold">-{analysis.removable.toFixed(1)}s</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { label: "Duration", value: `${analysis.duration.toFixed(1)}s` },
                { label: "Silence", value: `${analysis.totalSilence.toFixed(1)}s` },
                { label: "Remove", value: `${analysis.removable.toFixed(1)}s` },
                { label: "Result", value: `${analysis.newDuration.toFixed(1)}s` },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-lg p-1.5 text-center">
                  <div className="text-text-primary font-mono font-bold text-[11px]">{stat.value}</div>
                  <div className="text-text-tertiary text-[8px]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline visualization */}
          {silenceSegments.length > 0 && (
            <div className="glass rounded-xl p-3">
              <h4 className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                Silence Timeline ({silenceSegments.length} gaps)
              </h4>
              <div className="relative h-8 glass rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-neon-cyan/10" style={{ width: "100%" }} />
                {silenceSegments.slice(0, 20).map((seg, i) => {
                  const left = (seg.start / analysis.duration) * 100;
                  const w = ((seg.end - seg.start) / analysis.duration) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute h-full bg-neon-pink/50 border-r border-neon-pink/80"
                      style={{ left: `${left}%`, width: `${Math.max(w, 0.3)}%` }}
                      title={`${seg.start.toFixed(1)}s → ${seg.end.toFixed(1)}s (${seg.duration.toFixed(1)}s)`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] text-text-tertiary mt-1">
                <span>0:00</span>
                <span>{silenceSegments.length > 5 ? `showing 20 of ${silenceSegments.length}` : ""}</span>
                <span>{formatTime(analysis.duration)}</span>
              </div>
            </div>
          )}

          <button
            onClick={applyToTimeline}
            disabled={analysis.regions.length === 0}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            <Scissors size={13} />
            Cut & Remove Silence ({analysis.regions.length} clips, -{analysis.removable.toFixed(1)}s)
          </button>
        </div>
      )}

      {status && (
        <div className={`text-[9px] px-2 py-1 rounded-lg ${
          status.startsWith("✅") ? "text-neon-cyan bg-neon-cyan/10" :
          status.startsWith("Error") ? "text-neon-pink bg-neon-pink/10" :
          "text-text-tertiary"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
