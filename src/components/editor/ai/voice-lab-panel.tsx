"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Plus, Volume2, Sparkles } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";
import { uuid } from "@/lib/utils";

const VOICE_PRESETS = [
  { id: "chipmunk", name: "Chipmunk", pitch: 8, formant: 3, distortion: 0, chorus: 0, robot: 0 },
  { id: "deep", name: "Deep Voice", pitch: -6, formant: -3, distortion: 0.1, chorus: 0, robot: 0 },
  { id: "robot", name: "Robot", pitch: 0, formant: 0, distortion: 0.3, chorus: 0, robot: 0.5 },
  { id: "chorus", name: "Chorus", pitch: 0, formant: 0, distortion: 0, chorus: 0.6, robot: 0 },
  { id: "alien", name: "Alien", pitch: 4, formant: 5, distortion: 0.2, chorus: 0.3, robot: 0.1 },
  { id: "monster", name: "Monster", pitch: -10, formant: -4, distortion: 0.5, chorus: 0, robot: 0.3 },
  { id: "helium", name: "Helium", pitch: 12, formant: 4, distortion: 0, chorus: 0, robot: 0 },
  { id: "underwater", name: "Underwater", pitch: -4, formant: -2, distortion: 0, chorus: 0.2, robot: 0 },
];

export function VoiceLabPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(VOICE_PRESETS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addClip = useEditorStore((s) => s.addClip);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // Microphone access denied
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const playPreview = useCallback(() => {
    if (!recordedAudio) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(recordedAudio);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }, [recordedAudio]);

  const addToTimeline = useCallback(() => {
    if (!recordedAudio) return;
    const audioTrack = tracks.find((t) => t.type === "audio");
    if (!audioTrack) return;
    pushHistory();
    addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: `Voice - ${VOICE_PRESETS.find((p) => p.id === selectedPreset)?.name || "Normal"}`,
      src: recordedAudio,
      thumbnail: null,
      volumeKeyframes: [],
      startTime: playhead,
      duration: 10,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      volume: 1,
      effects: [],
      opacity: 1,
      scale: 1,
      rotation: 0,
      positionX: 0,
      positionY: 0,
    });
  }, [recordedAudio, tracks, playhead, addClip, pushHistory, selectedPreset]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-medium text-text-primary">Voice Lab</span>
      </div>

      <div className="flex gap-1.5">
        {!isRecording ? (
          <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] hover:bg-red-500/30 transition-all">
            <Mic size={12} /> Record
          </button>
        ) : (
          <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/40 text-red-300 text-[10px] hover:bg-red-500/50 transition-all animate-pulse">
            <Square size={12} /> Stop
          </button>
        )}
      </div>

      {recordedAudio && (
        <>
          <div className="flex flex-wrap gap-1">
            {VOICE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`px-2 py-1 rounded-lg text-[9px] transition-all ${
                  selectedPreset === preset.id
                    ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                    : "glass text-text-secondary hover:text-text-primary border border-border-subtle"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <button onClick={playPreview} className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-text-secondary text-[10px] hover:text-text-primary transition-all">
              {isPlaying ? <Volume2 size={12} /> : <Play size={12} />} Preview
            </button>
            <button onClick={addToTimeline} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[10px] hover:bg-neon-cyan/30 transition-all">
              <Plus size={12} /> Add to Timeline
            </button>
          </div>
        </>
      )}

      {!recordedAudio && !isRecording && (
        <p className="text-[9px] text-text-tertiary">Record audio and apply voice effects before adding to your project.</p>
      )}
    </div>
  );
}
