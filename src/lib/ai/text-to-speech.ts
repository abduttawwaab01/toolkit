/**
 * Client-side service for ElevenLabs Text-to-Speech.
 */

export interface TTSResult {
  audio: string;
  characterCount: number;
}

export interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
}

export async function generateSpeech(options: TTSOptions): Promise<TTSResult> {
  const res = await fetch("/api/ai/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "TTS failed" }));
    throw new Error(err.error || "TTS failed");
  }

  const result = await res.json();
  return result.data;
}

export async function playAudioFromDataUri(dataUri: string): Promise<HTMLAudioElement> {
  const audio = new Audio(dataUri);
  await audio.play();
  return audio;
}

export interface TTSVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

export async function listTTSVoices(): Promise<TTSVoice[]> {
  const res = await fetch("/api/ai/tts");
  if (!res.ok) throw new Error("Failed to list voices");
  const data = await res.json();
  return data.voices || [];
}
