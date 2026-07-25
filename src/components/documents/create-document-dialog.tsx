"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Code2,
  FileType,
  FileCode,
  X,
  Tag,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentFormat } from "@/types/document";

interface FormatOption {
  id: DocumentFormat;
  name: string;
  ext: string;
  description: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "rich",
    name: "Rich Text",
    ext: ".html",
    description: "Formatted documents with styling",
    icon: FileText,
    color: "text-neon-cyan",
    borderColor: "border-neon-cyan",
  },
  {
    id: "markdown",
    name: "Markdown",
    ext: ".md",
    description: "Lightweight markup language",
    icon: Code2,
    color: "text-neon-purple",
    borderColor: "border-neon-purple",
  },
  {
    id: "text",
    name: "Plain Text",
    ext: ".txt",
    description: "Raw unformatted text",
    icon: FileType,
    color: "text-text-secondary",
    borderColor: "border-text-secondary",
  },
  {
    id: "html",
    name: "HTML",
    ext: ".html",
    description: "Raw HTML source code",
    icon: FileCode,
    color: "text-neon-pink",
    borderColor: "border-neon-pink",
  },
];

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (doc: { id: string }) => void;
}

export function CreateDocumentDialog({ open, onClose, onCreated }: CreateDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<DocumentFormat>("rich");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setFormat("rich");
    setTags([]);
    setTagInput("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!title.trim() || title.length > 200) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          format,
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create document");
      }

      const doc = await res.json();
      reset();
      onCreated(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setLoading(false);
    }
  }, [title, description, format, tags, reset, onCreated]);

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.id === format)!;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="relative w-full max-w-lg glass rounded-2xl border border-border-subtle shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-display font-semibold text-text-primary">New Document</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Title <span className="text-neon-pink">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Document"
                  maxLength={200}
                  autoFocus
                  className="w-full rounded-xl bg-glass-light border border-border-subtle px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 transition-colors"
                />
                <p className="text-[11px] text-text-tertiary text-right">{title.length}/200</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full rounded-xl bg-glass-light border border-border-subtle px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 transition-colors resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = format === opt.id;

                    return (
                      <motion.button
                        key={opt.id}
                        onClick={() => setFormat(opt.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 rounded-xl p-4 text-center transition-all duration-300 border backdrop-blur-sm",
                          isSelected
                            ? cn("bg-glass-heavy shadow-lg border-opacity-100", `${opt.borderColor}/60`)
                            : "border-border-subtle bg-glass-light hover:bg-glass-medium hover:border-border-default",
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="create-format-glow"
                            className={cn(
                              "absolute inset-0 rounded-xl opacity-20",
                              "bg-gradient-to-br from-white/5 to-transparent",
                            )}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <Icon className={cn("size-6 relative z-10", isSelected ? opt.color : "text-text-tertiary")} />
                        <span className={cn("text-sm font-medium relative z-10", isSelected ? "text-text-primary" : "text-text-secondary")}>
                          {opt.name}
                        </span>
                        <span className="text-[10px] text-text-tertiary font-mono relative z-10">{opt.ext}</span>
                        <span className="text-[11px] text-text-tertiary leading-tight relative z-10">{opt.description}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-glass-medium border border-border-subtle text-xs text-text-secondary"
                    >
                      <Tag className="size-3" />
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-neon-pink transition-colors">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag..."
                    disabled={tags.length >= 10}
                    className="flex-1 rounded-xl bg-glass-light border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 transition-colors disabled:opacity-50"
                  />
                  <Button variant="glass" size="sm" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 10}>
                    Add
                  </Button>
                </div>
                <p className="text-[11px] text-text-tertiary">{tags.length}/10 tags</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-xl bg-neon-pink/10 border border-neon-pink/30 px-4 py-3 text-sm text-neon-pink"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={loading}
                onClick={handleCreate}
                disabled={!title.trim() || title.length > 200}
              >
                Create Document
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
