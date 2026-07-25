"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  FileText,
  FileType,
  Code2,
  FileCode,
  Copy,
  Download,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import { convertContent } from "@/lib/document-convert";
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
    description: "Formatted HTML with styling",
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

function FormatCard({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: FormatOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-300 w-full",
        "border backdrop-blur-sm",
        selected
          ? cn("bg-glass-heavy border-opacity-100 shadow-lg", `${option.borderColor}/60`)
          : "border-border-subtle bg-glass-light hover:bg-glass-medium",
        disabled && "opacity-30 cursor-not-allowed",
        !disabled && !selected && "hover:border-border-default",
      )}
    >
      {selected && (
        <motion.div
          layoutId="format-glow"
          className={cn(
            "absolute inset-0 rounded-xl opacity-20",
            `bg-gradient-to-br from-${option.id === "rich" ? "neon-cyan" : option.id === "markdown" ? "neon-purple" : option.id === "html" ? "neon-pink" : "text-secondary"} to-transparent`,
          )}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <Icon className={cn("size-6 relative z-10", selected ? option.color : "text-text-tertiary")} />
      <span className={cn("text-sm font-medium relative z-10", selected ? "text-text-primary" : "text-text-secondary")}>
        {option.name}
      </span>
      <span className="text-[10px] text-text-tertiary font-mono relative z-10">{option.ext}</span>
      <span className="text-[11px] text-text-tertiary leading-tight relative z-10">{option.description}</span>
    </motion.button>
  );
}

export function DocumentConverter() {
  const { currentDocument, rawContent, setRawContent, setActivePanel, createDocument } = useDocumentStore();

  const docFormat = currentDocument?.format ?? "rich";
  const [fromFormat, setFromFormat] = useState<DocumentFormat>(docFormat);
  const [toFormat, setToFormat] = useState<DocumentFormat>(() => {
    const opts: DocumentFormat[] = ["rich", "markdown", "text", "html"];
    return opts.find((f) => f !== docFormat) ?? "text";
  });
  const [inputContent, setInputContent] = useState(rawContent);
  const [useCurrentDoc, setUseCurrentDoc] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSwap = useCallback(() => {
    setFromFormat(toFormat);
    setToFormat(fromFormat);
    setResult(null);
    setError(null);
  }, [fromFormat, toFormat]);

  const handleConvert = useCallback(async () => {
    const content = useCurrentDoc ? rawContent : inputContent;
    if (!content.trim()) {
      setError("No content to convert");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const converted = convertContent(fromFormat, toFormat, content);
      setResult(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }, [fromFormat, toFormat, rawContent, inputContent, useCurrentDoc]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const ext = FORMAT_OPTIONS.find((f) => f.id === toFormat)?.ext ?? ".txt";
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDocument?.title ?? "converted"}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, toFormat, currentDocument]);

  const handleSaveAsNew = useCallback(() => {
    if (!result) return;
    try {
      const doc = createDocument({
        title: `${currentDocument?.title ?? "Untitled"} (${FORMAT_OPTIONS.find((f) => f.id === toFormat)?.name})`,
        format: toFormat,
      });
      // Update the newly created document with the converted content
      const updatedDoc = { ...doc, content: result as any, wordCount: result.trim() ? result.trim().split(/\s+/).length : 0 };
      const docs = useDocumentStore.getState().documents.map((d) => d.id === doc.id ? updatedDoc : d);
      localStorage.setItem("toolkit-documents", JSON.stringify(docs));
      useDocumentStore.setState({ documents: docs });
    } catch {
      setError("Failed to save document");
    }
  }, [result, toFormat, currentDocument, createDocument]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary">Format Converter</h2>
        <Button variant="ghost" size="sm" onClick={() => setActivePanel("editor")}>
          Back to Editor
        </Button>
      </div>

      <GlassCard className="flex-1 overflow-y-auto">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            <div>
              <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Convert From
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <FormatCard
                    key={opt.id}
                    option={opt}
                    selected={fromFormat === opt.id}
                    onSelect={() => {
                      setFromFormat(opt.id);
                      if (toFormat === opt.id) {
                        const next = FORMAT_OPTIONS.find((f) => f.id !== opt.id);
                        if (next) setToFormat(next.id);
                      }
                      setResult(null);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center pt-8">
              <motion.button
                onClick={handleSwap}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="size-12 rounded-full glass glass-hover flex items-center justify-center text-neon-cyan border border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,245,212,0.2)] transition-all duration-300"
              >
                <motion.div animate={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                  <ArrowRightLeft className="size-5" />
                </motion.div>
              </motion.button>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Convert To
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <FormatCard
                    key={opt.id}
                    option={opt}
                    selected={toFormat === opt.id}
                    disabled={opt.id === fromFormat}
                    onSelect={() => {
                      setToFormat(opt.id);
                      setResult(null);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Content
              </label>
              {currentDocument && (
                <button
                  onClick={() => setUseCurrentDoc(!useCurrentDoc)}
                  className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors flex items-center gap-1"
                >
                  <ChevronRight className={cn("size-3 transition-transform", useCurrentDoc && "rotate-90")} />
                  Load from current document
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {useCurrentDoc ? (
                <motion.div
                  key="current-doc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-surface-secondary border border-border-subtle p-3"
                >
                  <p className="text-sm text-text-secondary font-mono line-clamp-6 whitespace-pre-wrap">
                    {rawContent || "No content loaded."}
                  </p>
                </motion.div>
              ) : (
                <motion.textarea
                  key="manual-input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                  className="w-full h-40 rounded-xl bg-surface-secondary border border-border-subtle p-4 text-sm text-text-primary font-mono placeholder:text-text-tertiary resize-none focus:outline-none focus:border-neon-cyan/40 transition-colors"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleConvert}
              disabled={!inputContent && !rawContent}
            >
              Convert {FORMAT_OPTIONS.find((f) => f.id === fromFormat)?.name}
              {" \u2192 "}
              {FORMAT_OPTIONS.find((f) => f.id === toFormat)?.name}
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-xl bg-neon-pink/10 border border-neon-pink/30 p-4"
              >
                <AlertCircle className="size-5 text-neon-pink shrink-0" />
                <p className="text-sm text-neon-pink">{error}</p>
                <Button variant="ghost" size="sm" onClick={handleConvert} className="ml-auto">
                  <RefreshCw className="size-4" /> Retry
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-primary">Converted Result</h3>
                  <div className="flex gap-2">
                    <Button variant="glass" size="sm" onClick={handleCopy}>
                      <Copy className="size-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="glass" size="sm" onClick={handleDownload}>
                      <Download className="size-4" />
                      Download
                    </Button>
                    <Button variant="neon" size="sm" onClick={handleSaveAsNew}>
                      <Save className="size-4" />
                      Save as New
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl bg-[#0d0d14] border border-border-subtle p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm font-mono text-text-primary whitespace-pre-wrap break-words leading-relaxed">
                    <code>{result}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  );
}
