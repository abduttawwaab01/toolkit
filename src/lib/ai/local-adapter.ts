/**
 * Local AI Adapter
 * Calls the local Python AI server (localhost:8400) for free inference.
 * Returns null if the local server is unavailable, so callers can fall back to paid APIs.
 */

const LOCAL_AI_URL = process.env.LOCAL_AI_URL || "http://localhost:8400";

interface LocalAIResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

async function localFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 120_000,
): Promise<LocalAIResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${LOCAL_AI_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Local AI error ${res.status}: ${text}` };
    }

    return { ok: true, data: res };
  } catch (error: any) {
    if (error.name === "AbortError" || error.message?.includes("ECONNREFUSED")) {
      return { ok: false, error: "Local AI server not available" };
    }
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function isLocalAIAvailable(): Promise<boolean> {
  try {
    const res = await localFetch("/api/health", {}, 5000);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── TTS ───

export interface LocalTTSOptions {
  text: string;
  voice?: string;
  rate?: string;
  volume?: string;
}

export async function localTTS(options: LocalTTSOptions): Promise<{ audioBuffer: Buffer; contentType: string } | null> {
  const res = await localFetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: options.text,
      voice: options.voice || "en-US-AriaNeural",
      rate: options.rate || "+0%",
      volume: options.volume || "+0%",
    }),
  }, 30_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    contentType: res.data.headers.get("content-type") || "audio/mpeg",
  };
}

export async function localListTTSVoices(): Promise<any[] | null> {
  const res = await localFetch("/api/tts/voices", {}, 10_000);
  if (!res.ok || !res.data) return null;
  const json = await (res.data as Response).json();
  return json.voices || [];
}

// ─── Music Generation ───

export interface LocalMusicGenOptions {
  prompt: string;
  duration?: number;
  temperature?: number;
  topP?: number;
  classifierFreeGuidance?: number;
}

export async function localMusicGenerate(options: LocalMusicGenOptions): Promise<{ audioBuffer: Buffer } | null> {
  const res = await localFetch("/api/music-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      duration: options.duration || 8,
      temperature: options.temperature ?? 1.0,
      top_p: options.topP ?? 0.9,
      classifier_free_guidance: options.classifierFreeGuidance ?? 3.0,
    }),
  }, 180_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return { audioBuffer: Buffer.from(arrayBuffer) };
}

// ─── Image Generation ───

export interface LocalImageGenOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
}

export async function localImageGenerate(options: LocalImageGenOptions): Promise<{ imageBuffer: Buffer } | null> {
  const res = await localFetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || "blurry, low quality",
      width: options.width || 512,
      height: options.height || 512,
      steps: options.steps || 4,
      guidance_scale: options.guidanceScale || 7.5,
      seed: options.seed,
    }),
  }, 120_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return { imageBuffer: Buffer.from(arrayBuffer) };
}

// ─── Background Removal ───

export async function localRemoveBackground(imageBuffer: Buffer): Promise<{ imageBuffer: Buffer } | null> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }), "image.png");

  const res = await localFetch("/api/remove-background", {
    method: "POST",
    body: formData,
  }, 60_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return { imageBuffer: Buffer.from(arrayBuffer) };
}

// ─── Object Removal ───

export async function localRemoveObject(
  imageBuffer: Buffer,
  maskBuffer: Buffer,
): Promise<{ imageBuffer: Buffer } | null> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }), "image.png");
  formData.append("mask", new Blob([new Uint8Array(maskBuffer)], { type: "image/png" }), "mask.png");

  const res = await localFetch("/api/remove-object", {
    method: "POST",
    body: formData,
  }, 60_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return { imageBuffer: Buffer.from(arrayBuffer) };
}

// ─── Video Upscale ───

export async function localUpscaleVideo(
  videoBuffer: Buffer,
  scale: number = 4,
): Promise<{ videoBuffer: Buffer } | null> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }), "video.mp4");
  formData.append("scale", scale.toString());

  const res = await localFetch("/api/upscale-video", {
    method: "POST",
    body: formData,
  }, 300_000);

  if (!res.ok || !res.data) return null;

  const arrayBuffer = await (res.data as Response).arrayBuffer();
  return { videoBuffer: Buffer.from(arrayBuffer) };
}

// ─── Transcription ───

export async function localTranscribe(
  audioBuffer: Buffer,
  language: string = "en",
): Promise<{ segments: Array<{ start: number; end: number; text: string }> } | null> {
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer as unknown as BlobPart], { type: "audio/wav" }), "audio.wav");
  formData.append("language", language);

  const res = await localFetch("/api/transcribe", {
    method: "POST",
    body: formData,
  }, 120_000);

  if (!res.ok || !res.data) return null;

  const json = await (res.data as Response).json();
  return { segments: json.segments || [] };
}

// ─── Ollama LLM ───

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.models) && data.models.length > 0;
  } catch {
    return false;
  }
}

async function getBestOllamaModel(): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return "llama3.2:1b";
    const data = await res.json();
    const models: string[] = (data.models || []).map((m: any) => m.name || m.model);
    if (models.some((m) => m.startsWith("llama3.2:1b"))) return "llama3.2:1b";
    if (models.some((m) => m.startsWith("mistral:7b"))) return "mistral:7b";
    if (models.length > 0) return models[0];
    return "llama3.2:1b";
  } catch {
    return "llama3.2:1b";
  }
}

export interface OllamaChatOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}

export async function ollamaChat(options: OllamaChatOptions): Promise<string | null> {
  try {
    const model = options.model || await getBestOllamaModel();
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: options.messages,
        stream: false,
        options: { temperature: options.temperature ?? 0.7 },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.message?.content || null;
  } catch {
    return null;
  }
}
