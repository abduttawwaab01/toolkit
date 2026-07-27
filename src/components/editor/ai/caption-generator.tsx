"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Sparkles, Wand2, Copy, Check, Upload } from "lucide-react";

type CaptionStyle = "default" | "karaoke" | "pop" | "minimal" | "bold" | "cinematic";

const CAPTION_STYLES: { id: CaptionStyle; label: string; description: string }[] = [
  { id: "default", label: "Default", description: "Standard subtitles with clear timing" },
  { id: "karaoke", label: "Karaoke", description: "Word-by-word highlight animation" },
  { id: "pop", label: "Pop", description: "Bouncy, colorful word-by-word" },
  { id: "minimal", label: "Minimal", description: "Simple centered text, no background" },
  { id: "bold", label: "Bold", description: "Large text with shadow for impact" },
  { id: "cinematic", label: "Cinematic", description: "Letterboxed, film-style subtitles" },
];

interface GeneratedCaption {
  startTime: number;
  endTime: number;
  text: string;
  words?: { word: string; start: number; end: number }[];
}

export function CaptionGenerator({ clip }: { clip: any }) {
  const { updateClip } = useEditorStore();
  const [source, setSource] = useState<"text" | "audio" | "existing">("existing");
  const [textInput, setTextInput] = useState("");
  const [style, setStyle] = useState<CaptionStyle>("default");
  const [language, setLanguage] = useState("English");
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(42);
  const [result, setResult] = useState<GeneratedCaption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const existingSubtitles = clip?.subtitles || [];
  const clipDuration = clip?.duration || 30;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    let inputText = "";
    if (source === "text") {
      inputText = textInput;
    } else if (source === "existing") {
      inputText = existingSubtitles.map((s: any) => s.text).join("\n");
    } else {
      setError("Audio-based caption generation requires transcription first. Use the Captions tab.");
      setLoading(false);
      return;
    }

    if (!inputText.trim()) {
      setError("No text to generate captions from");
      setLoading(false);
      return;
    }

    const systemPrompt = `You are a professional subtitle generator for video editing.
Generate well-timed captions from the provided text.
Output ONLY valid JSON array of caption objects.
Each caption must have: startTime (seconds), endTime (seconds), text (string).
Rules:
- Max ${maxCharsPerLine} characters per line
- Split long sentences into multiple captions
- Natural reading pace: 2-4 seconds per caption
- Duration: ~${clipDuration} seconds total
- Language: ${language}
- Style: ${style}
Output format: [{"startTime":0,"endTime":2.5,"text":"Caption text"},...]`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate captions for this text (${clipDuration}s video, ${language}):\n\n${inputText.slice(0, 3000)}` },
          ],
          temperature: 0.2,
          maxTokens: 4096,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Caption generation failed");

      const text = data.data?.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI returned invalid caption format");

      const captions: GeneratedCaption[] = JSON.parse(jsonMatch[0]);
      setResult(captions);
    } catch (err: any) {
      setError(err.message || "Caption generation failed");
    }

    setLoading(false);
  };

  const applyCaptions = () => {
    if (!result || !clip) return;

    const subtitles = result.map((c, i) => ({
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      index: i,
      start: c.startTime,
      end: c.endTime,
      text: c.text,
    }));

    updateClip(clip.id, { subtitles });
    setResult(null);
  };

  const copyResult = async () => {
    if (!result) return;
    const text = result.map((c) => `[${formatTime(c.startTime)} → ${formatTime(c.endTime)}] ${c.text}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-semibold text-text-primary">AI Caption Generator</span>
      </div>

      {/* Source */}
      <div>
        <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Source</label>
        <div className="flex gap-1">
          {(["existing", "text", "audio"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] transition-all ${
                source === s
                  ? "bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan"
                  : "glass border border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              {s === "existing" ? "Existing Subtitles" : s === "text" ? "From Text" : "From Audio"}
            </button>
          ))}
        </div>
      </div>

      {/* Text input (when source is text) */}
      {source === "text" && (
        <div>
          <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Text Content</label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your script, dialogue, or text here..."
            rows={5}
            className="w-full glass rounded-lg px-2.5 py-2 text-[10px] text-text-primary placeholder:text-text-tertiary border border-border-subtle focus:outline-none focus:border-neon-cyan/30 resize-none"
          />
        </div>
      )}

      {source === "existing" && existingSubtitles.length > 0 && (
        <div className="glass rounded-lg p-2 text-[9px] text-text-secondary">
          {existingSubtitles.length} existing subtitle(s) will be re-timed and reformatted.
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Language</label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
          />
        </div>
        <div>
          <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Max chars/line</label>
          <input
            type="number"
            value={maxCharsPerLine}
            onChange={(e) => setMaxCharsPerLine(parseInt(e.target.value) || 42)}
            className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
          />
        </div>
      </div>

      {/* Style selector */}
      <div>
        <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Caption Style</label>
        <div className="grid grid-cols-3 gap-1">
          {CAPTION_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-2 py-1.5 rounded-lg text-[8px] text-left transition-all ${
                style === s.id
                  ? "bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan"
                  : "glass border border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="font-medium">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || (source === "text" && !textInput.trim()) || (source === "existing" && existingSubtitles.length === 0)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            Generating captions...
          </span>
        ) : (
          <>
            <Wand2 size={13} />
            Generate Captions
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="text-[10px] text-neon-pink bg-neon-pink/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">
              {result.length} captions generated
            </span>
            <div className="flex gap-1">
              <button
                onClick={applyCaptions}
                className="px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[8px] font-medium hover:bg-neon-cyan/30 transition-all"
              >
                Apply to Clip
              </button>
              <button
                onClick={copyResult}
                className="size-6 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all"
              >
                {copied ? <Check size={10} className="text-neon-cyan" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
          <div className="glass rounded-lg p-2 max-h-[200px] overflow-y-auto space-y-1">
            {result.map((c, i) => (
              <div key={i} className="flex gap-2 text-[9px]">
                <span className="text-neon-cyan font-mono shrink-0">
                  {formatTime(c.startTime)} → {formatTime(c.endTime)}
                </span>
                <span className="text-text-secondary">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
