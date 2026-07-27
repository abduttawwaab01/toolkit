"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { generateSpeech, listTTSVoices, playAudioFromDataUri } from "@/lib/ai/text-to-speech";
import { Volume2, Play, Plus, Settings2 } from "lucide-react";

export function TextToSpeechPanel() {
  const toast = useToast();
  const { clips, selectedClipId, addClip } = useEditorStore();
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<{ voice_id: string; name: string; category: string; labels: Record<string, string>; preview_url?: string }[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resultAudio, setResultAudio] = useState<string | null>(null);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    listTTSVoices().then((v) => {
      setVoices(v);
      if (v.length > 0 && !voiceId) setVoiceId(v[0].voice_id);
      setLoadingVoices(false);
    }).catch(() => setLoadingVoices(false));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) { toast.error("Text required", "Enter text to convert to speech"); return; }
    if (!voiceId) { toast.error("Voice required", "Select a voice first"); return; }

    setProcessing(true);
    setResultAudio(null);
    try {
      const result = await generateSpeech({
        text: text.trim(),
        voiceId,
        stability,
        similarityBoost,
      });
      setResultAudio(result.audio);
      toast.success("Speech generated", `${result.characterCount} characters synthesized`);
    } catch (error: any) {
      toast.error("TTS failed", error.message || "Could not generate speech");
    } finally {
      setProcessing(false);
    }
  }, [text, voiceId, stability, similarityBoost, toast]);

  const handlePreviewVoice = useCallback(async (url: string) => {
    try {
      const audio = new Audio(url);
      await audio.play();
    } catch {
      toast.error("Preview failed", "Could not play voice preview");
    }
  }, [toast]);

  const handleAddToTimeline = useCallback(() => {
    if (!resultAudio) return;
    const store = useEditorStore.getState();
    const audioTrack = store.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      toast.error("No audio track", "Add an audio track first");
      return;
    }
    store.addClip({
      trackId: audioTrack.id,
      type: "audio",
      name: `TTS - ${text.slice(0, 30)}...`,
      src: resultAudio,
      thumbnail: null,
      startTime: store.playhead,
      duration: 5,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1,
      scale: 1,
      rotation: 0,
      positionX: 0,
      positionY: 0,
    });
    toast.success("Added", "TTS audio added to timeline");
  }, [resultAudio, text, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Volume2 size={12} className="text-neon-green" />
        <span className="text-[10px] font-medium text-text-primary">Text to Speech</span>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        Convert text to natural-sounding speech using ElevenLabs AI voices.
      </p>

      {/* Voice Selector */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Voice</label>
        {loadingVoices ? (
          <div className="glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-tertiary animate-pulse">Loading voices...</div>
        ) : (
          <div className="relative">
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}
              className="w-full glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary appearance-none pr-8">
              {voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name} {v.labels?.accent ? `(${v.labels.accent})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preview Voice */}
      {voices.length > 0 && voiceId && (
        <div className="flex items-center gap-2">
          {(() => {
            const v = voices.find((v) => v.voice_id === voiceId);
            if (!v?.preview_url) return null;
            return (
              <button onClick={() => handlePreviewVoice(v.preview_url!)}
                className="flex items-center gap-1 px-2 py-1 glass rounded-lg text-[9px] text-text-secondary hover:text-text-primary transition-colors">
                <Play size={9} /> Preview Voice
              </button>
            );
          })()}
        </div>
      )}

      {/* Text Input */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Text ({text.length}/5000)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 5000))}
          placeholder="Enter text to convert to speech..."
          rows={4}
          className="w-full glass rounded-lg px-2.5 py-2 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50 resize-none" />
      </div>

      {/* Advanced Settings */}
      <div>
        <button onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 text-[9px] text-text-tertiary hover:text-text-primary transition-colors">
          <Settings2 size={10} /> Advanced Settings
        </button>
        {showSettings && (
          <div className="mt-2 space-y-2 glass rounded-lg p-2.5">
            <div>
              <label className="text-[9px] text-text-tertiary">Stability: {stability.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.05} value={stability}
                onChange={(e) => setStability(parseFloat(e.target.value))}
                className="w-full accent-neon-green h-1 mt-1" />
            </div>
            <div>
              <label className="text-[9px] text-text-tertiary">Similarity Boost: {similarityBoost.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.05} value={similarityBoost}
                onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                className="w-full accent-neon-green h-1 mt-1" />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={processing || !text.trim() || !voiceId}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50">
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-green border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-green">Generating...</span>
          </>
        ) : (
          <>
            <Volume2 size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary font-medium">Generate Speech</span>
          </>
        )}
      </button>

      {/* Result */}
      {resultAudio && (
        <div className="space-y-2">
          <audio src={resultAudio} controls className="w-full h-8" />
          <button onClick={handleAddToTimeline}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-green/20 text-neon-green text-[10px] font-semibold hover:bg-neon-green/30 transition-all active:scale-[0.98]">
            <Plus size={11} /> Add to Timeline
          </button>
        </div>
      )}
    </div>
  );
}
