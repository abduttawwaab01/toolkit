"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, X, FileType, FileCode, ImageIcon, Eye, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFileSupported, isVisualFileType, getFileLabel, importFile, importVisualPdf, importVisualDocx, getSupportedFileTypes, type ImportResult } from "@/lib/document-import-service";

interface FileUploadZoneProps {
  onImport: (result: ImportResult) => void;
  disabled?: boolean;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  PDF: FileText,
  DOCX: FileText,
  DOC: FileText,
  Text: FileType,
  Markdown: FileCode,
  HTML: FileCode,
  Image: ImageIcon,
  RTF: FileText,
  ODT: FileText,
};

export function FileUploadZone({ onImport, disabled }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File, visualMode: boolean) => {
    setImporting(true);
    setError(null);
    setSuccess(null);
    setPendingFile(null);

    try {
      let result: ImportResult;
      if (visualMode) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (ext === "pdf") {
          result = await importVisualPdf(file);
        } else {
          result = await importVisualDocx(file);
        }
      } else {
        result = await importFile(file);
      }
      setSuccess(`Imported ${getFileLabel(file)}${visualMode ? " (visual edit)" : ""}`);
      onImport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setImporting(false);
    }
  }, [onImport]);

  const handleFile = useCallback(async (file: File) => {
    if (importing) return;
    setError(null);
    setSuccess(null);

    if (!isFileSupported(file)) {
      setError(`Unsupported file type. Supported: ${getSupportedFileTypes()}`);
      return;
    }

    if (isVisualFileType(file)) {
      setPendingFile(file);
      return;
    }

    await processFile(file, false);
  }, [importing, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      handleFile(file);
    }
    e.target.value = "";
  };

  const clearStatus = () => { setError(null); setSuccess(null); };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.html,.htm,.rtf,.odt,.png,.jpg,.jpeg,.webp,.gif,.svg"
        onChange={handleInputChange}
        className="hidden"
        disabled={importing || disabled}
      />

      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          disabled
            ? "border-border-subtle bg-surface-secondary/50 opacity-50 cursor-not-allowed"
            : dragOver
              ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_30px_rgba(0,245,212,0.1)]"
              : "border-border-subtle bg-glass-light hover:border-neon-cyan/40 hover:bg-glass-medium",
        )}
      >
        <AnimatePresence mode="wait">
          {importing ? (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="size-14 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                <Loader2 className="size-6 text-neon-cyan animate-spin" />
              </div>
              <p className="text-sm font-medium text-text-primary">Importing file...</p>
            </motion.div>
          ) : dragOver ? (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="size-14 rounded-full bg-neon-cyan/15 flex items-center justify-center">
                <Upload className="size-6 text-neon-cyan" />
              </div>
              <p className="text-sm font-medium text-neon-cyan">Drop file here</p>
              <p className="text-xs text-text-tertiary">Release to import</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="size-14 rounded-full bg-glass-medium border border-border-subtle flex items-center justify-center">
                <Upload className="size-6 text-text-secondary" />
              </div>
              <p className="text-sm font-medium text-text-primary">
                Drop files here or <span className="text-neon-cyan">browse</span>
              </p>
              <p className="text-xs text-text-tertiary max-w-md">
                Supports PDF, DOCX, DOC, TXT, MD, HTML, RTF, ODT, PNG, JPG, WebP, GIF, SVG
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Import mode choice dialog */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setPendingFile(null)}
          >
            <div
              className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">Import {pendingFile.name}</h3>
              <p className="text-xs text-text-tertiary mb-4">Choose how you want to import this document:</p>

              <div className="space-y-2">
                <button
                  onClick={() => processFile(pendingFile, true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-colors text-left group"
                >
                  <div className="size-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-neon-cyan/20 transition-colors">
                    <Eye size={18} className="text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary">Visual Edit</p>
                    <p className="text-[10px] text-text-tertiary">Preserve original layout. Edit text in place.</p>
                  </div>
                </button>

                <button
                  onClick={() => processFile(pendingFile, false)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:bg-glass-medium transition-colors text-left group"
                >
                  <div className="size-10 rounded-lg bg-glass-medium flex items-center justify-center shrink-0 group-hover:bg-glass-light transition-colors">
                    <FileSearch size={18} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary">Text Extract</p>
                    <p className="text-[10px] text-text-tertiary">Extract content only. Edit as rich text.</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setPendingFile(null)}
                className="mt-3 w-full text-[10px] text-text-tertiary hover:text-text-secondary transition-colors py-1"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "mt-3 flex items-center justify-between gap-3 rounded-xl p-3 text-sm",
              error
                ? "bg-neon-pink/10 border border-neon-pink/30 text-neon-pink"
                : "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan",
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {error ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
              <span className="truncate">{error || success}</span>
            </div>
            <button onClick={clearStatus} className="shrink-0 hover:opacity-70 transition-opacity">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
