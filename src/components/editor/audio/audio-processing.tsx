"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { AUDIO_EFFECT_DEFINITIONS, getAudioEffectDefinition } from "@/lib/effects/audio-effects";
import { decodeAudioFile, processVocalIsolation, audioBufferToWav } from "@/lib/audio-engine/index";
import { separateAudio } from "@/lib/audio-engine/demucs-client";
import { DenoisePanel } from "./denoise-panel";
import type { AudioEffectType } from "@/types/editor";

type Tab = "effects" | "denoise" | "vocal";

export function AudioProcessing() {
  const { selectedTrackId, selectedClipId, tracks, clips, addAudioEffectToTrack, removeAudioEffectFromTrack, updateAudioEffectParam, toggleAudioEffect, addClip, selectClip } = useEditorStore();
  const track = tracks.find((t) => t.id === selectedTrackId);
  const [tab, setTab] = useState<Tab>("effects");
  const [statusMsg, setStatusMsg] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState("");

  const handleAiIsolation = useCallback(async (mode: "vocals" | "music") => {
    const state = useEditorStore.getState();
    const clipId = state.selectedClipId;
    const clip = state.clips.find((c) => c.id === clipId);
    if (!clip || !clip.src) { setStatusMsg("No clip selected"); return; }

    setAiProcessing(true);
    setAiProgress("Loading audio...");

    try {
      const response = await fetch(clip.src);
      const blob = await response.blob();
      const file = new File([blob], clip.name || "audio.wav", { type: blob.type || "audio/wav" });

      let processed: AudioBuffer;
      let engineLabel = "";

      try {
        setAiProgress("AI Demucs model processing...");
        const result = await separateAudio(file, mode, (e) => {
          setAiProgress(`${e.message} (${Math.round(e.progress * 100)}%)`);
        });

        const stemKey = mode === "vocals" ? "vocals" : "other";
        const stemUrl = result.stemUrls[stemKey];
        if (!stemUrl) throw new Error(`No ${stemKey} stem returned`);

        const stemResponse = await fetch(stemUrl);
        const stemBlob = await stemResponse.blob();
        processed = await decodeAudioFile(new File([stemBlob], "stem.wav"));
        engineLabel = " (AI Demucs)";
      } catch {
        setAiProgress("Fallback: DSP processing...");
        processed = await processVocalIsolation(await decodeAudioFile(file), mode);
        engineLabel = " (DSP)";
      }

      const wavBlob = audioBufferToWav(processed);
      const url = URL.createObjectURL(wavBlob);

      const trackId = state.selectedTrackId || state.tracks.find((t) => t.type === "audio")?.id;
      if (!trackId) { setStatusMsg("No audio track"); setAiProcessing(false); return; }

      const newClipId = addClip({
        trackId,
        type: "audio",
        name: `${clip.name.replace(/\.[^.]+$/, "")} (${mode === "vocals" ? "vocals" : "music"})${engineLabel}`,
        src: url,
        thumbnail: null,
        startTime: clip.startTime,
        duration: Math.min(processed.duration, clip.duration),
        trimStart: 0, trimEnd: 0,
        speed: 1, volume: 1,
        volumeKeyframes: [],
        effects: [],
        opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
      });

      selectClip(newClipId);
      setStatusMsg(`${mode === "vocals" ? "Vocals" : "Music"} extracted${engineLabel} — new clip added`);
    } catch (err: any) {
      setStatusMsg(`Failed: ${err.message}`);
    }

    setAiProcessing(false);
    setAiProgress("");
  }, [addClip, selectClip]);

  if (!track) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-text-tertiary">Select a track to edit audio</p>
      </div>
    );
  }

  const availableEffects = AUDIO_EFFECT_DEFINITIONS.filter(
    (def) => !track.audioEffects.some((fx) => fx.type === def.id),
  );

  return (
    <div className="space-y-2">
      {/* Tab bar */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab("effects")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
            tab === "effects" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}
        >
          Effects
        </button>
        <button
          onClick={() => setTab("denoise")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
            tab === "denoise" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}
        >
          Denoise
        </button>
        <button
          onClick={() => setTab("vocal")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
            tab === "vocal" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}
        >
          Vocal Split
        </button>
      </div>

      {/* Effects tab */}
      {tab === "effects" && (
        <div className="space-y-2">
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
            Audio Effects — {track.name}
          </h4>

          {track.audioEffects.length === 0 && (
            <p className="text-[11px] text-text-tertiary">No effects on this track</p>
          )}

          {track.audioEffects.map((fx) => {
            const def = getAudioEffectDefinition(fx.type);
            if (!def) return null;
            return (
              <div
                key={fx.id}
                className={`glass rounded-lg border transition-all ${
                  fx.enabled ? "border-border-subtle" : "border-border-subtle/30 opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <button
                    onClick={() => toggleAudioEffect(track.id, fx.id)}
                    className={`text-[9px] px-1 py-0.5 rounded ${
                      fx.enabled ? "bg-neon-cyan/20 text-neon-cyan" : "bg-glass-medium text-text-tertiary"
                    }`}
                  >
                    {fx.enabled ? "ON" : "OFF"}
                  </button>
                  <span className="text-[10px] text-sm">{def.icon}</span>
                  <span className="text-xs font-medium text-text-primary flex-1 truncate">{def.name}</span>
                  <button
                    onClick={() => removeAudioEffectFromTrack(track.id, fx.id)}
                    className="text-text-tertiary hover:text-neon-pink text-[10px] px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="px-2.5 pb-2 space-y-1.5">
                  {def.params.map((param) => (
                    <div key={param.key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] text-text-tertiary">{param.label}</label>
                        <span className="text-[9px] text-text-primary font-mono tabular-nums">
                          {fx.params[param.key]?.toFixed(param.step < 1 ? 2 : param.step < 10 ? 1 : 0)}
                          {param.unit || ""}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={fx.params[param.key] ?? param.default}
                        onChange={(e) => updateAudioEffectParam(track.id, fx.id, param.key, Number(e.target.value))}
                        className="w-full h-1 accent-neon-cyan cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {availableEffects.length > 0 && (
            <div className="pt-1">
              <label className="text-[9px] text-text-tertiary block mb-1">Add Effect</label>
              <div className="grid grid-cols-2 gap-1">
                {availableEffects.map((def) => (
                  <button
                    key={def.id}
                    onClick={() => addAudioEffectToTrack(track.id, def.id)}
                    className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors border border-border-subtle"
                  >
                    <span className="mr-1">{def.icon}</span>
                    {def.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {statusMsg && (
            <p className="text-[9px] text-neon-cyan">{statusMsg}</p>
          )}
        </div>
      )}

      {/* Denoise tab */}
      {tab === "denoise" && <DenoisePanel />}

      {/* Vocal Split tab */}
      {tab === "vocal" && (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-medium text-text-primary">AI Vocal Isolation</p>
            <p className="text-[8px] text-text-tertiary leading-relaxed mt-0.5">
              Uses Demucs ML model to cleanly separate vocals from instruments. Select a clip on the timeline first, then choose what to extract.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleAiIsolation("vocals")}
              disabled={aiProcessing || !selectedClipId}
              className="glass rounded-lg px-2.5 py-2 text-left text-[10px] text-neon-cyan hover:bg-neon-cyan/10 transition-colors border border-neon-cyan/30 disabled:opacity-30"
            >
              {aiProcessing ? (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full border border-neon-cyan border-t-transparent animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  <span className="block font-medium">Extract Vocals</span>
                  <span className="block text-[7px] text-text-tertiary mt-0.5">Isolate singing voice</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleAiIsolation("music")}
              disabled={aiProcessing || !selectedClipId}
              className="glass rounded-lg px-2.5 py-2 text-left text-[10px] text-neon-pink hover:bg-neon-pink/10 transition-colors border border-neon-pink/30 disabled:opacity-30"
            >
              {aiProcessing ? (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full border border-neon-pink border-t-transparent animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  <span className="block font-medium">Extract Music</span>
                  <span className="block text-[7px] text-text-tertiary mt-0.5">Remove vocals, keep instruments</span>
                </>
              )}
            </button>
          </div>

          {aiProgress && (
            <div className="glass rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] text-neon-cyan">{aiProgress}</p>
            </div>
          )}

          {statusMsg && (
            <p className="text-[9px] text-neon-cyan">{statusMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
