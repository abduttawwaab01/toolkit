"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Tag, Sparkles, Copy, Check, RefreshCw } from "lucide-react";

interface TagResult {
  title: string;
  description: string;
  tags: string[];
  category: string;
  suggestedThumbnail: string;
  chapters: { time: number; title: string }[];
  socialMedia: {
    twitter: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
}

export function AutoTagger({ clip }: { clip: any }) {
  const { updateClip } = useEditorStore();
  const [result, setResult] = useState<TagResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [platform, setPlatform] = useState<"youtube" | "instagram" | "tiktok" | "twitter">("youtube");

  const subtitles = clip?.subtitles?.map((s: any) => s.text).join(" ") || "";
  const clipName = clip?.name || "Untitled clip";

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const context = subtitles
      ? `Clip content/subtitles: "${subtitles.slice(0, 2000)}"`
      : `Clip name: "${clipName}"`;

    const systemPrompt = `You are an expert content analyst and SEO specialist for video content.
Analyze the provided video context and generate metadata.
Output ONLY valid JSON with this structure:
{
  "title": "engaging SEO-optimized title (max 60 chars)",
  "description": "compelling description with keywords (2-3 sentences)",
  "tags": ["tag1", "tag2", ...],
  "category": "main category",
  "suggestedThumbnail": "description of ideal thumbnail",
  "chapters": [{"time": 0, "title": "Chapter Title"}],
  "socialMedia": {
    "twitter": "tweet-length caption (280 chars max)",
    "instagram": "engaging caption with hashtags",
    "youtube": "YouTube description with timestamps",
    "tiktok": "short punchy caption with trending hashtags"
  }
}
Generate 8-15 relevant tags. Create 3-5 chapters if content is long enough.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this video content:\n\n${context}` },
          ],
          temperature: 0.3,
          maxTokens: 2048,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      const text = data.data?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned invalid format");

      const parsed: TagResult = JSON.parse(jsonMatch[0]);
      setResult(parsed);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const applyTitle = () => {
    if (result && clip) {
      updateClip(clip.id, { name: result.title });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Tag size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-semibold text-text-primary">AI Auto-Tagger</span>
      </div>

      <p className="text-[9px] text-text-tertiary">
        Analyze your video content to get SEO-optimized titles, descriptions, tags, chapters, and social media captions.
      </p>

      {/* Context preview */}
      {subtitles && (
        <div className="glass rounded-lg p-2 text-[9px] text-text-secondary">
          <span className="text-text-tertiary">Content preview: </span>
          {subtitles.slice(0, 200)}...
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            Analyzing content...
          </span>
        ) : (
          <>
            <Sparkles size={13} />
            Analyze & Generate Tags
          </>
        )}
      </button>

      {error && (
        <div className="text-[10px] text-neon-pink bg-neon-pink/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {result && (
        <div className="space-y-2">
          {/* Title */}
          <div className="glass rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-text-tertiary uppercase font-semibold">Title</span>
              <div className="flex gap-1">
                <button onClick={applyTitle} className="px-1.5 py-0.5 rounded text-[7px] bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30">Apply</button>
                <button onClick={() => copyToClipboard(result.title, "title")} className="text-text-tertiary hover:text-text-primary">
                  {copied === "title" ? <Check size={9} className="text-neon-cyan" /> : <Copy size={9} />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-text-primary font-medium">{result.title}</p>
          </div>

          {/* Description */}
          <div className="glass rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-text-tertiary uppercase font-semibold">Description</span>
              <button onClick={() => copyToClipboard(result.description, "desc")} className="text-text-tertiary hover:text-text-primary">
                {copied === "desc" ? <Check size={9} className="text-neon-cyan" /> : <Copy size={9} />}
              </button>
            </div>
            <p className="text-[9px] text-text-secondary whitespace-pre-wrap">{result.description}</p>
          </div>

          {/* Tags */}
          <div className="glass rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-text-tertiary uppercase font-semibold">Tags ({result.tags.length})</span>
              <button onClick={() => copyToClipboard(result.tags.join(", "), "tags")} className="text-text-tertiary hover:text-text-primary">
                {copied === "tags" ? <Check size={9} className="text-neon-cyan" /> : <Copy size={9} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.tags.map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan text-[8px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Chapters */}
          {result.chapters.length > 0 && (
            <div className="glass rounded-lg p-2">
              <span className="text-[8px] text-text-tertiary uppercase font-semibold block mb-1">Chapters</span>
              {result.chapters.map((ch, i) => (
                <div key={i} className="flex gap-2 text-[9px]">
                  <span className="text-neon-cyan font-mono">{formatTime(ch.time)}</span>
                  <span className="text-text-secondary">{ch.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social Media Captions */}
          <div className="glass rounded-lg p-2">
            <span className="text-[8px] text-text-tertiary uppercase font-semibold block mb-1">Social Media Captions</span>
            <div className="flex gap-1 mb-2 flex-wrap">
              {(["youtube", "instagram", "tiktok", "twitter"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-2 py-0.5 rounded text-[8px] transition-all ${
                    platform === p
                      ? "bg-neon-cyan/15 text-neon-cyan"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative">
              <p className="text-[9px] text-text-secondary whitespace-pre-wrap">
                {result.socialMedia[platform]}
              </p>
              <button
                onClick={() => copyToClipboard(result.socialMedia[platform], platform)}
                className="absolute top-0 right-0 text-text-tertiary hover:text-text-primary"
              >
                {copied === platform ? <Check size={9} className="text-neon-cyan" /> : <Copy size={9} />}
              </button>
            </div>
          </div>

          {/* Regenerate */}
          <button
            onClick={handleAnalyze}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg glass border border-border-subtle text-[9px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-all"
          >
            <RefreshCw size={10} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
