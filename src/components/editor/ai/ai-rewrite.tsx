"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { AI_PROMPT_TEMPLATES, processPromptTemplate } from "@/lib/ai/index";
import type { AIPromptTemplate } from "@/lib/ai/prompts";
import { Sparkles, Copy, Check, Undo2 } from "lucide-react";

const TONE_OPTIONS = [
  "professional", "casual", "friendly", "formal", "humorous",
  "inspirational", "dramatic", "educational", "persuasive",
];

const STYLE_OPTIONS = [
  "engaging", "concise", "detailed", "storytelling", "technical",
  "conversational", "cinematic",
];

export function AIRewrite({ clip }: { clip: any }) {
  const { updateClip } = useEditorStore();
  const [selectedTemplate, setSelectedTemplate] = useState<AIPromptTemplate>(AI_PROMPT_TEMPLATES[0]);
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const subtitlesText = clip?.subtitles?.map((s: { text: string }) => s.text).join("\n") || "";
  const hasSubtitles = clip?.subtitles?.length > 0;

  const handleTemplateSelect = (t: AIPromptTemplate) => {
    setSelectedTemplate(t);
    setResult(null);
    setError("");

    // Pre-fill variables from clip context
    const vars: Record<string, string> = {
      TEXT: subtitlesText.slice(0, 5000) || customInput || "Text to rewrite...",
      TOPIC: clip?.name || "my video",
      LANGUAGE: "Spanish",
      STYLE: "engaging",
      AUDIENCE: "general",
      DURATION: "60",
      TONE: "professional",
      TYPE: "video",
      TITLE: clip?.name || "Untitled",
      CONTEXT: "Video project",
      CONTENT: subtitlesText.slice(0, 1000) || clip?.name || "",
      LENGTH: "100",
    };
    setVariables(vars);
    setCustomInput(vars.TEXT);
  };

  const handleRewrite = async () => {
    if (!customInput.trim()) {
      setError("No text to process");
      return;
    }

    const vars = { ...variables, TEXT: customInput };
    const prompt = processPromptTemplate(selectedTemplate, vars);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "chat",
          messages: [
            { role: "system", content: selectedTemplate.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: selectedTemplate.temperature ?? 0.3,
          maxTokens: selectedTemplate.maxTokens ?? 2048,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI rewrite failed");

      setResult(data.data?.text || "");
    } catch (err: any) {
      setError(err.message || "AI rewrite failed");
    }

    setLoading(false);
  };

  const applyToSubtitles = () => {
    if (!result || !clip?.subtitles) return;

    const lines = result.split("\n").filter((l: string) => l.trim());
    const updatedSubtitles = clip.subtitles.map((s: { text: string }, i: number) => ({
      ...s,
      text: lines[i]?.trim() || s.text,
    }));

    updateClip(clip.id, { subtitles: updatedSubtitles });
    setResult("✅ Applied to subtitles!");
  };

  const copyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Template selector */}
      <div className="grid grid-cols-2 gap-1">
        {AI_PROMPT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTemplateSelect(t)}
            className={`px-2 py-1.5 rounded-lg text-[9px] text-left transition-all ${
              selectedTemplate.id === t.id
                ? "bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan"
                : "glass border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            <div className="flex items-center gap-1">
              <span>{t.icon}</span>
              <span className="font-medium">{t.name}</span>
            </div>
            <div className="text-[8px] text-text-tertiary mt-0.5">{t.description}</div>
          </button>
        ))}
      </div>

      {/* Extra controls for rewrite/translate */}
      {(selectedTemplate.id === "translate-subtitles" || selectedTemplate.id === "change-tone" || selectedTemplate.id === "generate-script") && (
        <div className="flex gap-2">
          {selectedTemplate.id === "translate-subtitles" && (
            <div className="flex-1">
              <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Target Language</label>
              <input
                value={variables.LANGUAGE || ""}
                onChange={(e) => setVariables((v) => ({ ...v, LANGUAGE: e.target.value }))}
                placeholder="e.g. Spanish, French, Japanese"
                className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
              />
            </div>
          )}
          {selectedTemplate.id === "change-tone" && (
            <div className="flex-1">
              <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Target Tone</label>
              <select
                value={variables.TONE || "professional"}
                onChange={(e) => setVariables((v) => ({ ...v, TONE: e.target.value }))}
                className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          {selectedTemplate.id === "generate-script" && (
            <>
              <div className="flex-1">
                <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Duration (s)</label>
                <input
                  value={variables.DURATION || "60"}
                  onChange={(e) => setVariables((v) => ({ ...v, DURATION: e.target.value }))}
                  className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Style</label>
                <select
                  value={variables.STYLE || "engaging"}
                  onChange={(e) => setVariables((v) => ({ ...v, STYLE: e.target.value }))}
                  className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Input text */}
      <div>
        <label className="text-[8px] text-text-tertiary uppercase mb-1 block">Text to Process</label>
        <textarea
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            setResult(null);
          }}
          placeholder={
            hasSubtitles
              ? "Using subtitle text from selected clip..."
              : "Paste or type text to rewrite..."
          }
          rows={4}
          className="w-full glass rounded-lg px-2.5 py-2 text-[10px] text-text-primary placeholder:text-text-tertiary border border-border-subtle focus:outline-none focus:border-neon-cyan/30 resize-none"
        />
      </div>

      {/* Action button */}
      <button
        onClick={handleRewrite}
        disabled={loading || !customInput.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            Processing...
          </span>
        ) : (
          <>
            <Sparkles size={13} />
            {selectedTemplate.name}
          </>
        )}
      </button>

      {/* Result */}
      {error && (
        <div className="text-[10px] text-neon-pink bg-neon-pink/10 rounded-lg px-3 py-2">{error}</div>
      )}

      {result && (
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">Result</span>
            <div className="flex gap-1">
              {hasSubtitles && (
                <button
                  onClick={applyToSubtitles}
                  className="px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[8px] font-medium hover:bg-neon-cyan/30 transition-all"
                >
                  Apply to Subtitles
                </button>
              )}
              <button
                onClick={copyResult}
                className="size-6 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all"
              >
                {copied ? <Check size={10} className="text-neon-cyan" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
          <div className="glass rounded-lg p-2 max-h-[200px] overflow-y-auto">
            <p className="text-[10px] text-text-primary whitespace-pre-wrap leading-relaxed">
              {result}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
