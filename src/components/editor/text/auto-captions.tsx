"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { Subtitle } from "@/types/editor";

interface AutoCaptionsProps {
  clipId: string;
}

export function AutoCaptions({ clipId }: AutoCaptionsProps) {
  const { clips, updateClip } = useEditorStore();
  const clip = clips.find((c) => c.id === clipId);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [language, setLanguage] = useState("en");

  if (!clip) return null;

  const handleGenerate = async () => {
    if (!clip.src) {
      setProgress("No media source available for this clip");
      return;
    }

    setGenerating(true);
    setProgress("Transcribing audio...");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "transcribe",
          audioUrl: clip.src,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProgress(`Error: ${data.error || "Transcription failed"}`);
        setGenerating(false);
        return;
      }

      const segments = data.segments || data.words || [];

      if (segments.length === 0) {
        setProgress("No speech detected. Try a different audio source.");
        setGenerating(false);
        return;
      }

      const subtitles: Subtitle[] = segments.map(
        (seg: { start: number; end: number; text: string }, i: number) => ({
          id: crypto.randomUUID(),
          index: i + 1,
          start: seg.start,
          end: seg.end || seg.start + 1,
          text: seg.text.trim(),
        }),
      );

      updateClip(clipId, {
        subtitles: [...(clip.subtitles || []), ...subtitles].sort((a, b) => a.start - b.start),
        type: "text",
      });

      setProgress(`✅ ${subtitles.length} captions generated`);
    } catch {
      setProgress("Failed to connect to AI service");
    }

    setGenerating(false);
  };

  return (
    <div className="glass rounded-lg p-3 space-y-2">
      <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
        Auto Captions
      </h4>

      <p className="text-[10px] text-text-tertiary leading-relaxed">
        Automatically generate subtitles from the audio in this clip using AI speech recognition.
      </p>

      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="flex-1 glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
          <option value="ar">Arabic</option>
          <option value="hi">Hindi</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={generating || !clip.src}
          className="glass rounded-lg px-3 py-1 text-[10px] font-medium text-neon-cyan hover:bg-neon-cyan/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? "..." : "Generate"}
        </button>
      </div>

      {progress && (
        <div className={`text-[9px] ${progress.includes("✅") ? "text-neon-cyan" : progress.includes("Error") ? "text-neon-pink" : "text-text-tertiary"}`}>
          {progress}
        </div>
      )}
    </div>
  );
}
