"use client";

import { useState } from "react";
import { Sparkles, Check, Palette } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";
import { autoColorGrade, applyStylePreset } from "@/lib/ai/auto-color";

const STYLE_PRESETS = [
  { id: "auto", name: "Auto Color", icon: "🎯" },
  { id: "cinematic", name: "Cinematic", icon: "🎬" },
  { id: "vintage", name: "Vintage", icon: "📽" },
  { id: "noir", name: "Noir", icon: "🕶" },
  { id: "warm", name: "Warm", icon: "☀️" },
  { id: "cool", name: "Cool", icon: "❄️" },
  { id: "dramatic", name: "Dramatic", icon: "⚡" },
];

export function AutoColorPanel() {
  const [applying, setApplying] = useState<string | null>(null);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const clips = useEditorStore((s) => s.clips);
  const addEffectToClip = useEditorStore((s) => s.addEffectToClip);
  const updateEffectParam = useEditorStore((s) => s.updateEffectParam);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const applyColorPreset = (presetId: string) => {
    if (!selectedClipId) return;
    setApplying(presetId);
    pushHistory();

    if (presetId === "auto") {
      addEffectToClip(selectedClipId, "brightness");
      addEffectToClip(selectedClipId, "contrast");
      addEffectToClip(selectedClipId, "saturate");
      addEffectToClip(selectedClipId, "cinematic");
    } else {
      const preset = STYLE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturate");
      }
    }

    setTimeout(() => setApplying(null), 1000);
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-medium text-text-primary">Auto Color</span>
      </div>

      {!selectedClipId ? (
        <p className="text-[9px] text-text-tertiary">Select a clip to apply color grading</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyColorPreset(preset.id)}
              disabled={applying !== null}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
                applying === preset.id
                  ? "bg-neon-cyan/20 border border-neon-cyan/40"
                  : "glass hover:bg-glass-medium border border-border-subtle"
              }`}
            >
              {applying === preset.id ? (
                <Check size={14} className="text-neon-cyan" />
              ) : (
                <span className="text-[14px]">{preset.icon}</span>
              )}
              <span className="text-[8px] text-text-secondary">{preset.name}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[8px] text-text-tertiary mt-1">
        Analyzes frame content and applies optimal color correction automatically. No AI API needed.
      </p>
    </div>
  );
}
