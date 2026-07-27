import { isOllamaAvailable, ollamaChat } from "./local-adapter";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface OpenRouterStreamChunk {
  choices: { delta: { content?: string }; finish_reason: string | null }[];
  model: string;
}

const DEFAULT_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "qwen/qwen3-coder:free",
  "gpt-oss-120b:free",
];

export class OpenRouterClient {
  private apiKey: string;
  private model: string;
  private maxRetries = 3;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "openrouter/free";
  }

  setModel(model: string) {
    this.model = model;
  }

  private async request(messages: OpenRouterMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "text" | "json_object" };
  }): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;

    const modelsToTry = this.model === "openrouter/free"
      ? ["openrouter/free"]
      : [this.model, ...DEFAULT_MODELS.filter((m) => m !== this.model)];

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      for (const modelId of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000);

          const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
              "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://toolkit.app",
              "X-Title": "ToolKit AI",
            },
            body: JSON.stringify({
              model: modelId,
              messages,
              temperature: options?.temperature ?? 0.7,
              max_tokens: options?.maxTokens ?? 2048,
              ...(options?.responseFormat?.type === "json_object"
                ? { response_format: { type: "json_object" } }
                : {}),
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
          }

          return await res.json();
        } catch (err: any) {
          lastError = err;
          if (err.name === "AbortError") {
            throw new Error("OpenRouter request timed out after 60s");
          }
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    throw lastError || new Error("All OpenRouter fallback models failed");
  }

  async chat(messages: OpenRouterMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: "text" | "json_object" };
  }): Promise<string> {
    // Try Ollama first (local, free)
    try {
      const ollamaAvailable = await isOllamaAvailable();
      if (ollamaAvailable) {
        const ollamaResult = await ollamaChat({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature,
        });
        if (ollamaResult) return ollamaResult;
      }
    } catch {}

    // Fallback to OpenRouter
    const res = await this.request(messages, options);
    return res.choices[0]?.message?.content || "";
  }

  async *stream(messages: OpenRouterMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string> {
    const modelsToTry = this.model === "openrouter/free"
      ? ["openrouter/free"]
      : [this.model, ...DEFAULT_MODELS.filter((m) => m !== this.model)];

    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      try {
        const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "ToolKit AI",
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 2048,
            stream: true,
          }),
        });

        if (!res.ok) continue;

        const reader = res.body?.getReader();
        if (!reader) continue;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") return;

            try {
              const chunk: OpenRouterStreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              if (content) yield content;
            } catch { /* skip malformed chunks */ }
          }
        }
        return;
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error("All streaming models failed");
  }

  static isAvailable(): boolean {
    return typeof process !== "undefined"
      ? !!process.env.OPENROUTER_API_KEY
      : !!localStorage.getItem("openrouter_key");
  }

  static getKey(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("openrouter_key");
    }
    return process.env.OPENROUTER_API_KEY || null;
  }
}

let clientInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (clientInstance) return clientInstance;
  const key = OpenRouterClient.getKey();
  if (!key) throw new Error("OpenRouter API key not found. Set it in AI Settings.");
  clientInstance = new OpenRouterClient(key);
  return clientInstance;
}

export function resetOpenRouterClient() {
  clientInstance = null;
}
