export interface AIUsage {
  provider: string;
  cost: number;
  durationMs: number;
  modelName?: string;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  transcribe(audio: Buffer, opts?: { language?: string }): Promise<{ data: any; usage: AIUsage }>;
  textToSpeech(text: string, opts?: { voice?: string }): Promise<{ data: any; usage: AIUsage }>;
  removeBackground(image: Buffer): Promise<{ data: any; usage: AIUsage }>;
  chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }): Promise<{ data: any; usage: AIUsage }>;
  isAvailable(): boolean;
}

class OpenRouterProvider implements AIProvider {
  name = "openrouter";
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

  private getKey(): string {
    return process.env.OPENROUTER_API_KEY || "";
  }

  private async chatCompletion(
    messages: { role: string; content: string }[],
    opts?: { temperature?: number; maxTokens?: number; responseFormat?: { type: string } },
  ) {
    const start = Date.now();
    let lastError: string | null = null;

    for (const model of this.freeModels) {
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getKey()}`,
            "HTTP-Referer": "https://toolkit.app",
            "X-Title": "ToolKit AI",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts?.temperature ?? 0.7,
            max_tokens: opts?.maxTokens ?? 1024,
            ...(opts?.responseFormat ? { response_format: opts.responseFormat } : {}),
          }),
        });

        if (res.status === 429) continue;
        if (!res.ok) {
          lastError = `OpenRouter ${res.status}`;
          continue;
        }

        const json = await res.json();
        const content = json.choices?.[0]?.message?.content || "";
        return {
          data: { text: content, model: json.model },
          usage: {
            provider: "openrouter",
            cost: 0,
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

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    // Use OpenRouter chat with a model that can understand audio context
    // For true transcription, we'd need Whisper, but we can use the
    // Web Speech API on the client side for free transcription
    const start = Date.now();
    return {
      data: { text: "", segments: [], note: "Browser-side transcription recommended" },
      usage: { provider: "openrouter", cost: 0, durationMs: Date.now() - start, modelName: "web-speech-api" },
    };
  }

  async textToSpeech(text: string, opts?: { voice?: string }) {
    const start = Date.now();
    return {
      data: { audioUrl: "", duration: 0, note: "Browser TTS recommended" },
      usage: { provider: "openrouter", cost: 0, durationMs: Date.now() - start, modelName: "web-speech-synthesis" },
    };
  }

  async removeBackground(image: Buffer) {
    const start = Date.now();
    // Use @imgly/background-removal on client side instead
    return {
      data: { imageUrl: "", maskUrl: "", note: "Client-side removal recommended" },
      usage: { provider: "openrouter", cost: 0, durationMs: Date.now() - start, modelName: "imgly-rembg" },
    };
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    return this.chatCompletion(messages, opts);
  }
}

class OpenAIProvider implements AIProvider {
  name = "openai";
  isAvailable() { return !!process.env.OPENAI_API_KEY; }

  private async getClient() {
    try {
      const { default: OpenAI } = await import("openai");
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch {
      throw new Error("OpenAI package not installed. Run: npm install openai");
    }
  }

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    const start = Date.now();
    const openai = await this.getClient();
    const blob = new Blob([new Uint8Array(audio)], { type: "audio/wav" });
    const file = new File([blob], "audio.wav", { type: "audio/wav" });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
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
      model: "tts-1",
      voice: (opts?.voice as any) || "alloy",
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return {
      data: { audioBuffer: buffer.toString("base64") },
      usage: { provider: "openai", cost: 0.015, durationMs: Date.now() - start, modelName: "tts-1" },
    };
  }

  async removeBackground(image: Buffer): Promise<{ data: any; usage: AIUsage }> {
    throw new Error("Not supported by OpenAI");
  }

  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    const start = Date.now();
    const openai = await this.getClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    });
    return {
      data: { text: completion.choices[0]?.message?.content || "", model: completion.model },
      usage: {
        provider: "openai",
        cost: 0.001,
        durationMs: Date.now() - start,
        modelName: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    };
  }
}

export class AIProviderRouter {
  private providers: AIProvider[] = [];

  constructor() {
    this.register(new OpenRouterProvider());
    this.register(new OpenAIProvider());
  }

  register(provider: AIProvider) { this.providers.push(provider); }

  private getProvider(feature: keyof AIProvider): AIProvider {
    for (const p of this.providers) {
      if (p.isAvailable() && typeof (p as any)[feature] === "function") {
        return p;
      }
    }
    throw new Error(`No available provider for ${String(feature)}`);
  }

  async transcribe(audio: Buffer, opts?: { language?: string }) {
    return this.getProvider("transcribe").transcribe(audio, opts);
  }
  async textToSpeech(text: string, opts?: { voice?: string }) {
    return this.getProvider("textToSpeech").textToSpeech(text, opts);
  }
  async removeBackground(image: Buffer) {
    return this.getProvider("removeBackground").removeBackground(image);
  }
  async chat(messages: { role: string; content: string }[], opts?: { temperature?: number; maxTokens?: number }) {
    return this.getProvider("chat").chat(messages, opts);
  }
}

export const aiRouter = new AIProviderRouter();
