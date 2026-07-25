"use client";

import { useState, useEffect } from "react";
import { resetOpenRouterClient, OpenRouterClient } from "@/lib/ai/openrouter";
import { isAIAvailable } from "@/lib/ai/index";
import { Key, Check, X, ExternalLink, Info, AlertTriangle } from "lucide-react";

export function AISettings({ onConfigured }: { onConfigured?: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [status, setStatus] = useState({ speech: false, tts: false, openrouter: false });

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_key");
    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
    }
    setStatus(isAIAvailable());
  }, []);

  const saveKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem("openrouter_key");
      resetOpenRouterClient();
      setSaved(false);
      setStatus(isAIAvailable());
      onConfigured?.();
      return;
    }
    localStorage.setItem("openrouter_key", trimmed);
    resetOpenRouterClient();
    setSaved(true);
    setStatus(isAIAvailable());
    onConfigured?.();
  };

  const testKey = async () => {
    if (!apiKey.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const client = new OpenRouterClient(apiKey.trim());
      const response = await client.chat(
        [{ role: "user", content: "Reply with exactly: OK" }],
        { maxTokens: 10, temperature: 0 },
      );

      if (response.includes("OK")) {
        setTestResult({ ok: true, message: "API key works! Free models are accessible." });
        saveKey();
      } else {
        setTestResult({ ok: true, message: "Connected, but unexpected response. Key saved." });
        saveKey();
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || "Connection failed. Check your key.",
      });
    }

    setTesting(false);
  };

  const clearKey = () => {
    setApiKey("");
    localStorage.removeItem("openrouter_key");
    resetOpenRouterClient();
    setSaved(false);
    setTestResult(null);
    setStatus(isAIAvailable());
    onConfigured?.();
  };

  const getKeyDisplay = (key: string) => {
    if (key.length < 10) return key;
    return key.slice(0, 8) + "••••" + key.slice(-4);
  };

  return (
    <div className="space-y-4">
      {/* API Key */}
      <div className="glass rounded-xl p-3 space-y-2">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Key size={12} /> OpenRouter API Key
        </h4>

        <p className="text-[9px] text-text-tertiary leading-relaxed">
          Enter your OpenRouter API key to use AI features. Free models cost $0 and require no credits.
          Get a free key at{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-cyan underline"
          >
            openrouter.ai/keys
          </a>
        </p>

        <div className="flex gap-1.5">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
              setTestResult(null);
            }}
            placeholder="sk-or-v1-..."
            className="flex-1 glass rounded-lg px-3 py-2 text-[11px] text-text-primary placeholder:text-text-tertiary border border-border-subtle focus:outline-none focus:border-neon-cyan/30 font-mono"
          />
          {saved && (
            <button
              onClick={clearKey}
              className="px-2.5 py-1.5 rounded-lg glass text-neon-pink text-[10px] hover:bg-neon-pink/10 transition-all"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {saved && apiKey && (
          <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2">
            <Check size={11} className="text-neon-cyan shrink-0" />
            <span className="text-[9px] text-text-secondary font-mono">{getKeyDisplay(apiKey)}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={testKey}
            disabled={!apiKey.trim() || testing}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-medium hover:bg-neon-cyan/30 transition-all disabled:opacity-30"
          >
            {testing ? (
              <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            ) : (
              <ExternalLink size={11} />
            )}
            {testing ? "Testing..." : saved ? "Test & Save" : "Save & Test"}
          </button>
          {!saved && apiKey.trim() && (
            <button
              onClick={saveKey}
              className="px-3 py-1.5 rounded-xl glass text-text-primary text-[10px] font-medium hover:bg-glass-medium transition-all"
            >
              Save Only
            </button>
          )}
        </div>

        {testResult && (
          <div className={`flex items-start gap-1.5 text-[9px] px-2 py-1.5 rounded-lg ${
            testResult.ok ? "text-neon-cyan bg-neon-cyan/10" : "text-neon-pink bg-neon-pink/10"
          }`}>
            {testResult.ok ? <Check size={11} className="shrink-0 mt-0.5" /> : <AlertTriangle size={11} className="shrink-0 mt-0.5" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Browser AI Status */}
      <div className="glass rounded-xl p-3 space-y-2">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Info size={12} /> Browser AI Status
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">Speech Recognition (STT)</span>
            <span className={`text-[9px] ${status.speech ? "text-neon-cyan" : "text-text-tertiary"}`}>
              {status.speech ? "Available" : "Not supported"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">Text-to-Speech (TTS)</span>
            <span className={`text-[9px] ${status.tts ? "text-neon-cyan" : "text-text-tertiary"}`}>
              {status.tts ? "Available" : "Not supported"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">OpenRouter AI Models</span>
            <span className={`text-[9px] ${status.openrouter ? "text-neon-cyan" : "text-text-tertiary"}`}>
              {status.openrouter ? "Configured" : "Not set"}
            </span>
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
    </div>
  );
}
