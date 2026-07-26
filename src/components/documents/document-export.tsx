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
import { convertContent } from "@/lib/document-convert";
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
    id: "pdf",
    name: "PDF",
    ext: ".pdf",
    mime: "application/pdf",
    icon: FileText,
    color: "text-neon-cyan",
    borderColor: "border-neon-cyan",
    description: "Print to PDF via browser dialog",
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
  {
    id: "docx",
    name: "Word Document",
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
    color: "text-neon-purple",
    borderColor: "border-neon-purple",
    description: "Microsoft Word compatible",
  },
];

function generateDocxContent(content: string, title: string): Blob {
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;}p{margin:0 0 6pt 0;}</style>
</head><body>${content.replace(/\n/g, "<br>")}</body></html>`;
  return new Blob([html], { type: "application/msword" });
}

export function DocumentExport() {
  const { currentDocument, rawContent, setActivePanel } = useDocumentStore();
  const credits = useExportCredits();
  const [selectedFormat, setSelectedFormat] = useState<string>("html");
  const [fileName, setFileName] = useState(currentDocument?.title ?? "document");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const estimateSize = useCallback(() => {
    const charBytes = new TextEncoder().encode(rawContent).length;
    if (selectedFormat === "html") return charBytes * 1.5;
    if (selectedFormat === "docx") return charBytes * 3.5;
    if (selectedFormat === "json") return charBytes * 1.2;
    if (selectedFormat === "md") return charBytes;
    return charBytes;
  }, [rawContent, selectedFormat]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const format = EXPORT_FORMATS.find((f) => f.id === selectedFormat);
      if (!format) throw new Error("Invalid format");

      // Convert rich content to proper format for export
      const docFormat = useDocumentStore.getState().currentDocument?.format;
      let content = rawContent;
      if (docFormat === "rich" || docFormat === "html") {
        try {
          JSON.parse(rawContent); // check if it's JSON (TipTap content)
          if (format.id === "html" || format.id === "docx") {
            content = convertContent("rich", "html", rawContent);
          } else if (format.id === "md") {
            content = convertContent("rich", "markdown", rawContent);
          } else if (format.id === "txt") {
            content = convertContent("rich", "text", rawContent);
          }
        } catch { /* not JSON, use raw */ }
      }

      if (format.id === "html" && !content.trim().startsWith("<")) {
        content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title></head><body>${content.replace(/\n/g, "<br>")}</body></html>`;
      }

      let blob: Blob;
      if (format.id === "pdf") {
        // Generate styled HTML for print
        const printHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title>
<style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;color:#222;max-width:800px;margin:0 auto;padding:40px;}
h1{font-size:24pt;margin-top:24pt;margin-bottom:12pt;}
h2{font-size:18pt;margin-top:18pt;margin-bottom:9pt;}
h3{font-size:14pt;margin-top:14pt;margin-bottom:7pt;}
p{margin:0 0 6pt 0;}
pre{background:#f5f5f5;padding:12pt;border-radius:4pt;font-size:10pt;overflow-x:auto;}
code{background:#f0f0f0;padding:1pt 3pt;border-radius:2pt;font-size:10pt;}
blockquote{border-left:3pt solid #ccc;padding-left:12pt;margin:12pt 0;color:#555;}
table{border-collapse:collapse;width:100%;margin:12pt 0;}
th,td{border:1pt solid #ddd;padding:6pt 8pt;text-align:left;}
th{background:#f5f5f5;}
img{max-width:100%;}
</style></head><body>${content}</body></html>`;
        const printBlob = new Blob([printHtml], { type: "text/html" });
        const printUrl = URL.createObjectURL(printBlob);
        const w = window.open(printUrl, "_blank");
        if (w) {
          w.onload = () => { w.print(); URL.revokeObjectURL(printUrl); };
        }
        setExported(true);
        setTimeout(() => setExported(false), 3000);
        setLoading(false);
        return;
      } else if (format.id === "docx") {
        blob = generateDocxContent(content, fileName);
      } else {
        blob = new Blob([content], { type: format.mime });
      }

      setPreview(content.slice(0, 500));

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}${format.ext}`;
      a.click();
      URL.revokeObjectURL(url);

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
