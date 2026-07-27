"use client";

import { useState, useMemo, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import {
  AnimationKeyframe,
  AnimationProperty,
  EasingType,
  EASING_DEFINITIONS,
  ANIMATION_PROPERTIES,
} from "@/types/editor";
import { Plus, Trash2, Diamond, ChevronDown, ChevronRight } from "lucide-react";

function interpolateKeyframes(
  keyframes: AnimationKeyframe[],
  property: AnimationProperty,
  time: number,
): number | undefined {
  const relevant = keyframes.filter((k) => k.property === property).sort((a, b) => a.time - b.time);
  if (relevant.length === 0) return undefined;

  if (time <= relevant[0].time) return relevant[0].value;
  if (time >= relevant[relevant.length - 1].time) return relevant[relevant.length - 1].value;

  for (let i = 0; i < relevant.length - 1; i++) {
    const a = relevant[i];
    const b = relevant[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      return a.value + (b.value - a.value) * t;
    }
  }

  return relevant[relevant.length - 1].value;
}

export function getKeyframeTransforms(
  keyframes: AnimationKeyframe[] | undefined,
  clipDuration: number,
  currentTime: number,
): {
  opacity?: number;
  scale?: number;
  rotation?: number;
  positionX?: number;
  positionY?: number;
} {
  if (!keyframes || keyframes.length === 0) return {};

  const relativeTime = currentTime;
  const transforms: Record<string, number> = {};

  for (const prop of ANIMATION_PROPERTIES) {
    const val = interpolateKeyframes(keyframes, prop.id, relativeTime);
    if (val !== undefined) transforms[prop.id] = val;
  }

  return transforms;
}

export function KeyframeAnimationPanel() {
  const toast = useToast();
  const { clips, selectedClipId, playhead, addAnimationKeyframe, removeAnimationKeyframe, updateAnimationKeyframe } = useEditorStore();
  const [expandedProp, setExpandedProp] = useState<AnimationProperty | null>(null);
  const [defaultEasing, setDefaultEasing] = useState<EasingType>("ease-in-out");

  const clip = clips.find((c) => c.id === selectedClipId);
  const keyframes = clip?.animationKeyframes || [];

  const clipRelativeTime = useMemo(() => {
    if (!clip) return 0;
    return Math.max(0, Math.min(playhead - clip.startTime, clip.duration));
  }, [playhead, clip]);

  const handleAddKeyframe = useCallback((property: AnimationProperty) => {
    if (!clip) {
      toast.error("No clip", "Select a clip first");
      return;
    }
    const propDef = ANIMATION_PROPERTIES.find((p) => p.id === property);
    const existing = keyframes.filter((k) => k.property === property);

    let value: number;
    if (existing.length > 0) {
      const lastVal = existing[existing.length - 1].value;
      value = lastVal;
    } else {
      value = propDef?.default ?? 0;
    }

    addAnimationKeyframe(clip.id, clipRelativeTime, property, value, defaultEasing);
    toast.success("Keyframe added", `${propDef?.label} at ${clipRelativeTime.toFixed(2)}s`);
  }, [clip, clipRelativeTime, keyframes, defaultEasing, addAnimationKeyframe, toast]);

  const handleRemoveKeyframe = useCallback((keyframeId: string) => {
    if (!clip) return;
    removeAnimationKeyframe(clip.id, keyframeId);
  }, [clip, removeAnimationKeyframe]);

  const handleUpdateKeyframe = useCallback((keyframeId: string, updates: Partial<Pick<AnimationKeyframe, "time" | "value" | "easing">>) => {
    if (!clip) return;
    updateAnimationKeyframe(clip.id, keyframeId, updates);
  }, [clip, updateAnimationKeyframe]);

  if (!clip) {
    return (
      <div className="text-center py-6">
        <p className="text-[10px] text-text-tertiary">Select a clip to animate</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Diamond size={12} className="text-neon-pink" />
        <span className="text-[10px] font-medium text-text-primary">Keyframe Animation</span>
      </div>

      {/* Default Easing */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Default Easing</label>
        <div className="relative">
          <select
            value={defaultEasing}
            onChange={(e) => setDefaultEasing(e.target.value as EasingType)}
            className="w-full glass rounded-lg px-2 py-1.5 text-[10px] text-text-primary appearance-none pr-6"
          >
            {EASING_DEFINITIONS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-2">
        {ANIMATION_PROPERTIES.map((prop) => {
          const propKeyframes = keyframes.filter((k) => k.property === prop.id);
          const currentVal = interpolateKeyframes(keyframes, prop.id, clipRelativeTime);
          const isExpanded = expandedProp === prop.id;

          return (
            <div key={prop.id} className="glass rounded-xl overflow-hidden">
              {/* Property Header */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button onClick={() => setExpandedProp(isExpanded ? null : prop.id)}
                  className="flex items-center gap-1.5 flex-1">
                  {isExpanded ? <ChevronDown size={10} className="text-text-tertiary" /> : <ChevronRight size={10} className="text-text-tertiary" />}
                  <span className="text-[9px]">{prop.icon}</span>
                  <span className="text-[10px] text-text-primary font-medium">{prop.label}</span>
                  {propKeyframes.length > 0 && (
                    <span className="size-4 rounded-full bg-neon-pink/20 text-neon-pink text-[8px] font-bold flex items-center justify-center">
                      {propKeyframes.length}
                    </span>
                  )}
                </button>

                {currentVal !== undefined && (
                  <span className="text-[9px] text-neon-cyan font-mono">{currentVal.toFixed(2)}</span>
                )}

                <button onClick={() => handleAddKeyframe(prop.id)}
                  className="size-5 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-neon-pink transition-colors"
                  title="Add keyframe at playhead">
                  <Plus size={10} />
                </button>
              </div>

              {/* Expanded: Keyframe List */}
              {isExpanded && propKeyframes.length > 0 && (
                <div className="px-2 pb-2 space-y-1 border-t border-border-subtle pt-1.5">
                  {propKeyframes.map((kf) => (
                    <div key={kf.id} className="flex items-center gap-1.5 text-[9px]">
                      <span className="w-1 h-1 rounded-full bg-neon-pink shrink-0" />
                      <span className="text-text-tertiary w-14 font-mono">{kf.time.toFixed(2)}s</span>
                      <input
                        type="number"
                        value={kf.value}
                        onChange={(e) => handleUpdateKeyframe(kf.id, { value: parseFloat(e.target.value) || 0 })}
                        className="flex-1 glass rounded px-1.5 py-0.5 text-[9px] text-text-primary border border-border-subtle"
                        step={prop.step}
                      />
                      <select
                        value={kf.easing}
                        onChange={(e) => handleUpdateKeyframe(kf.id, { easing: e.target.value as EasingType })}
                        className="glass rounded px-1 py-0.5 text-[8px] text-text-tertiary border border-border-subtle"
                      >
                        {EASING_DEFINITIONS.map((ed) => (
                          <option key={ed.id} value={ed.id}>{ed.label}</option>
                        ))}
                      </select>
                      <button onClick={() => handleRemoveKeyframe(kf.id)}
                        className="text-text-tertiary hover:text-red-400 transition-colors">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && propKeyframes.length === 0 && (
                <div className="px-2 pb-2 text-center">
                  <p className="text-[8px] text-text-tertiary">No keyframes — click + to add one</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {keyframes.length === 0 && (
        <p className="text-[8px] text-text-tertiary text-center py-2">
          Add keyframes to animate clip properties over time
        </p>
      )}
    </div>
  );
}
