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

    switch (presetId) {
      case "auto": {
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturate");
        addEffectToClip(selectedClipId, "cinematic");
        break;
      }
      case "cinematic": {
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "temperature");
        addEffectToClip(selectedClipId, "cinematic");
        const clip = clips.find((c) => c.id === selectedClipId);
        const contrastFx = clip?.effects.find((e) => e.type === "contrast");
        const satFx = clip?.effects.find((e) => e.type === "saturation");
        const tempFx = clip?.effects.find((e) => e.type === "temperature");
        if (contrastFx) updateEffectParam(selectedClipId, contrastFx.id, "amount", 15);
        if (satFx) updateEffectParam(selectedClipId, satFx.id, "amount", -20);
        if (tempFx) updateEffectParam(selectedClipId, tempFx.id, "amount", 10);
        break;
      }
      case "vintage": {
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "sepia");
        const clip = clips.find((c) => c.id === selectedClipId);
        const brightFx = clip?.effects.find((e) => e.type === "brightness");
        const contrastFx = clip?.effects.find((e) => e.type === "contrast");
        const satFx = clip?.effects.find((e) => e.type === "saturation");
        if (brightFx) updateEffectParam(selectedClipId, brightFx.id, "amount", -5);
        if (contrastFx) updateEffectParam(selectedClipId, contrastFx.id, "amount", -10);
        if (satFx) updateEffectParam(selectedClipId, satFx.id, "amount", -30);
        break;
      }
      case "noir": {
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "grayscale");
        addEffectToClip(selectedClipId, "noir");
        const clip = clips.find((c) => c.id === selectedClipId);
        const contrastFx = clip?.effects.find((e) => e.type === "contrast");
        if (contrastFx) updateEffectParam(selectedClipId, contrastFx.id, "amount", 40);
        break;
      }
      case "warm": {
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "temperature");
        addEffectToClip(selectedClipId, "vibrance");
        const clip = clips.find((c) => c.id === selectedClipId);
        const brightFx = clip?.effects.find((e) => e.type === "brightness");
        const tempFx = clip?.effects.find((e) => e.type === "temperature");
        const satFx = clip?.effects.find((e) => e.type === "saturation");
        const vibFx = clip?.effects.find((e) => e.type === "vibrance");
        if (brightFx) updateEffectParam(selectedClipId, brightFx.id, "amount", 5);
        if (tempFx) updateEffectParam(selectedClipId, tempFx.id, "amount", 35);
        if (satFx) updateEffectParam(selectedClipId, satFx.id, "amount", 15);
        if (vibFx) updateEffectParam(selectedClipId, vibFx.id, "amount", 20);
        break;
      }
      case "cool": {
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "temperature");
        addEffectToClip(selectedClipId, "contrast");
        const clip = clips.find((c) => c.id === selectedClipId);
        const brightFx = clip?.effects.find((e) => e.type === "brightness");
        const tempFx = clip?.effects.find((e) => e.type === "temperature");
        const satFx = clip?.effects.find((e) => e.type === "saturation");
        const contrastFx = clip?.effects.find((e) => e.type === "contrast");
        if (brightFx) updateEffectParam(selectedClipId, brightFx.id, "amount", 3);
        if (tempFx) updateEffectParam(selectedClipId, tempFx.id, "amount", -40);
        if (satFx) updateEffectParam(selectedClipId, satFx.id, "amount", 10);
        if (contrastFx) updateEffectParam(selectedClipId, contrastFx.id, "amount", 10);
        break;
      }
      case "dramatic": {
        addEffectToClip(selectedClipId, "contrast");
        addEffectToClip(selectedClipId, "saturation");
        addEffectToClip(selectedClipId, "brightness");
        addEffectToClip(selectedClipId, "vibrance");
        addEffectToClip(selectedClipId, "shadows");
        addEffectToClip(selectedClipId, "highlights");
        const clip = clips.find((c) => c.id === selectedClipId);
        const contrastFx = clip?.effects.find((e) => e.type === "contrast");
        const satFx = clip?.effects.find((e) => e.type === "saturation");
        const brightFx = clip?.effects.find((e) => e.type === "brightness");
        const vibFx = clip?.effects.find((e) => e.type === "vibrance");
        const shadowFx = clip?.effects.find((e) => e.type === "shadows");
        const highlightFx = clip?.effects.find((e) => e.type === "highlights");
        if (contrastFx) updateEffectParam(selectedClipId, contrastFx.id, "amount", 35);
        if (satFx) updateEffectParam(selectedClipId, satFx.id, "amount", -15);
        if (brightFx) updateEffectParam(selectedClipId, brightFx.id, "amount", -8);
        if (vibFx) updateEffectParam(selectedClipId, vibFx.id, "amount", 25);
        if (shadowFx) updateEffectParam(selectedClipId, shadowFx.id, "amount", -20);
        if (highlightFx) updateEffectParam(selectedClipId, highlightFx.id, "amount", 15);
        break;
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
