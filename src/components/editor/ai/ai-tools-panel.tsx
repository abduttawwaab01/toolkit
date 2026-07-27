"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { isAIAvailable } from "@/lib/ai/index";
import { AIChatAssistant } from "./ai-assistant";
import { AISmartCut } from "./ai-smart-cut";
import { AIRewrite } from "./ai-rewrite";
import { AISettings } from "./ai-settings";
import { AITranscription } from "./ai-transcription";
import { ObjectRemovalPanel } from "./object-removal-panel";
import { ImageGenerationPanel } from "./image-generation-panel";
import { VideoUpscalePanel } from "./video-upscale-panel";
import { VoiceClonePanel } from "./voice-clone-panel";
import { TextToSpeechPanel } from "./text-to-speech-panel";
import { MusicGenerationPanel } from "./music-generation-panel";
import { CaptionGenerator } from "./caption-generator";
import { AutoTagger } from "./auto-tagger";

type AITab = "chat" | "generate" | "tts" | "music" | "clone" | "transcribe" | "rewrite" | "smartcut" | "object-removal" | "upscale" | "captions" | "tags" | "settings";

const TABS: { id: AITab; label: string; icon: string }[] = [
  { id: "chat", label: "Assistant", icon: "💬" },
  { id: "generate", label: "Generate", icon: "🎨" },
  { id: "tts", label: "TTS", icon: "🔊" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "clone", label: "Clone", icon: "🎙" },
  { id: "transcribe", label: "Transcribe", icon: "🎤" },
  { id: "captions", label: "Captions", icon: "📝" },
  { id: "rewrite", label: "Rewrite", icon: "✏" },
  { id: "tags", label: "Tags", icon: "🏷" },
  { id: "smartcut", label: "Smart Cut", icon: "✂" },
  { id: "object-removal", label: "Remove", icon: "🧹" },
  { id: "upscale", label: "Upscale", icon: "⬆" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export function AIToolsPanel() {
  const { clips, selectedClipId } = useEditorStore();
  const [tab, setTab] = useState<AITab>("chat");

  const clip = clips.find((c) => c.id === selectedClipId);
  const clipImageUrl = clip?.type === "video" || clip?.type === "overlay" ? clip.src : null;

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
        {tab === "chat" && <AIChatAssistant />}
        {tab === "generate" && <ImageGenerationPanel />}
        {tab === "tts" && <TextToSpeechPanel />}
        {tab === "music" && <MusicGenerationPanel />}
        {tab === "clone" && <VoiceClonePanel />}
        {tab === "transcribe" && <AITranscription clip={clip} />}
        {tab === "rewrite" && <AIRewrite clip={clip} />}
        {tab === "smartcut" && <AISmartCut />}
        {tab === "object-removal" && (
          <ObjectRemovalPanel
            imageUrl={clipImageUrl || undefined}
            onApply={(resultUrl) => {
              if (selectedClipId) {
                useEditorStore.getState().updateClip(selectedClipId, { src: resultUrl });
              }
            }}
          />
        )}
        {tab === "upscale" && <VideoUpscalePanel />}
        {tab === "captions" && <CaptionGenerator clip={clip} />}
        {tab === "tags" && <AutoTagger clip={clip} />}
        {tab === "settings" && <AISettings />}
      </div>
    </div>
  );
}
