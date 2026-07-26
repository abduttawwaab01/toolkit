"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, Wand2, Languages, PenTool, RotateCcw, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AIWritingAssistantProps {
  selectedText?: string;
  onReplace: (text: string) => void;
  editorRef?: React.RefObject<HTMLDivElement>;
}

type AIMode = "grammar" | "rewrite" | "summarize" | "translate" | "tone";

const MODES: { id: AIMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "grammar", label: "Fix Grammar", icon: CheckCircle2, description: "Correct spelling and grammar errors" },
  { id: "rewrite", label: "Rewrite", icon: RotateCcw, description: "Improve clarity and flow" },
  { id: "summarize", label: "Summarize", icon: PenTool, description: "Condense to key points" },
  { id: "translate", label: "Translate", icon: Languages, description: "Convert to another language" },
  { id: "tone", label: "Change Tone", icon: Wand2, description: "Adjust voice (formal, casual, professional)" },
];

const TONES = ["Professional", "Casual", "Formal", "Friendly", "Confident", "Humorous"];
const LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese",
  "Japanese", "Chinese", "Arabic", "Russian", "Hindi",
  "Yoruba", "Hausa", "Igbo", "Swahili", "Zulu",
  "Amharic", "Somali", "Haitian Creole", "Bengali", "Turkish",
  "Dutch", "Greek", "Hebrew", "Korean", "Vietnamese",
  "Thai", "Polish", "Czech", "Swedish", "Norwegian",
  "Danish", "Finnish", "Indonesian", "Malay", "Filipino",
];

export function AIWritingAssistant({ selectedText, onReplace, editorRef }: AIWritingAssistantProps) {
  const [mode, setMode] = useState<AIMode>("grammar");
  const [subMode, setSubMode] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAIRequest = useCallback(async () => {
    const text = selectedText;
    if (!text?.trim()) {
      setError("Select some text in the editor first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const modePrompts: Record<string, string> = {
        grammar: "Fix grammar, spelling, and punctuation. Return only the corrected text.",
        rewrite: "Rewrite this text to improve clarity and flow while preserving meaning. Return only the rewritten text.",
        summarize: "Summarize this text to capture the key points concisely. Return only the summary.",
        translate: `Translate this text to ${subMode || "Spanish"}. Return only the translation.`,
        tone: `Rewrite this text in a ${subMode || "Professional"} tone. Return only the rewritten text.`,
      };

      const prompt = customPrompt.trim() || modePrompts[mode];

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}\n\nText:\n"${text}"`,
          action: mode,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const data = await res.json();
      const cleaned = (data.result || data.text || "").replace(/^["']|["']$/g, "").trim();
      if (!cleaned) throw new Error("No response from AI");

      setResult(cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }, [selectedText, mode, subMode, customPrompt]);

  const handleApply = useCallback(() => {
    if (result) onReplace(result);
    setExpanded(false);
    setResult(null);
  }, [result, onReplace]);

  const handleModeChange = useCallback((newMode: AIMode) => {
    setMode(newMode);
    setResult(null);
    setError(null);
    setSubMode("");
    setCustomPrompt("");
    if (newMode !== "tone" && newMode !== "translate") {
      handleAIRequest();
    }
  }, [handleAIRequest]);

  const handleCustomSubmit = useCallback(() => {
    if (customPrompt.trim()) handleAIRequest();
  }, [customPrompt, handleAIRequest]);

  return (
    <div className="border-t border-border-subtle bg-surface-secondary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-neon-cyan" />
          <span className="font-medium">AI Writing Assistant</span>
          {selectedText && <span className="text-[10px] text-text-tertiary bg-glass-medium px-2 py-0.5 rounded-full">{selectedText.length} chars selected</span>}
        </div>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isActive
                          ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                          : "bg-glass-light border border-border-subtle text-text-secondary hover:bg-glass-medium hover:text-text-primary",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {(mode === "translate") && (
                <select
                  value={subMode}
                  onChange={(e) => setSubMode(e.target.value)}
                  className="w-full rounded-lg bg-glass-light border border-border-subtle px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-cyan/40"
                >
                  <option value="">Select language...</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              )}

              {(mode === "tone") && (
                <select
                  value={subMode}
                  onChange={(e) => setSubMode(e.target.value)}
                  className="w-full rounded-lg bg-glass-light border border-border-subtle px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-cyan/40"
                >
                  <option value="">Select tone...</option>
                  {TONES.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Custom instruction..."
                  className="flex-1 rounded-lg bg-glass-light border border-border-subtle px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                />
                <Button variant="ghost" size="sm" onClick={handleCustomSubmit} disabled={!customPrompt.trim() || loading}>
                  Go
                </Button>
              </div>

              {!selectedText && (
                <div className="flex items-center gap-2 rounded-lg bg-glass-light border border-border-subtle p-3 text-xs text-text-tertiary">
                  <AlertCircle className="size-3.5 shrink-0" />
                  Select text in the editor to use AI features
                </div>
              )}

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-lg bg-glass-light border border-border-subtle p-4">
                    <Loader2 className="size-4 text-neon-cyan animate-spin shrink-0" />
                    <span className="text-sm text-text-secondary">Processing...</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-lg bg-neon-pink/10 border border-neon-pink/30 p-3">
                    <AlertCircle className="size-4 text-neon-pink shrink-0" />
                    <span className="text-xs text-neon-pink">{error}</span>
                  </motion.div>
                )}

                {result && !loading && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} ref={resultRef} className="space-y-2">
                    <div className="rounded-lg bg-glass-light border border-border-subtle p-3 text-sm text-text-primary leading-relaxed">
                      {result}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={handleApply}>
                        <CheckCircle2 className="size-3.5" /> Apply
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                        <X className="size-3.5" /> Discard
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
