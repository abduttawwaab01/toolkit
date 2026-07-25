"use client";

import { useState } from "react";
import { EFFECT_PRESETS, type EffectPreset } from "@/lib/effects/presets";

interface PresetGridProps {
  onApply: (preset: EffectPreset) => void;
}

export function PresetGrid({ onApply }: PresetGridProps) {
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = (preset: EffectPreset) => {
    setApplyingId(preset.id);
    onApply(preset);
    setTimeout(() => setApplyingId(null), 600);
  };

  return (
    <div>
      <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-3">
        Effect Presets
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {EFFECT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApply(preset)}
            className={`glass rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border ${
              applyingId === preset.id
                ? "border-neon-cyan/50 bg-neon-cyan/10"
                : "border-border-subtle hover:border-neon-cyan/20"
            }`}
          >
            <div className="text-xl mb-1">{preset.icon}</div>
            <div className="text-xs font-medium text-text-primary truncate">{preset.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5 leading-tight line-clamp-2">
              {preset.description}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {preset.effects.slice(0, 3).map((fx, i) => (
                <span
                  key={i}
                  className="text-[8px] px-1 py-0.5 rounded bg-glass-medium text-text-tertiary"
                >
                  {fx.name}
                </span>
              ))}
              {preset.effects.length > 3 && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-glass-medium text-text-tertiary">
                  +{preset.effects.length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
