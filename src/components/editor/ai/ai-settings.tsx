"use client";

import { useState, useEffect } from "react";
import { Check, Info, Zap } from "lucide-react";

export function AISettings() {
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feature: "chat",
            messages: [{ role: "user", content: "Reply with exactly: OK" }],
            maxTokens: 10,
            temperature: 0,
          }),
        });
        setBackendAvailable(res.ok);
      } catch {
        setBackendAvailable(false);
      }
    };
    check();
  }, []);

  return (
    <div className="space-y-4">
      {/* AI Status */}
      <div className="glass rounded-xl p-3 space-y-3">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Zap size={12} /> AI Configuration
        </h4>

        <div className="glass rounded-lg px-3 py-2.5 flex items-center gap-2.5">
          {backendAvailable === null ? (
            <span className="size-3 rounded-full bg-neon-cyan/30 animate-pulse" />
          ) : backendAvailable ? (
            <Check size={14} className="text-neon-cyan shrink-0" />
          ) : (
            <span className="size-3 rounded-full bg-neon-pink/50 shrink-0" />
          )}
          <div>
            <p className="text-[11px] text-text-primary font-medium">
              {backendAvailable === null
                ? "Checking AI connection..."
                : backendAvailable
                ? "AI is ready to use"
                : "AI temporarily unavailable"}
            </p>
            <p className="text-[9px] text-text-tertiary mt-0.5">
              {backendAvailable
                ? "Powered by OpenRouter free models. No API key needed."
                : "Please try again in a moment."}
            </p>
          </div>
        </div>
      </div>

      {/* Free Models Info */}
      <div className="glass rounded-xl p-3 space-y-2">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
          Free Models Available
        </h4>
        <ul className="space-y-1">
          {[
            "openrouter/free — Auto-router (picks best available)",
            "meta-llama/llama-3.3-70b-instruct (general purpose)",
            "nvidia/nemotron-3-ultra (long context, 1M)",
            "qwen/qwen3-coder (coding & reasoning)",
            "gpt-oss-120b (open-source reasoning)",
          ].map((m, i) => (
            <li key={i} className="text-[9px] text-text-tertiary flex items-start gap-1.5">
              <span className="text-neon-cyan mt-0.5">•</span>
              {m}
            </li>
          ))}
        </ul>
        <p className="text-[8px] text-text-tertiary mt-1">
          Models may change — OpenRouter auto-router ensures fallback. Rate-limited to 20 req/min for free tier.
        </p>
      </div>

      {/* Browser AI Status */}
      <div className="glass rounded-xl p-3 space-y-2">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Info size={12} /> Browser AI Status
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">Speech Recognition (STT)</span>
            <span className={`text-[9px] ${typeof window !== "undefined" && (window.SpeechRecognition || (window as any).webkitSpeechRecognition) ? "text-neon-cyan" : "text-text-tertiary"}`}>
              {typeof window !== "undefined" && (window.SpeechRecognition || (window as any).webkitSpeechRecognition) ? "Available" : "Not supported"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">Text-to-Speech (TTS)</span>
            <span className={`text-[9px] ${typeof window !== "undefined" && "speechSynthesis" in window ? "text-neon-cyan" : "text-text-tertiary"}`}>
              {typeof window !== "undefined" && "speechSynthesis" in window ? "Available" : "Not supported"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
