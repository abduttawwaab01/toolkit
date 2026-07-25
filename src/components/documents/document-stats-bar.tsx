"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  Type,
  Hash,
  AlignLeft,
  HardDrive,
  Clock,
  ZoomIn,
  ZoomOut,
  FileText,
  Code2,
  FileType,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import type { DocumentFormat } from "@/types/document";

const FORMAT_BADGE: Record<DocumentFormat, { label: string; color: string; icon: React.ElementType }> = {
  rich: { label: "Rich Text", color: "text-neon-cyan", icon: FileText },
  markdown: { label: "Markdown", color: "text-neon-purple", icon: Code2 },
  text: { label: "Text", color: "text-text-secondary", icon: FileType },
  html: { label: "HTML", color: "text-neon-pink", icon: FileCode },
};

function SaveIndicator({ isSaving, isDirty }: { isSaving: boolean; isDirty: boolean }) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5">
        <motion.div
          className="size-1.5 rounded-full bg-yellow-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
        <span className="text-[11px] text-yellow-400">Saving...</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full bg-red-400" />
        <span className="text-[11px] text-red-400">Unsaved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="size-1.5 rounded-full bg-green-400" />
      <span className="text-[11px] text-green-400">Saved</span>
    </div>
  );
}

export function DocumentStatsBar() {
  const {
    currentDocument,
    wordCount,
    charCount,
    rawContent,
    isDirty,
    isSaving,
    lastSaved,
    zoom,
    setZoom,
  } = useDocumentStore();

  const lineCount = rawContent ? rawContent.split("\n").length : 0;
  const format = currentDocument?.format ?? "rich";
  const fmtCfg = FORMAT_BADGE[format];
  const FmtIcon = fmtCfg.icon;

  const zoomIn = useCallback(() => setZoom(Math.min(200, zoom + 10)), [zoom, setZoom]);
  const zoomOut = useCallback(() => setZoom(Math.max(50, zoom - 10)), [zoom, setZoom]);

  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return null;
    const d = new Date(lastSaved);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [lastSaved]);

  const savedTime = formatLastSaved();

  return (
    <div className="flex items-center h-7 px-3 bg-surface-secondary border-t border-border-subtle text-[11px] text-text-tertiary select-none shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-1">
          <Type className="size-3" />
          <span>{wordCount.toLocaleString()} words</span>
        </div>

        <div className="w-px h-3 bg-border-subtle" />

        <div className="flex items-center gap-1">
          <Hash className="size-3" />
          <span>{charCount.toLocaleString()} chars</span>
        </div>

        <div className="w-px h-3 bg-border-subtle" />

        <div className="flex items-center gap-1">
          <AlignLeft className="size-3" />
          <span>{lineCount} lines</span>
        </div>

        <div className="w-px h-3 bg-border-subtle" />

        <div className={cn("flex items-center gap-1", fmtCfg.color)}>
          <FmtIcon className="size-3" />
          <span>{fmtCfg.label}</span>
        </div>

        {currentDocument && (
          <>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1">
              <HardDrive className="size-3" />
              <span>{formatBytes(currentDocument.size)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <SaveIndicator isSaving={isSaving} isDirty={isDirty} />

        {savedTime && (
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{savedTime}</span>
          </div>
        )}

        <div className="w-px h-3 bg-border-subtle" />

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-0.5 rounded hover:bg-glass-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ZoomOut className="size-3" />
          </button>
          <span className="w-8 text-center font-mono">{zoom}%</span>
          <button
            onClick={zoomIn}
            className="p-0.5 rounded hover:bg-glass-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ZoomIn className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
