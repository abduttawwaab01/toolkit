"use client";

import type { EffectParamDefinition } from "@/types/editor";

interface EffectControlProps {
  param: EffectParamDefinition;
  value: number | string | boolean;
  onChange: (value: number | string | boolean) => void;
}

export function EffectControl({ param, value, onChange }: EffectControlProps) {
  switch (param.type) {
    case "number":
      return (
        <div className="flex items-center gap-2 group">
          <input
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-1 accent-neon-cyan cursor-pointer"
          />
          <span className="text-[10px] text-text-tertiary font-mono min-w-[32px] text-right tabular-nums">
            {Number(value).toFixed(param.step !== undefined && param.step < 1 ? 1 : 0)}
          </span>
        </div>
      );

    case "boolean":
      return (
        <button
          onClick={() => onChange(!(value as boolean))}
          className={`relative w-8 h-4 rounded-full transition-colors ${
            value ? "bg-neon-cyan" : "bg-glass-medium"
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
              value ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      );

    case "select":
      return (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full glass rounded-lg px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
        >
          {param.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}
