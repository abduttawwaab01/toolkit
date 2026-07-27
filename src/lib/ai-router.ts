/**
 * AI Provider Router
 *
 * Priority order for all features:
 *   1. Local Python server (localhost:8400) — free, self-hosted
 *   2. Ollama (localhost:11434) — free, LLM only
 *   3. OpenRouter free models — free, rate-limited
 *   4. OpenAI — paid fallback
 */

import {
  isLocalAIAvailable,
  localTTS,
  localTranscribe,
  localRemoveBackground,
  isOllamaAvailable,
  ollamaChat,
} from "./ai/local-adapter";

export interface AIUsage {
  provider: string;
  cost: number;
  durationMs: number;
  modelName?: string;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  priority: number;
  supports: string[];
  transcribe(audio: Buffer, opts?: { language?: string }): Promise<{ data: any; usage: AIUsage }>;
  textToSpeech(text: string, opts?: { voice?: string }): Promise<{ data: any; usage: AIUsage }>;
  removeBackground(image: Buffer): Promise<{ data: any; usage: AIUsage }>;
  chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }): Promise<{ data: any; usage: AIUsage }>;
  isAvailable(): boolean;
}

// ─── 1. Local Python Server (highest priority for ML) ───

class LocalServerProvider implements AIProvider {
  name = "local-server";
  priority = 0;
  supports = ["transcribe", "textToSpeech", "removeBackground"];

  isAvailable() {
    return !!process.env.LOCAL_AI_URL;
  }

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    const start = Date.now();
    const result = await localTranscribe(audio, opts?.language);
    if (!result) throw new Error("Local transcription failed");
    return {
      data: result,
      usage: { provider: "local-server", cost: 0, durationMs: Date.now() - start, modelName: "faster-whisper" },
    };
  }

  async textToSpeech(text: string, opts?: { voice?: string }) {
    const start = Date.now();
    const result = await localTTS({ text, voice: opts?.voice });
    if (!result) throw new Error("Local TTS failed");
    return {
      data: { audioBuffer: result.audioBuffer.toString("base64"), contentType: result.contentType },
      usage: { provider: "local-server", cost: 0, durationMs: Date.now() - start, modelName: "edge-tts" },
    };
  }

  async removeBackground(image: Buffer) {
    const start = Date.now();
    const result = await localRemoveBackground(image);
    if (!result) throw new Error("Local background removal failed");
    return {
      data: { imageBuffer: result.imageBuffer.toString("base64") },
      usage: { provider: "local-server", cost: 0, durationMs: Date.now() - start, modelName: "rembg" },
    };
  }

  async chat(_messages: { role: string; content: string }[], _opts?: { temperature?: number; maxTokens?: number }): Promise<{ data: any; usage: AIUsage }> {
    throw new Error("Local server does not provide LLM chat");
  }
}

// ─── 2. Ollama (highest priority for LLM) ───

class OllamaProvider implements AIProvider {
  name = "ollama";
  priority = 1;
  supports = ["chat"];

  isAvailable() {
    return !!process.env.OLLAMA_URL;
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    const start = Date.now();
    const available = await isOllamaAvailable();
    if (!available) throw new Error("Ollama not running");

    const result = await ollamaChat({
      messages,
      temperature: opts?.temperature,
    });
    if (!result) throw new Error("Ollama returned empty response");
    return {
      data: { text: result, model: "ollama" },
      usage: { provider: "ollama", cost: 0, durationMs: Date.now() - start, modelName: "llama3.2" },
    };
  }

  async transcribe(_audio: Buffer, _opts?: { language?: string }): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
  async textToSpeech(_text: string, _opts?: { voice?: string }): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
  async removeBackground(_image: Buffer): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
}

// ─── 3. OpenRouter Free Models (LLM fallback) ───

class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  priority = 2;
  supports = ["chat"];
  private baseUrl = "https://openrouter.ai/api/v1";
  private freeModels = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "qwen/qwen3-coder:free",
    "gpt-oss-120b:free",
  ];

  isAvailable() {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    const start = Date.now();
    const key = process.env.OPENROUTER_API_KEY || "";
    let lastError: string | null = null;

    for (const model of this.freeModels) {
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
            "HTTP-Referer": "https://toolkit.app",
            "X-Title": "ToolKit AI",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts?.temperature ?? 0.7,
            max_tokens: opts?.maxTokens ?? 1024,
          }),
        });

        if (res.status === 429) continue;
        if (!res.ok) { lastError = `OpenRouter ${res.status}`; continue; }

        const json = await res.json();
        return {
          data: { text: json.choices?.[0]?.message?.content || "", model: json.model },
          usage: {
            provider: "openrouter", cost: 0,
            durationMs: Date.now() - start,
            modelName: json.model,
            tokensUsed: json.usage?.total_tokens || 0,
          },
        };
      } catch (e: any) {
        lastError = e.message;
      }
    }

    throw new Error(`All OpenRouter free models failed: ${lastError}`);
  }

  async transcribe(_audio: Buffer, _opts?: { language?: string }): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
  async textToSpeech(_text: string, _opts?: { voice?: string }): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
  async removeBackground(_image: Buffer): Promise<{ data: any; usage: AIUsage }> { throw new Error("Not supported"); }
}

// ─── 4. OpenAI (paid fallback) ───

class OpenAIProvider implements AIProvider {
  name = "openai";
  priority = 3;
  supports = ["chat", "transcribe", "textToSpeech"];

  isAvailable() {
    return !!process.env.OPENAI_API_KEY;
  }

  private async getClient() {
    const { default: OpenAI } = await import("openai");
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    const start = Date.now();
    const openai = await this.getClient();
    const blob = new Blob([new Uint8Array(audio)], { type: "audio/wav" });
    const file = new File([blob], "audio.wav", { type: "audio/wav" });
    const transcription = await openai.audio.transcriptions.create({
      file, model: "whisper-1",
      language: opts?.language,
      response_format: "verbose_json",
    });
    return {
      data: { text: transcription.text, segments: (transcription as any).segments || [] },
      usage: { provider: "openai", cost: 0.006, durationMs: Date.now() - start, modelName: "whisper-1" },
    };
  }

  async textToSpeech(text: string, opts?: { voice?: string }) {
    const start = Date.now();
    const openai = await this.getClient();
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", voice: (opts?.voice as any) || "alloy", input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return {
      data: { audioBuffer: buffer.toString("base64") },
      usage: { provider: "openai", cost: 0.015, durationMs: Date.now() - start, modelName: "tts-1" },
    };
  }

  async removeBackground(): Promise<{ data: any; usage: AIUsage }> {
    throw new Error("Not supported by OpenAI");
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    const start = Date.now();
    const openai = await this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", messages: messages as any,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    });
    return {
      data: { text: completion.choices[0]?.message?.content || "", model: completion.model },
      usage: {
        provider: "openai", cost: 0.001,
        durationMs: Date.now() - start,
        modelName: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    };
  }
}

// ─── Router ───

export class AIProviderRouter {
  private providers: AIProvider[] = [];

  constructor() {
    this.register(new LocalServerProvider());
    this.register(new OllamaProvider());
    this.register(new OpenRouterProvider());
    this.register(new OpenAIProvider());
  }

  register(provider: AIProvider) {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  private async runWithFallback(
    feature: string,
    fn: (p: AIProvider) => Promise<any>,
  ) {
    const candidates = this.providers.filter(
      (p) => p.isAvailable() && p.supports.includes(feature),
    );

    if (candidates.length === 0) {
      throw new Error(`No available provider for ${feature}`);
    }

    let lastError: string | null = null;
    for (const provider of candidates) {
      try {
        return await fn(provider);
      } catch (err: any) {
        lastError = `${provider.name}: ${err.message}`;
        console.warn(`[AI Router] ${provider.name} failed for ${feature}: ${err.message}`);
      }
    }

    throw new Error(`All providers failed for ${feature}: ${lastError}`);
  }

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    return this.runWithFallback("transcribe", (p) => p.transcribe(audio, opts));
  }

  async textToSpeech(text: string, opts?: { voice?: string }) {
    return this.runWithFallback("textToSpeech", (p) => p.textToSpeech(text, opts));
  }

  async removeBackground(image: Buffer) {
    return this.runWithFallback("removeBackground", (p) => p.removeBackground(image));
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    return this.runWithFallback("chat", (p) => p.chat(messages, opts));
  }
}

export const aiRouter = new AIProviderRouter();
