"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useDocumentStore } from "@/lib/document-store";
import { cn } from "@/lib/utils";

interface TextEditorProps {
  documentId: string;
  initialContent?: string;
  onUpdate?: (text: string) => void;
  editable?: boolean;
}

export function TextEditor({
  documentId,
  initialContent = "",
  onUpdate,
  editable = true,
}: TextEditorProps) {
  const {
    setRawContent,
    setIsDirty,
    setWordCount,
    setCharCount,
    isSaving,
    lastSaved,
  } = useDocumentStore();

  const [text, setText] = useState(initialContent);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setRawContent(text);
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
    setCharCount(text.length);
    setIsDirty(text !== initialContent);
    onUpdate?.(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    setText(initialContent);
  }, [documentId, initialContent]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowFind((s) => !s);
      }
      if (e.key === "Escape" && showFind) {
        setShowFind(false);
        setFindQuery("");
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showFind]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newText = text.substring(0, start) + "  " + text.substring(end);
        setText(newText);
        requestAnimationFrame(() => {
          ta.setSelectionRange(start + 2, start + 2);
        });
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const line = text.substring(lineStart, start);
        const indent = line.match(/^(\s*)/)?.[1] ?? "";
        const newText =
          text.substring(0, start) + "\n" + indent + text.substring(start);
        setText(newText);
        requestAnimationFrame(() => {
          ta.setSelectionRange(
            start + 1 + indent.length,
            start + 1 + indent.length,
          );
        });
      }
    },
    [text],
  );

  const handleSelect = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = ta.value.substring(0, ta.selectionStart);
    const line = before.split("\n").length;
    const col = before.length - before.lastIndexOf("\n");
    setCursorLine(line);
    setCursorCol(col);
  }, []);

  const highlightFind = useCallback(() => {
    if (!findQuery || !textareaRef.current) return;
    const ta = textareaRef.current;
    const idx = text.indexOf(findQuery, ta.selectionEnd);
    if (idx !== -1) {
      ta.setSelectionRange(idx, idx + findQuery.length);
      ta.focus();
    } else {
      const idx2 = text.indexOf(findQuery);
      if (idx2 !== -1) {
        ta.setSelectionRange(idx2, idx2 + findQuery.length);
        ta.focus();
      }
    }
  }, [findQuery, text]);

  const replaceNext = useCallback(() => {
    if (!findQuery || !textareaRef.current) return;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const selected = text.substring(start, start + findQuery.length);
    if (selected === findQuery) {
      const newText =
        text.substring(0, start) + replaceValue + text.substring(start + findQuery.length);
      setText(newText);
      requestAnimationFrame(() => {
        ta.setSelectionRange(
          start + replaceValue.length,
          start + replaceValue.length,
        );
        highlightFind();
      });
    } else {
      highlightFind();
    }
  }, [findQuery, replaceValue, text, highlightFind]);

  const replaceAll = useCallback(() => {
    if (!findQuery) return;
    const newText = text.split(findQuery).join(replaceValue);
    setText(newText);
  }, [findQuery, replaceValue, text]);

  const lines = text.split("\n");

  return (
    <div className="flex flex-col h-full bg-surface">
      <AnimatePresence>
        {showFind && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
              <Search className="size-4 text-text-tertiary flex-shrink-0" />
              <input
                autoFocus
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && highlightFind()}
                placeholder="Find..."
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <input
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="Replace..."
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <button
                onClick={replaceNext}
                className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-white/5 rounded-md hover:bg-white/10 transition-colors"
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-white/5 rounded-md hover:bg-white/10 transition-colors"
              >
                All
              </button>
              <button
                onClick={() => {
                  setShowFind(false);
                  setFindQuery("");
                  textareaRef.current?.focus();
                }}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 py-3 pl-3 pr-1 text-right text-text-tertiary select-none bg-white/[0.02] border-r border-white/[0.04] overflow-hidden">
          {lines.map((_, i) => (
            <div
              key={i}
              className={cn(
                "font-mono text-[12px] leading-[1.625rem] transition-colors",
                i + 1 === cursorLine ? "text-neon-cyan" : "",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          readOnly={!editable}
          spellCheck={false}
          className={cn(
            "flex-1 min-h-full resize-none p-3",
            "bg-transparent text-text-primary font-mono text-sm leading-relaxed",
            "outline-none placeholder:text-text-tertiary",
            "selection:bg-neon-cyan/20",
          )}
          placeholder="Start typing..."
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-t border-white/[0.06] text-xs text-text-tertiary">
        <div className="flex items-center gap-4">
          <span>
            Ln {cursorLine}, Col {cursorCol}
          </span>
          <span>{text.split(/\s+/).filter((w) => w.length > 0).length} words</span>
          <span>{text.length} chars</span>
          <span>{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-tertiary">Press Ctrl+F to find</span>
          <span className="text-text-tertiary">·</span>
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
    </div>
  );
}
