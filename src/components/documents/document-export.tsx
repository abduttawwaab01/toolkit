"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileType,
  Code2,
  FileCode,
  Download,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import { useExportCredits } from "@/hooks/use-export-credits";
import { CreditSpendDialog } from "@/components/credits/credit-spend-dialog";
import { CreditPurchaseModal } from "@/components/credits/credit-purchase-modal";

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
    id: "html",
    name: "HTML",
    ext: ".html",
    mime: "text/html",
    icon: FileCode,
    color: "text-neon-pink",
    borderColor: "border-neon-pink",
    description: "Web-ready HTML document",
  },
  {
    id: "docx",
    name: "Word Document",
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
    color: "text-neon-cyan",
    borderColor: "border-neon-cyan",
    description: "Microsoft Word compatible",
  },
];

export function DocumentExport() {
  const { currentDocument, rawContent, setActivePanel, setShowExportDialog } = useDocumentStore();
  const [selectedFormat, setSelectedFormat] = useState<string>("html");
  const [fileName, setFileName] = useState(currentDocument?.title ?? "document");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const credits = useExportCredits();

  const estimateSize = useCallback(() => {
    const charBytes = new TextEncoder().encode(rawContent).length;
    const format = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
    if (selectedFormat === "html") return charBytes * 1.5;
    if (selectedFormat === "docx") return charBytes * 3.5;
    if (selectedFormat === "md") return charBytes;
    return charBytes;
  }, [rawContent, selectedFormat]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allowed = await credits.checkExportCredits(0);
      if (!allowed) {
        setLoading(false);
        return;
      }

      const format = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
      if (!format) throw new Error("Invalid format");

      const res = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: currentDocument?.id,
          format: selectedFormat,
          content: rawContent,
          title: fileName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }

      if (selectedFormat === "docx") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}${format.ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        setPreview(data.content);
        const blob = new Blob([data.content], { type: format.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}${format.ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }, [selectedFormat, fileName, rawContent, currentDocument, credits]);

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
                    onClick={() => {
                      setSelectedFormat(format.id);
                      setPreview(null);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-300",
                      "border backdrop-blur-sm",
                      isSelected
                        ? cn("bg-glass-heavy shadow-lg", `${format.borderColor}/60`)
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

          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
                Preview
              </label>
              <div className="rounded-xl bg-[#0d0d14] border border-border-subtle p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {preview}
                </pre>
              </div>
            </motion.div>
          )}

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

      {credits.showSpendDialog && (
        <CreditSpendDialog
          feature="export"
          featureLabel="Document Export"
          creditsCost={credits.pendingCost}
          onSpend={credits.confirmSpend}
          onCancel={credits.cancelSpend}
          loading={credits.spending}
        />
      )}

      <CreditPurchaseModal
        open={credits.showPurchaseModal}
        onClose={() => credits.setShowPurchaseModal(false)}
      />
    </motion.div>
  );
}
