"use client";

import { useState, useRef, useEffect } from "react";
import { AI_PROMPT_TEMPLATES, processPromptTemplate } from "@/lib/ai/prompts";
import { Send, Sparkles, Trash2, Copy, Check, Play, Undo2 } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";
import { SYSTEM_PROMPT, parseEditorAction, executeEditorAction } from "@/lib/editor-agent";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  actions?: EditorActionPreview[];
}

interface EditorActionPreview {
  action: string;
  description: string;
  applied: boolean;
}

const QUICK_ACTIONS = AI_PROMPT_TEMPLATES.slice(0, 4);

export function AIChatAssistant() {
  const { clips, selectedClipId, undo } = useEditorStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
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

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const processResponse = async (responseText: string): Promise<string> => {
    const action = parseEditorAction(responseText);
    if (!action) return responseText;

    const result = executeEditorAction(action);
    const actionPreview: EditorActionPreview = {
      action: action.action,
      description: action.description || result.message,
      applied: result.success,
    };

    return `${result.success ? "✅" : "❌"} ${result.message}`;
  };

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const context = clipText ? `(Context: Currently selected clip: "${clipText}". Project details: ${JSON.stringify({ selectedClipId, clipsCount: clips.length })}) ` : "";
    const fullContent = context + content;
    const msgToSend = { ...userMsg, content: fullContent };

    addMessage(msgToSend);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const systemMsg = messages.find((m) => m.role === "system");
      const chatHistory = messages.filter((m) => m.role !== "system").slice(-6);
      const apiMessages = systemMsg ? [systemMsg, ...chatHistory, msgToSend] : [...chatHistory, msgToSend];

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "chat",
          messages: apiMessages.map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.3,
          maxTokens: 1024,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      const responseText = data.data?.text || "";
      const displayText = await processResponse(responseText);
      addMessage({ role: "assistant", content: displayText });
    } catch (err: any) {
      addMessage({ role: "assistant", content: `Error: ${err.message || "AI request failed"}` });
    }

    setLoading(false);
    setStreamingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTemplate = (templateId: string) => {
    const template = AI_PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const clip = clips.find((c) => c.id === selectedClipId);
    const subtitlesText = clip?.subtitles?.map((s) => s.text).join("\n") || "";
    const topic = clip?.name || "my video";

    const vars: Record<string, string> = {
      TEXT: subtitlesText || "Sample text here",
      TOPIC: topic, LANGUAGE: "Spanish", STYLE: "engaging and professional",
      AUDIENCE: "general audience", DURATION: "60", TONE: "professional",
      TYPE: "video", TITLE: topic, CONTEXT: "Video project in Toolkit editor",
      CONTENT: topic, LENGTH: "100",
    };

    const prompt = processPromptTemplate(template, vars);
    addMessage({ role: "system", content: template.systemPrompt });
    setInput(prompt);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text.slice(0, 20));
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([{ role: "system", content: SYSTEM_PROMPT }]);
  };

  return (
    <div className="flex flex-col h-full gap-2">
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

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px]">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="size-10 rounded-2xl glass flex items-center justify-center">
              <Sparkles size={18} className="text-neon-cyan" />
            </div>
            <p className="text-[11px] text-text-tertiary text-center">
              Ask me to edit your video<br />
              <span className="text-[9px] text-text-tertiary/60">e.g. "Make this clip 50% slower"</span>
            </p>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed relative group ${
                msg.role === "user" ? "bg-neon-cyan/15 text-text-primary" : "glass text-text-secondary"
              }`}>
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

      <div className="flex items-center gap-1.5 shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={clipText ? `Edit "${clipText}"...` : "Ask AI to edit..."}
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
            onClick={undo}
            className="size-8 rounded-xl glass text-text-tertiary flex items-center justify-center hover:text-text-primary transition-all"
            title="Undo last action"
          >
            <Undo2 size={11} />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={clearChat} className="flex items-center gap-1 text-[8px] text-text-tertiary hover:text-text-secondary transition-all"><Trash2 size={9} /> Clear</button>
      </div>
    </div>
  );
}
