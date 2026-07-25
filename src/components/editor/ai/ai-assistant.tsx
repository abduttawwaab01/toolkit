"use client";

import { useState, useRef, useEffect } from "react";
import { getOpenRouterClient } from "@/lib/ai/index";
import { AI_PROMPT_TEMPLATES, processPromptTemplate } from "@/lib/ai/prompts";
import type { OpenRouterMessage } from "@/lib/ai/openrouter";
import { Send, Sparkles, Plus, Trash2, Copy, Check } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";

const QUICK_ACTIONS = AI_PROMPT_TEMPLATES.slice(0, 4);

export function AIChatAssistant() {
  const { clips, selectedClipId } = useEditorStore();
  const [messages, setMessages] = useState<OpenRouterMessage[]>([
    { role: "system", content: "You are ToolKit AI, a helpful video editing assistant. You can help write scripts, polish subtitles, generate descriptions, suggest edits, and answer questions about video production. Keep answers concise and practical." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visibleMessages = messages.filter((m) => m.role !== "system");
  const clipText = selectedClipId
    ? clips.find((c) => c.id === selectedClipId)?.name || null
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const addMessage = (msg: OpenRouterMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: OpenRouterMessage = { role: "user", content };
    const context = clipText ? `(Context: editing clip "${clipText}") ` : "";
    const fullContent = context + content;
    const msgToSend = { ...userMsg, content: fullContent };

    addMessage(msgToSend);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const client = getOpenRouterClient();
      const allMessages = [...messages, msgToSend];

      // Try streaming first
      let fullResponse = "";
      try {
        for await (const chunk of client.stream(allMessages, { temperature: 0.7, maxTokens: 2048 })) {
          fullResponse += chunk;
          setStreamingText(fullResponse);
        }
      } catch {
        // Fall back to non-streaming
        fullResponse = await client.chat(allMessages, { temperature: 0.7, maxTokens: 2048 });
        setStreamingText(fullResponse);
      }

      addMessage({ role: "assistant", content: fullResponse });
      setStreamingText("");
    } catch (err: any) {
      addMessage({
        role: "assistant",
        content: `⚠ Error: ${err.message}. Please check your API key in Settings.`,
      });
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplate = (templateId: string) => {
    const template = AI_PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const clip = clips.find((c) => c.id === selectedClipId);
    const subtitlesText = clip?.subtitles?.map((s) => s.text).join("\n") || "";
    const topic = clip?.name || "my video";

    const vars: Record<string, string> = {
      TEXT: subtitlesText || "Sample text here",
      TOPIC: topic,
      LANGUAGE: "Spanish",
      STYLE: "engaging and professional",
      AUDIENCE: "general audience",
      DURATION: "60",
      TONE: "professional",
      TYPE: "video",
      TITLE: topic,
      CONTEXT: "Video project in Toolkit editor",
      CONTENT: topic,
      LENGTH: "100",
    };

    const prompt = processPromptTemplate(template, vars);
    addMessage({
      role: "system",
      content: template.systemPrompt,
    });
    setInput(prompt);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text.slice(0, 20));
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      { role: "system", content: "You are ToolKit AI, a helpful video editing assistant." },
    ]);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Quick actions */}
      <div className="flex gap-1 flex-wrap">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleTemplate(action.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg glass border border-border-subtle text-[9px] text-text-secondary hover:text-text-primary hover:bg-glass-medium transition-all"
          >
            <span>{action.icon}</span>
            {action.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px]">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="size-10 rounded-2xl glass flex items-center justify-center">
              <Sparkles size={18} className="text-neon-cyan" />
            </div>
            <p className="text-[11px] text-text-tertiary text-center">
              Ask me anything about your project,<br />or use a quick action above
            </p>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed relative group ${
                  msg.role === "user"
                    ? "bg-neon-cyan/15 text-text-primary"
                    : "glass text-text-secondary"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <button
                  onClick={() => copyToClipboard(msg.content)}
                  className="absolute -top-1 -right-1 size-5 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copied === msg.content.slice(0, 20) ? (
                    <Check size={10} className="text-neon-cyan" />
                  ) : (
                    <Copy size={10} className="text-text-tertiary" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed glass text-text-secondary">
              <span>{streamingText}</span>
              <span className="inline-block w-1.5 h-3.5 bg-neon-cyan ml-0.5 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5 items-end shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={clipText ? `Ask about "${clipText}"...` : "Type a message..."}
          rows={2}
          className="flex-1 glass rounded-xl px-3 py-2 text-[11px] text-text-primary placeholder:text-text-tertiary border border-border-subtle focus:outline-none focus:border-neon-cyan/30 resize-none"
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="size-8 rounded-xl bg-neon-cyan/20 text-neon-cyan flex items-center justify-center hover:bg-neon-cyan/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={13} />
          </button>
          <button
            onClick={clearChat}
            className="size-8 rounded-xl glass text-text-tertiary flex items-center justify-center hover:text-text-primary transition-all"
            title="Clear chat"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
