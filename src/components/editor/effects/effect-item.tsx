"use client";

import { useState } from "react";
import type { Effect } from "@/types/editor";
import { getEffectDefinition } from "@/lib/effects/index";
import { EffectControl } from "./effect-controls";

interface EffectItemProps {
  effect: Effect;
  onUpdateParam: (key: string, value: number | string | boolean) => void;
  onToggle: () => void;
  onRemove: () => void;
}

export function EffectItem({ effect, onUpdateParam, onToggle, onRemove }: EffectItemProps) {
  const [expanded, setExpanded] = useState(true);
  const def = getEffectDefinition(effect.type);

  if (!def) return null;

  return (
    <div
      className={`glass rounded-lg border transition-all ${
        effect.enabled ? "border-border-subtle" : "border-border-subtle/30 opacity-50"
      }`}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button
          onClick={onToggle}
          className={`text-xs px-1 py-0.5 rounded ${
            effect.enabled ? "bg-neon-cyan/20 text-neon-cyan" : "bg-glass-medium text-text-tertiary"
          }`}
        >
          {effect.enabled ? "ON" : "OFF"}
        </button>
        <span className="text-xs font-medium text-text-primary flex-1 truncate">{def.name}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-tertiary hover:text-text-primary text-xs px-1"
        >
          {expanded ? "▲" : "▼"}
        </button>
        <button
          onClick={onRemove}
          className="text-text-tertiary hover:text-neon-pink text-xs px-1"
        >
          ✕
        </button>
      </div>

      {expanded && (
        <div className="px-2.5 pb-2 space-y-1.5">
          {def.params.map((param) => (
            <div key={param.key}>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-text-tertiary">{param.label}</label>
              </div>
              <EffectControl
                param={param}
                value={effect.params[param.key] ?? param.default}
                onChange={(v) => onUpdateParam(param.key, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
