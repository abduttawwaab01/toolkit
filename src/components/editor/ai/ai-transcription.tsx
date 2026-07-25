"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  isTTSSupported,
  speakText,
  stopSpeaking,
  getAvailableVoices,
} from "@/lib/ai/index";
import type { SpeechRecognitionLanguage, SpeechRecognitionResult } from "@/lib/ai/index";
import type { Subtitle } from "@/types/editor";
import { Mic, Square, Play, StopCircle, Volume2, Download, Upload } from "lucide-react";

const LANGUAGES: { code: SpeechRecognitionLanguage; name: string }[] = [
  { code: "en", name: "English" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-BR", name: "Portuguese (BR)" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
];

export function AITranscription({ clip }: { clip: any }) {
  const { clips, updateClip, addClip } = useEditorStore();
  const [language, setLanguage] = useState<SpeechRecognitionLanguage>("en");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [status, setStatus] = useState("");
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);

  const supported = isSpeechRecognitionSupported();
  const ttsSupported = isTTSSupported();

  useEffect(() => {
    if (ttsSupported) {
      getAvailableVoices().then(setTtsVoices);
    }
  }, [ttsSupported]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setStatus("Speech recognition not supported in this browser. Try Chrome or Edge.");
      return;
    }

    setStatus("Listening... Speak now");
    setInterimText("");
    setFinalText("");

    const recognizer = createSpeechRecognizer(language, {
      continuous: true,
      interimResults: true,
      onResult: (result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          setFinalText((prev) => prev + " " + result.text);
        } else {
          setInterimText(result.text);
        }
      },
      onError: (error) => {
        setStatus(`Error: ${error}`);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
        setStatus(isListening ? "Listening stopped" : "");
      },
    });

    recognizer.start();
    recognizerRef.current = recognizer;
    setIsListening(true);
  }, [language, supported]);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    setIsListening(false);
    setStatus("Transcription stopped");
  }, []);

  const addTranscriptionToClip = () => {
    if (!finalText.trim() && !interimText.trim()) return;

    const text = (finalText + " " + interimText).trim();
    const words = text.split(/\s+/);
    const subtitles: Subtitle[] = words.map((word, i) => ({
      id: crypto.randomUUID(),
      index: i + 1,
      start: i * 0.4,
      end: (i + 1) * 0.4,
      text: word,
    }));

    if (clip) {
      updateClip(clip.id, {
        subtitles: [...(clip.subtitles || []), ...subtitles].sort((a, b) => a.start - b.start),
        type: "text",
      });
    } else {
      const vidTrack = useEditorStore.getState().tracks.find((t) => t.type === "text")
        || useEditorStore.getState().tracks[0];
      const textTrack = useEditorStore.getState().tracks.find((t) => t.type === "text");
      if (textTrack) {
        addClip({
          trackId: textTrack.id,
          type: "text",
          name: "Live Captions",
          src: null,
          thumbnail: null,
          startTime: 0,
          duration: subtitles.length * 0.4,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          volume: 1,
          volumeKeyframes: [],
          effects: [],
          subtitles,
          textStyle: {
            fontFamily: "Inter",
            fontSize: 28,
            color: "#ffffff",
            alignment: "center",
            bold: false,
            italic: false,
            underline: false,
            uppercase: false,
            lineHeight: 1.4,
            letterSpacing: 0,
            background: "rgba(0,0,0,0.6)",
            backgroundOpacity: 0.6,
            strokeColor: "#000000",
            strokeWidth: 0,
            shadowColor: "#000000",
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            paddingX: 12,
            paddingY: 6,
            borderRadius: 4,
          },
          textAnimation: { type: "fade", duration: 0.3, delay: 0, stagger: 0 },
          opacity: 1,
          scale: 1,
          rotation: 0,
          positionX: 0,
          positionY: -100,
        });
      }
    }

    setStatus(`✅ ${subtitles.length} caption words added`);
  };

  const handleTTS = async () => {
    const text = (finalText || interimText).trim();
    if (!text) {
      setStatus("No text to speak");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      setStatus("");
      return;
    }

    setIsSpeaking(true);
    setStatus("Speaking...");
    try {
      await speakText(text, {
        voice: selectedVoice || undefined,
        rate: 1,
        pitch: 1,
      });
    } catch (err: any) {
      setStatus(`TTS error: ${err.message}`);
    }
    setIsSpeaking(false);
    setStatus("");
  };

  return (
    <div className="space-y-3">
      {/* Live Transcription */}
      <div className="glass rounded-xl p-3 space-y-2">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Mic size={12} /> Live Transcription
        </h4>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SpeechRecognitionLanguage)}
            className="flex-1 glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!supported}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              isListening
                ? "bg-neon-pink/20 text-neon-pink animate-pulse"
                : "glass text-text-primary hover:bg-glass-medium"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {isListening ? <Square size={12} /> : <Mic size={12} />}
            {isListening ? "Stop" : "Record"}
          </button>
        </div>

        {!supported && (
          <p className="text-[9px] text-neon-pink">
            Speech recognition not supported. Use Chrome, Edge, or Safari.
          </p>
        )}

        {/* Transcription output */}
        <div className="glass rounded-lg p-2 min-h-[60px] max-h-[120px] overflow-y-auto">
          <p className="text-[11px] text-text-primary whitespace-pre-wrap">
            {finalText}
            <span className="text-text-tertiary">{interimText}</span>
          </p>
          {!finalText && !interimText && (
            <p className="text-[10px] text-text-tertiary">Press Record and start speaking...</p>
          )}
        </div>

        {/* Action buttons */}
        {(finalText || interimText) && (
          <div className="flex gap-1.5">
            <button
              onClick={addTranscriptionToClip}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[10px] font-medium hover:bg-neon-cyan/30 transition-all"
            >
              <Download size={11} /> Add to Timeline
            </button>
            {ttsSupported && (
              <button
                onClick={handleTTS}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  isSpeaking
                    ? "bg-neon-pink/20 text-neon-pink"
                    : "glass text-text-primary hover:bg-glass-medium"
                }`}
              >
                {isSpeaking ? <StopCircle size={11} /> : <Volume2 size={11} />}
                {isSpeaking ? "Stop" : "Speak"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* TTS Voice selector */}
      {ttsSupported && ttsVoices.length > 0 && (
        <div className="glass rounded-xl p-3 space-y-2">
          <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Volume2 size={12} /> Voice Selection
          </h4>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full glass rounded-lg px-2 py-1 text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan/30"
          >
            <option value="">Default voice</option>
            {ttsVoices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`text-[9px] ${status.startsWith("✅") ? "text-neon-cyan" : status.startsWith("Error") ? "text-neon-pink" : "text-text-tertiary"}`}>
          {status}
        </div>
      )}
    </div>
  );
}
