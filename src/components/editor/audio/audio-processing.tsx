"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { AUDIO_EFFECT_DEFINITIONS, getAudioEffectDefinition } from "@/lib/effects/audio-effects";
import { decodeAudioFile, processVocalIsolation, audioBufferToWav } from "@/lib/audio-engine/index";
import type { AudioEffectType } from "@/types/editor";

export function AudioProcessing() {
  const { selectedTrackId, selectedClipId, tracks, clips, addAudioEffectToTrack, removeAudioEffectFromTrack, updateAudioEffectParam, toggleAudioEffect, addClip, selectClip } = useEditorStore();
  const track = tracks.find((t) => t.id === selectedTrackId);
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
      const audioBuffer = await decodeAudioFile(file);

      setAiProgress(mode === "vocals" ? "Extracting vocals..." : "Extracting music...");

      const processed = await processVocalIsolation(audioBuffer, mode);
      const wavBlob = audioBufferToWav(processed);
      const url = URL.createObjectURL(wavBlob);

      const trackId = state.selectedTrackId || state.tracks.find((t) => t.type === "audio")?.id;
      if (!trackId) { setStatusMsg("No audio track"); setAiProcessing(false); return; }

      const newClipId = addClip({
        trackId,
        type: "audio",
        name: `${clip.name.replace(/\.[^.]+$/, "")} (${mode === "vocals" ? "vocals" : "music"})`,
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
      setStatusMsg(`${mode === "vocals" ? "Vocals" : "Music"} extracted — new clip added to timeline`);
    } catch (err: any) {
      setStatusMsg(`Processing failed: ${err.message}`);
    }

    setAiProcessing(false);
    setAiProgress("");
  }, [addClip, selectClip]);

  const handleAiVocalIsolation = () => handleAiIsolation("vocals");
  const handleAiMusicIsolation = () => handleAiIsolation("music");

  if (!track) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-text-tertiary">Select a track to add audio effects</p>
      </div>
    );
  }

  const availableEffects = AUDIO_EFFECT_DEFINITIONS.filter(
    (def) => !track.audioEffects.some((fx) => fx.type === def.id),
  );

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
        Audio Effects — {track.name}
      </h4>

      {/* Active effects */}
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

      {/* One-click audio tools */}
      {track && (
        <div className="pt-1 space-y-1">
          <label className="text-[9px] text-text-tertiary block mb-1">Quick Tools</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => {
                if (!track.audioEffects.some((fx) => fx.type === "noise-removal")) {
                  addAudioEffectToTrack(track.id, "noise-removal");
                  setStatusMsg("Noise removal added — adjust sliders above");
                } else {
                  const fx = track.audioEffects.find((e) => e.type === "noise-removal");
                  if (fx) toggleAudioEffect(track.id, fx.id);
                }
              }}
              className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors border border-border-subtle"
            >
              🌊 Noise Removal
            </button>
            <button
              onClick={() => {
                if (!track.audioEffects.some((fx) => fx.type === "bg-music-removal")) {
                  addAudioEffectToTrack(track.id, "bg-music-removal");
                  setStatusMsg("Vocal isolation added — adjust sliders above");
                } else {
                  const fx = track.audioEffects.find((e) => e.type === "bg-music-removal");
                  if (fx) toggleAudioEffect(track.id, fx.id);
                }
              }}
              className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors border border-border-subtle"
            >
              🎵 Vocal Isolation
            </button>
            <button
              onClick={() => {
                if (!track.audioEffects.some((fx) => fx.type === "tone-enhancer")) {
                  addAudioEffectToTrack(track.id, "tone-enhancer");
                  setStatusMsg("Tone enhancer added — adjust sliders above");
                } else {
                  const fx = track.audioEffects.find((e) => e.type === "tone-enhancer");
                  if (fx) toggleAudioEffect(track.id, fx.id);
                }
              }}
              className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-colors border border-border-subtle"
            >
              🎛 Tone Enhancer
            </button>
          </div>
          {statusMsg && (
            <p className="text-[9px] text-neon-cyan">{statusMsg}</p>
          )}
        </div>
      )}

      {/* AI-powered vocal isolation */}
      {track && (
        <div className="pt-2 border-t border-border-subtle/50">
          <label className="text-[9px] text-text-tertiary block mb-1">AI Vocal Isolation</label>
          <p className="text-[8px] text-text-tertiary mb-1.5">Process the selected clip with enhanced spectral analysis</p>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={handleAiVocalIsolation}
              disabled={aiProcessing || !selectedClipId}
              className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-neon-cyan hover:bg-neon-cyan/10 transition-colors border border-neon-cyan/30 disabled:opacity-30"
            >
              {aiProcessing ? <>⏳ {aiProgress}</> : <>🗣 Extract Vocals</>}
            </button>
            <button
              onClick={handleAiMusicIsolation}
              disabled={aiProcessing || !selectedClipId}
              className="glass rounded-lg px-2 py-1.5 text-left text-[10px] text-neon-pink hover:bg-neon-pink/10 transition-colors border border-neon-pink/30 disabled:opacity-30"
            >
              {aiProcessing ? <>⏳ {aiProgress}</> : <>🎸 Extract Music</>}
            </button>
          </div>
        </div>
      )}

      {/* Add effect */}
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
    </div>
  );
}
