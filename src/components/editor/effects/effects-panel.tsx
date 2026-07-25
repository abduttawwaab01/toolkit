"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { EFFECT_DEFINITIONS, getEffectsByCategory, cssFilterFromEffects } from "@/lib/effects/index";
import type { EffectDefinition } from "@/types/editor";
import { EffectItem } from "./effect-item";
import { PresetGrid } from "./preset-grid";
import { TransitionPicker } from "./transition-picker";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "color", label: "Color" },
  { id: "filter", label: "Filters" },
  { id: "blur", label: "Blur" },
  { id: "transform", label: "Transform" },
  { id: "presets", label: "Presets" },
  { id: "transitions", label: "Transitions" },
];

export function EffectsPanel() {
  const { selectedClipId, clips, addEffectToClip, removeEffectFromClip, updateEffectParam, toggleEffect } = useEditorStore();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const clip = clips.find((c) => c.id === selectedClipId);

  const filteredEffects: EffectDefinition[] =
    category === "all"
      ? EFFECT_DEFINITIONS
      : getEffectsByCategory(category);

  const searched = search.trim()
    ? filteredEffects.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()),
      )
    : filteredEffects;

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="px-3 pt-2 pb-1 flex gap-1 flex-wrap shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              category === cat.id
                ? "bg-neon-cyan/15 text-neon-cyan"
                : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Presets tab */}
      {category === "presets" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <PresetGrid
            onApply={(preset) => {
              if (!clip) return;
              for (const fx of preset.effects) {
                addEffectToClip(clip.id, fx.type);
              }
            }}
          />
        </div>
      )}

      {/* Transitions tab */}
      {category === "transitions" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <TransitionPicker />
        </div>
      )}

      {/* Effects browser + Active effects */}
      {category !== "presets" && category !== "transitions" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {/* Active effects on selected clip */}
          {clip && clip.effects.length > 0 && (
            <div>
              <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                Active Effects
              </h4>
              <div className="space-y-1.5">
                {clip.effects.map((fx) => (
                  <EffectItem
                    key={fx.id}
                    effect={fx}
                    onUpdateParam={(key, value) => updateEffectParam(clip.id, fx.id, key, value)}
                    onToggle={() => toggleEffect(clip.id, fx.id)}
                    onRemove={() => removeEffectFromClip(clip.id, fx.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CSS filter preview */}
          {clip && clip.effects.length > 0 && (
            <div className="glass rounded-lg px-2.5 py-2">
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Filter CSS</label>
              <code className="block text-[9px] text-neon-cyan font-mono mt-1 break-all leading-tight opacity-70">
                {cssFilterFromEffects(clip.effects)}
              </code>
            </div>
          )}

          {/* No clip selected */}
          {!clip && (
            <div className="text-center py-8">
              <p className="text-xs text-text-tertiary">Select a clip to edit effects</p>
            </div>
          )}

          {/* Effect browser */}
          {clip && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
                  Add Effect
                </h4>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search effects..."
                  className="flex-1 glass rounded-lg px-2 py-1 text-[10px] text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-neon-cyan/30"
                />
              </div>
              <div className="space-y-1">
                {searched.map((def) => (
                  <button
                    key={def.id}
                    onClick={() => addEffectToClip(clip.id, def.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors text-left"
                  >
                    <span className="text-sm">{def.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{def.name}</div>
                      <div className="text-[10px] text-text-tertiary truncate">{def.description}</div>
                    </div>
                    <div className="flex gap-0.5">
                      {def.params.map((p) => (
                        <span
                          key={p.key}
                          className="text-[9px] px-1 py-0.5 rounded bg-glass-medium text-text-tertiary"
                        >
                          {p.type === "number" ? `${p.min}-${p.max}` : p.type === "boolean" ? "on/off" : "sel"}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
                {searched.length === 0 && (
                  <p className="text-[11px] text-text-tertiary text-center py-4">No effects found</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
