export type SpeechRecognitionLanguage =
  | "en" | "en-US" | "en-GB" | "es" | "fr" | "de" | "it" | "pt" | "pt-BR"
  | "ru" | "ja" | "ko" | "zh" | "zh-CN" | "ar" | "hi" | "nl" | "sv"
  | "da" | "fi" | "nb" | "pl" | "tr" | "th" | "vi";

export interface SpeechRecognitionResult {
  text: string;
  segments: { start: number; end: number; text: string; confidence: number }[];
  isFinal: boolean;
}

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechGrammarList: any;
    webkitSpeechGrammarList: any;
  }
}

// ─── Speech-to-Text ───

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export function createSpeechRecognizer(language: SpeechRecognitionLanguage = "en", options?: {
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): { start: () => void; stop: () => void; abort: () => void; isRunning: boolean } {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    throw new Error("Speech recognition not supported in this browser");
  }

  const recognizer = new SpeechRecognitionAPI();
  recognizer.lang = language;
  recognizer.continuous = options?.continuous ?? true;
  recognizer.interimResults = options?.interimResults ?? true;
  recognizer.maxAlternatives = 1;

  let isRunning = false;

  recognizer.onresult = (event: any) => {
    let interimText = "";
    let finalText = "";
    const segments: SpeechRecognitionResult["segments"] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      if (result.isFinal) {
        finalText += transcript + " ";
        segments.push({
          start: i,
          end: i + transcript.length * 0.05,
          text: transcript.trim(),
          confidence,
        });
      } else {
        interimText += transcript;
      }
    }

    if (options?.onResult) {
      options.onResult({
        text: finalText || interimText,
        segments,
        isFinal: !!finalText,
      });
    }
  };

  recognizer.onerror = (event: any) => {
    if (options?.onError) {
      options.onError(event.error || "Unknown speech recognition error");
    }
  };

  recognizer.onend = () => {
    isRunning = false;
    if (options?.onEnd) options.onEnd();
  };

  return {
    start() {
      try {
        recognizer.start();
        isRunning = true;
      } catch (e) {
        // Already started
      }
    },
    stop() {
      recognizer.stop();
      isRunning = false;
    },
    abort() {
      recognizer.abort();
      isRunning = false;
    },
    get isRunning() { return isRunning; },
  };
}

// ─── Text-to-Speech ───

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
  });
}

export function speakText(text: string, options?: TTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error("Text-to-speech not supported"));
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    if (options?.voice) {
      const voices = speechSynthesis.getVoices();
      const found = voices.find((v) =>
        v.name === options.voice || v.voiceURI === options.voice,
      );
      if (found) utterance.voice = found;
    }

    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(`TTS error: ${e.error}`));

    speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (isTTSSupported()) {
    speechSynthesis.cancel();
  }
}

// ─── Audio Transcription via MediaRecorder + OpenRouter ───

export async function transcribeAudioFile(
  audioBlob: Blob,
  apiKey: string,
  language?: string,
): Promise<{ text: string; segments: { start: number; end: number; text: string }[] }> {
  // Convert blob to base64
  const buffer = await audioBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feature: "transcribe",
      audio: base64,
      language: language || "en",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed: ${err}`);
  }

  const data = await res.json();
  return data.data || { text: "", segments: [] };
}
