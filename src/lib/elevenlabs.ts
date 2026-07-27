/**
 * ElevenLabs API client for voice cloning, TTS, and voice management.
 * Uses fetch-based HTTP calls — no SDK dependency required.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  return key;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

export interface VoiceCloneOptions {
  name: string;
  description?: string;
  audioFiles: File[];
}

export interface VoiceCloneResult {
  voice_id: string;
  name: string;
  category: string;
}

export interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  outputFormat?: "mp3_44100_128" | "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100";
}

export interface TTSResult {
  audioBase64: string;
  contentType: string;
  characterCount: number;
}

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = getApiKey();
  const res = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`Failed to list voices: ${res.status}`);
  const data = await res.json();
  return data.voices || [];
}

export async function cloneVoice(options: VoiceCloneOptions): Promise<VoiceCloneResult> {
  const apiKey = getApiKey();
  const formData = new FormData();
  formData.append("name", options.name);
  if (options.description) formData.append("description", options.description);
  options.audioFiles.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voice cloning failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    voice_id: data.voice_id,
    name: data.name || options.name,
    category: "cloned",
  };
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const apiKey = getApiKey();
  const res = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
    method: "DELETE",
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`Failed to delete voice: ${res.status}`);
}

export async function textToSpeech(options: TTSOptions): Promise<TTSResult> {
  const apiKey = getApiKey();
  const outputFormat = options.outputFormat || "mp3_44100_128";

  const res = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${options.voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.modelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          speed: options.speed ?? 1,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed: ${res.status} ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = res.headers.get("content-type") || "audio/mpeg";

  return {
    audioBase64: base64,
    contentType,
    characterCount: options.text.length,
  };
}

export async function streamTTS(options: TTSOptions): Promise<ReadableStream> {
  const apiKey = getApiKey();
  const outputFormat = options.outputFormat || "mp3_44100_128";

  const res = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${options.voiceId}/stream?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.modelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          speed: options.speed ?? 1,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS streaming failed: ${res.status} ${err}`);
  }

  return res.body!;
}
