"use client";

import { useState, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { TRANSITION_DEFINITIONS } from "@/lib/effects/transitions";
import type { TransitionType, Transition } from "@/types/editor";

export function TransitionPicker() {
  const { clips, tracks, transitions, addTransition, removeTransition, updateTransition } = useEditorStore();
  const [selectedPair, setSelectedPair] = useState<string>("");

  // Find adjacent clip pairs on the same track
  const clipPairs = useMemo(() => {
    const pairs: { clipInId: string; clipInName: string; clipOutId: string; clipOutName: string; trackId: string; trackName: string }[] = [];
    for (const track of tracks) {
      const trackClips = clips
        .filter((c) => c.trackId === track.id)
        .sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < trackClips.length - 1; i++) {
        const inClip = trackClips[i];
        const outClip = trackClips[i + 1];
        if (inClip.startTime + inClip.duration >= outClip.startTime) {
          pairs.push({
            clipInId: inClip.id,
            clipInName: inClip.name,
            clipOutId: outClip.id,
            clipOutName: outClip.name,
            trackId: track.id,
            trackName: track.name,
          });
        }
      }
    }
    return pairs;
  }, [clips, tracks]);

  const existingTransition = selectedPair
    ? transitions.find(
        (t) =>
          t.clipInId === clipPairs.find((p) => `${p.clipInId}-${p.clipOutId}` === selectedPair)?.clipInId &&
          t.clipOutId === clipPairs.find((p) => `${p.clipInId}-${p.clipOutId}` === selectedPair)?.clipOutId,
      )
    : undefined;

  const handleAddTransition = (type: TransitionType) => {
    const pair = clipPairs.find((p) => `${p.clipInId}-${p.clipOutId}` === selectedPair);
    if (!pair) return;
    addTransition(pair.clipInId, pair.clipOutId, pair.trackId, type);
  };

  const handleRemoveTransition = () => {
    if (existingTransition) {
      removeTransition(existingTransition.id);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
        Transitions
      </h4>

      {/* Clip pair selector */}
      <div>
        <label className="text-[10px] text-text-tertiary mb-1 block">Between Clips</label>
        {clipPairs.length === 0 ? (
          <p className="text-[11px] text-text-tertiary">No overlapping clips to transition between</p>
        ) : (
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-neon-cyan/30"
          >
            <option value="">Select clip pair...</option>
            {clipPairs.map((pair) => (
              <option key={`${pair.clipInId}-${pair.clipOutId}`} value={`${pair.clipInId}-${pair.clipOutId}`}>
                {pair.clipInName} → {pair.clipOutName} ({pair.trackName})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Existing transition info */}
      {existingTransition && (
        <div className="glass rounded-lg px-3 py-2 border border-neon-cyan/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neon-cyan">
              {TRANSITION_DEFINITIONS.find((t) => t.id === existingTransition.type)?.name ?? existingTransition.type}
            </span>
            <button onClick={handleRemoveTransition} className="text-[10px] text-neon-pink hover:underline">
              Remove
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary">Duration:</span>
            <input
              type="number"
              min={0.1}
              max={2}
              step={0.1}
              value={existingTransition.duration}
              onChange={(e) => updateTransition(existingTransition.id, { duration: Number(e.target.value) })}
              className="w-16 glass rounded px-2 py-0.5 text-[11px] text-text-primary font-mono focus:outline-none"
            />
            <span className="text-[10px] text-text-tertiary">s</span>
          </div>
        </div>
      )}

      {/* Transition type grid */}
      {selectedPair && (
        <div>
          <label className="text-[10px] text-text-tertiary mb-1.5 block">Select Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {TRANSITION_DEFINITIONS.map((def) => {
              const isActive = existingTransition?.type === def.id;
              return (
                <button
                  key={def.id}
                  onClick={() => {
                    if (existingTransition) {
                      updateTransition(existingTransition.id, { type: def.id });
                    } else {
                      handleAddTransition(def.id);
                    }
                  }}
                  className={`glass rounded-lg p-2 text-center transition-all border ${
                    isActive
                      ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                      : "border-border-subtle text-text-secondary hover:text-text-primary hover:bg-glass-medium"
                  }`}
                >
                  <div className="text-lg">{def.icon}</div>
                  <div className="text-[9px] font-medium mt-0.5 leading-tight">{def.name}</div>
                  <div className="text-[8px] text-text-tertiary mt-0.5">{def.defaultDuration}s</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
