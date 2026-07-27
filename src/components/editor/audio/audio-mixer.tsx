"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { AudioVolumeFader } from "./audio-volume-fader";
import { AudioEqualizer } from "./audio-equalizer";
import { AudioProcessing } from "./audio-processing";
import { AudioEffectsRack } from "./audio-effects-rack";
import { SoundEffectsPanel } from "./sound-effects-panel";
import { BackgroundMusicPanel } from "./background-music-panel";
import { StemSeparationPanel } from "./stem-separation-panel";

export function AudioMixer() {
  const {
    tracks,
    selectedTrackId,
    selectTrack,
    masterVolume,
    setMasterVolume,
    setTrackVolume,
    setTrackEqBands,
    setTrackPan,
    updateTrack,
  } = useEditorStore();
  const [tab, setTab] = useState<"mixer" | "eq" | "effects" | "studio" | "sfx" | "bgm" | "stems">("mixer");
  const [masterDragging, setMasterDragging] = useState(false);

  const audioTracks = tracks.filter((t) => t.type === "audio");
  const allTracks = tracks;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
        <button
          onClick={() => setTab("mixer")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "mixer" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Mixer
        </button>
        <button
          onClick={() => setTab("eq")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "eq" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          EQ
        </button>
        <button
          onClick={() => setTab("effects")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "effects" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Effects
        </button>
        <button
          onClick={() => setTab("studio")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "studio" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setTab("sfx")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "sfx" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          SFX
        </button>
        <button
          onClick={() => setTab("bgm")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "bgm" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          BGM
        </button>
        <button
          onClick={() => setTab("stems")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "stems" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Stems
        </button>
      </div>

      {/* Mixer tab */}
      {tab === "mixer" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {/* Track faders */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {allTracks.map((track) => (
              <div
                key={track.id}
                className={`flex flex-col items-center glass rounded-xl p-1.5 cursor-pointer transition-all shrink-0 ${
                  selectedTrackId === track.id ? "ring-1 ring-neon-cyan" : ""
                }`}
                onClick={() => selectTrack(track.id)}
              >
                <AudioVolumeFader
                  label={track.name}
                  volume={track.volume}
                  muted={track.muted}
                  solo={track.solo}
                  color={track.color}
                  showSolo
                  onChange={(v) => setTrackVolume(track.id, v)}
                  onMuteToggle={() => updateTrack(track.id, { muted: !track.muted })}
                  onSoloToggle={() => {
                    const store = useEditorStore.getState();
                    store.setTrackSolo(track.id, !track.solo);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Master fader */}
          <div className="glass rounded-xl p-3 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <AudioVolumeFader
                  label="Master"
                  volume={masterVolume}
                  muted={false}
                  color="#4facfe"
                  onChange={(v) => setMasterVolume(v)}
                  onMuteToggle={() => {}}
                />
              </div>

              {/* Level meter visualization */}
              <div className="flex-1">
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
                  Output Level
                </label>
                <div className="glass rounded-lg h-6 overflow-hidden flex items-center px-2">
                  <div className="flex-1 h-2 rounded-full bg-glass-medium overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (masterVolume / 2) * 100)}%`,
                        background: masterVolume > 1.5
                          ? "linear-gradient(90deg, #00f5d4, #ff4d6a)"
                          : "linear-gradient(90deg, #00f5d4, #4facfe)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary ml-2 tabular-nums w-12 text-right">
                    {masterVolume === 0 ? "−∞" : `${(20 * Math.log10(masterVolume)).toFixed(1)} dB`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EQ tab */}
      {tab === "eq" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {selectedTrackId ? (
            <AudioEqualizer
              initialBands={tracks.find((t) => t.id === selectedTrackId)?.eqBands}
              onChange={(bands) => {
                setTrackEqBands(selectedTrackId, bands);
              }}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-text-tertiary">Select a track to adjust EQ</p>
            </div>
          )}
          <div className="mt-2 text-[9px] text-text-tertiary leading-relaxed px-1">
            Drag band handles to adjust frequency levels. The equalizer applies to the selected track's audio output.
          </div>
        </div>
      )}

      {/* Effects tab */}
      {tab === "effects" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <AudioProcessing />
        </div>
      )}

      {/* Studio tab */}
      {tab === "studio" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <AudioEffectsRack />
        </div>
      )}

      {/* SFX tab */}
      {tab === "sfx" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <SoundEffectsPanel />
        </div>
      )}

      {/* BGM tab */}
      {tab === "bgm" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <BackgroundMusicPanel />
        </div>
      )}

      {/* Stems tab */}
      {tab === "stems" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <StemSeparationPanel />
        </div>
      )}
    </div>
  );
}
