"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileType, Code2, FileCode, Download, Loader2, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import { convertContent } from "@/lib/document-convert";
import { exportDocument } from "@/lib/document-export-service";

interface ExportFormat {
  id: string;
  name: string;
  ext: string;
  mime: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  description: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "pdf",
    name: "PDF",
    ext: ".pdf",
    mime: "application/pdf",
    icon: FileText,
    color: "text-neon-cyan",
    borderColor: "border-neon-cyan",
    description: "Professional PDF with proper formatting",
  },
  {
    id: "docx",
    name: "Word",
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
    color: "text-neon-purple",
    borderColor: "border-neon-purple",
    description: "Microsoft Word document",
  },
  {
    id: "html",
    name: "HTML",
    ext: ".html",
    mime: "text/html",
    icon: FileCode,
    color: "text-neon-pink",
    borderColor: "border-neon-pink",
    description: "Styled HTML document",
  },
  {
    id: "md",
    name: "Markdown",
    ext: ".md",
    mime: "text/markdown",
    icon: Code2,
    color: "text-neon-purple",
    borderColor: "border-neon-purple",
    description: "Lightweight markup language",
  },
  {
    id: "txt",
    name: "Plain Text",
    ext: ".txt",
    mime: "text/plain",
    icon: FileType,
    color: "text-text-secondary",
    borderColor: "border-text-secondary",
    description: "Raw text without formatting",
  },
  {
    id: "json",
    name: "JSON",
    ext: ".json",
    mime: "application/json",
    icon: FileCode,
    color: "text-neon-pink",
    borderColor: "border-neon-pink",
    description: "Raw document data as JSON",
  },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  FileText, FileType, Code2, FileCode,
};

export function DocumentExport() {
  const { currentDocument, rawContent, setActivePanel } = useDocumentStore();
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [fileName, setFileName] = useState(currentDocument?.title ?? "document");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const estimateSize = useCallback(() => {
    const bytes = new TextEncoder().encode(rawContent).length;
    const multipliers: Record<string, number> = { pdf: 4, docx: 3.5, html: 1.5, json: 1.2, md: 1, txt: 1 };
    return Math.round(bytes * (multipliers[selectedFormat] || 1));
  }, [rawContent, selectedFormat]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const format = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
      if (!format) throw new Error("Invalid format");

      const state = useDocumentStore.getState();
      const docFormat = state.currentDocument?.format;
      let content = rawContent;

      if (docFormat === "rich" || docFormat === "html") {
        try {
          JSON.parse(rawContent);
          const conversionMap: Record<string, string> = { html: "html", docx: "html", pdf: "html", md: "markdown", txt: "text" };
          const target = conversionMap[selectedFormat];
          if (target) content = convertContent("rich", target, rawContent);
        } catch {}
      }

      const blob = await exportDocument({ content, title: fileName, format: selectedFormat, docFormat });
      if (!blob) throw new Error("Failed to generate export");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}${format.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }, [selectedFormat, fileName, rawContent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary">Export Document</h2>
        <Button variant="ghost" size="sm" onClick={() => setActivePanel("editor")}>
          <ArrowLeft className="size-4" /> Back
        </Button>
      </div>

      <GlassCard className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-xl mx-auto">
          <div>
            <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              File Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 rounded-xl bg-surface-secondary border border-border-subtle px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-neon-cyan/40 transition-colors"
              />
              <span className="text-sm text-text-tertiary font-mono">
                {EXPORT_FORMATS.find((f) => f.id === selectedFormat)?.ext}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;

                return (
                  <motion.button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-300",
                      "border backdrop-blur-sm",
                      isSelected
                        ? cn("bg-glass-heavy shadow-lg border", `${format.borderColor}/60`)
                        : "border-border-subtle bg-glass-light hover:bg-glass-medium hover:border-border-default",
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="export-glow"
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {format.id === "pdf" && isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-1.5 -right-1.5"
                      >
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-cyan text-[9px] font-bold text-black uppercase">
                          <Sparkles className="size-2.5" /> Best
                        </span>
                      </motion.div>
                    )}
                    <Icon className={cn("size-6 relative z-10", isSelected ? format.color : "text-text-tertiary")} />
                    <span className={cn("text-sm font-medium relative z-10", isSelected ? "text-text-primary" : "text-text-secondary")}>
                      {format.name}
                    </span>
                    <span className="text-[11px] text-text-tertiary leading-tight relative z-10">
                      {format.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface-secondary border border-border-subtle p-4">
            <span className="text-sm text-text-secondary">Estimated size</span>
            <span className="text-sm font-mono text-neon-cyan">{formatBytes(estimateSize())}</span>
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
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {exported && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 p-4 text-sm text-neon-cyan text-center"
              >
                Export complete! Check your downloads.
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            onClick={handleExport}
          >
            <Download className="size-5" />
            Export as {EXPORT_FORMATS.find((f) => f.id === selectedFormat)?.name}
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
