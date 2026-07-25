"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
} from "lucide-react";
import { useDocumentStore } from "@/lib/document-store";
import { cn } from "@/lib/utils";
import { EditorToolbar, type ToolbarAction } from "./editor-toolbar";

interface MarkdownEditorProps {
  documentId: string;
  initialContent?: string;
  onUpdate?: (markdown: string) => void;
  editable?: boolean;
}

export function MarkdownEditor({
  documentId,
  initialContent = "",
  onUpdate,
  editable = true,
}: MarkdownEditorProps) {
  const {
    setRawContent,
    setIsDirty,
    setWordCount,
    setCharCount,
    isSaving,
    lastSaved,
  } = useDocumentStore();

  const [markdown, setMarkdown] = useState(initialContent);
  const [lines, setLines] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(50);
  const isDragging = useRef(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    setLines(markdown.split("\n"));
    setRawContent(markdown);
    const text = markdown;
    const words = text
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    setWordCount(words);
    setCharCount(text.length);
    if (!isFirstRender.current) {
      setIsDirty(true);
      onUpdate?.(markdown);
    } else {
      setIsDirty(false);
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  useEffect(() => {
    try {
      const html = marked.parse(markdown || "", { async: false }) as string;
      setPreviewHtml(html);
    } catch {
      setPreviewHtml("<p>Error parsing markdown</p>");
    }
  }, [markdown]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = initialContent;
      setMarkdown(initialContent);
    }
  }, [documentId, initialContent]);

  const insertAtCursor = useCallback(
    (before: string, after = "") => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = markdown.substring(start, end);
      const replacement = before + selected + after;
      const newMd =
        markdown.substring(0, start) + replacement + markdown.substring(end);
      setMarkdown(newMd);
      requestAnimationFrame(() => {
        ta.focus();
        const cursorPos = start + before.length + selected.length + after.length;
        ta.setSelectionRange(
          start + before.length,
          start + before.length + selected.length,
        );
      });
    },
    [markdown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newMd =
          markdown.substring(0, start) + "  " + markdown.substring(end);
        setMarkdown(newMd);
        requestAnimationFrame(() => {
          ta.setSelectionRange(start + 2, start + 2);
        });
      }
    },
    [markdown],
  );

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const x = cx - rect.left;
      const pct = Math.min(Math.max((x / rect.width) * 100, 20), 80);
      setSplitRatio(pct);
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }, []);

  const wordCount = markdown
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const toolbarActions: ToolbarAction[] = [
    { icon: Bold, label: "Bold", onClick: () => insertAtCursor("**", "**") },
    { icon: Italic, label: "Italic", onClick: () => insertAtCursor("_", "_") },
    { icon: Heading1, label: "H1", onClick: () => insertAtCursor("# ") },
    { icon: Heading2, label: "H2", onClick: () => insertAtCursor("## ") },
    { icon: Heading3, label: "H3", onClick: () => insertAtCursor("### ") },
    { icon: LinkIcon, label: "Link", onClick: () => insertAtCursor("[", "](url)") },
    { icon: ImageIcon, label: "Image", onClick: () => insertAtCursor("![alt](", ")") },
    { icon: Code, label: "Code", onClick: () => insertAtCursor("`", "`") },
    { icon: List, label: "Bullet List", onClick: () => insertAtCursor("- ") },
    { icon: ListOrdered, label: "Ordered List", onClick: () => insertAtCursor("1. ") },
    { icon: Quote, label: "Quote", onClick: () => insertAtCursor("> ") },
    { icon: Minus, label: "Divider", onClick: () => insertAtCursor("\n---\n") },
  ];

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar actions={toolbarActions} className="mx-2 mt-2" />

      <div
        ref={containerRef}
        className="flex flex-1 min-h-0 overflow-hidden mx-2 mb-2 mt-1 rounded-xl border border-white/[0.06] bg-surface"
      >
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${splitRatio}%` }}
        >
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-tertiary border-b border-white/[0.06] bg-white/[0.02]">
            Editor
          </div>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-shrink-0 py-3 pl-3 pr-1 text-right text-text-tertiary select-none bg-white/[0.02] border-r border-white/[0.04] overflow-hidden">
              {lines.map((_, i) => (
                <div key={i} className="font-mono text-[12px] leading-[1.625rem]">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              defaultValue={initialContent}
              onChange={(e) => setMarkdown(e.target.value)}
              onKeyDown={handleKeyDown}
              readOnly={!editable}
              spellCheck={false}
              className={cn(
                "flex-1 min-h-full resize-none p-3",
                "bg-transparent text-text-primary font-mono text-sm leading-relaxed",
                "outline-none placeholder:text-text-tertiary",
                "selection:bg-neon-cyan/20",
              )}
              placeholder="Write your markdown here..."
            />
          </div>
        </div>

        <div
          ref={dividerRef}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className={cn(
            "w-1 cursor-col-resize flex-shrink-0 relative group",
            "bg-white/[0.06] hover:bg-neon-cyan/40 transition-colors duration-200",
          )}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/20 group-hover:bg-neon-cyan/60 transition-colors" />
        </div>

        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-tertiary border-b border-white/[0.06] bg-white/[0.02]">
            Preview
          </div>
          <div
            ref={previewRef}
            className="flex-1 overflow-y-auto px-6 py-4"
          >
            <div
              className="markdown-preview prose prose-invert max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-t border-white/[0.06] text-xs text-text-tertiary">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{markdown.length} chars</span>
          <span>{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-neon-cyan animate-pulse">Saving...</span>
          ) : lastSaved ? (
            <span>
              Saved{" "}
              {new Date(lastSaved).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .markdown-preview h1 {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .markdown-preview h2 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.25em;
          margin-bottom: 0.4em;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .markdown-preview h3 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.35em;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .markdown-preview p {
          font-family: var(--font-body);
          line-height: 1.75;
          margin: 0.5em 0;
        }
        .markdown-preview a {
          color: var(--color-neon-cyan);
          text-decoration: underline;
        }
        .markdown-preview code {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 0.15em 0.4em;
          font-family: var(--font-mono);
          font-size: 0.85em;
          color: var(--color-neon-cyan);
        }
        .markdown-preview pre {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.75rem;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-preview pre code {
          background: none;
          border: none;
          padding: 0;
          color: #e2e8f0;
        }
        .markdown-preview blockquote {
          border-left: 3px solid var(--color-neon-cyan);
          padding-left: 1rem;
          color: var(--color-text-secondary);
          font-style: italic;
          margin: 1rem 0;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          padding-left: 1.5rem;
          margin: 0.5em 0;
        }
        .markdown-preview ul {
          list-style-type: disc;
        }
        .markdown-preview ol {
          list-style-type: decimal;
        }
        .markdown-preview li {
          margin-top: 0.25em;
        }
        .markdown-preview hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 1.5rem 0;
        }
        .markdown-preview img {
          max-width: 100%;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }
        .markdown-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }
        .markdown-preview th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }
        .markdown-preview strong {
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .markdown-preview em {
          font-style: italic;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
