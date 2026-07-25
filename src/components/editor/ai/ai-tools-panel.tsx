"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { isAIAvailable } from "@/lib/ai/index";
import { AIChatAssistant } from "./ai-assistant";
import { AISmartCut } from "./ai-smart-cut";
import { AIRewrite } from "./ai-rewrite";
import { AISettings } from "./ai-settings";
import { AITranscription } from "./ai-transcription";

type AITab = "chat" | "transcribe" | "rewrite" | "smartcut" | "settings";

const TABS: { id: AITab; label: string; icon: string }[] = [
  { id: "chat", label: "Assistant", icon: "💬" },
  { id: "transcribe", label: "Captions", icon: "🎤" },
  { id: "rewrite", label: "Rewrite", icon: "✏" },
  { id: "smartcut", label: "Smart Cut", icon: "✂" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export function AIToolsPanel() {
  const { clips, selectedClipId } = useEditorStore();
  const [tab, setTab] = useState<AITab>("chat");
  const [aiStatus, setAiStatus] = useState({ speech: false, tts: false, openrouter: false });

  useEffect(() => {
    setAiStatus(isAIAvailable());
  }, []);

  const clip = clips.find((c) => c.id === selectedClipId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 ${
              tab === t.id
                ? "bg-neon-cyan/15 text-neon-cyan"
                : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {!aiStatus.openrouter && tab !== "settings" && (
          <div className="glass rounded-xl p-3 mb-3 text-center">
            <p className="text-[10px] text-text-tertiary mb-2">
              Configure your OpenRouter API key in Settings to use AI features
            </p>
            <button
              onClick={() => setTab("settings")}
              className="text-[10px] text-neon-cyan underline"
            >
              Open Settings
            </button>
          </div>
        )}

        {tab === "chat" && <AIChatAssistant />}
        {tab === "transcribe" && <AITranscription clip={clip} />}
        {tab === "rewrite" && <AIRewrite clip={clip} />}
        {tab === "smartcut" && <AISmartCut />}
        {tab === "settings" && <AISettings onConfigured={() => setAiStatus(isAIAvailable())} />}
      </div>
    </div>
  );
}
