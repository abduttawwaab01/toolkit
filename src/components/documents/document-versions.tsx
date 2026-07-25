"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  RotateCcw,
  FileText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import type { DocumentVersion } from "@/types/document";

function DiffView({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const diff = useMemo(() => {
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");
    const maxLen = Math.max(oldLines.length, newLines.length);
    const result: { type: "added" | "removed" | "unchanged"; line: string; lineNum: number }[] = [];

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        result.push({ type: "added", line: newLine, lineNum: i + 1 });
      } else if (newLine === undefined) {
        result.push({ type: "removed", line: oldLine, lineNum: i + 1 });
      } else if (oldLine === newLine) {
        result.push({ type: "unchanged", line: oldLine, lineNum: i + 1 });
      } else {
        result.push({ type: "removed", line: oldLine, lineNum: i + 1 });
        result.push({ type: "added", line: newLine, lineNum: i + 1 });
      }
    }
    return result;
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    const added = diff.filter((d) => d.type === "added").length;
    const removed = diff.filter((d) => d.type === "removed").length;
    return { added, removed };
  }, [diff]);

  return (
    <div className="rounded-xl bg-[#0d0d14] border border-border-subtle overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border-subtle text-[11px]">
        <span className="text-green-400">+{stats.added} added</span>
        <span className="text-red-400">-{stats.removed} removed</span>
      </div>
      <div className="max-h-60 overflow-y-auto p-2">
        {diff.map((d, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start font-mono text-xs leading-6 px-2 rounded",
              d.type === "added" && "bg-green-500/10 text-green-400",
              d.type === "removed" && "bg-red-500/10 text-red-400 line-through opacity-70",
              d.type === "unchanged" && "text-text-tertiary",
            )}
          >
            <span className="w-8 shrink-0 text-right pr-3 text-text-tertiary/50 select-none">{d.lineNum}</span>
            <span className="w-4 shrink-0 text-center select-none">
              {d.type === "added" && "+"}
              {d.type === "removed" && "-"}
            </span>
            <span className="whitespace-pre-wrap break-all">{d.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentVersions() {
  const { versions, currentVersion, setCurrentVersion, setCurrentDocument, setActivePanel } = useDocumentStore();
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [previewing, setPreviewing] = useState<DocumentVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions],
  );

  const handlePreview = useCallback((v: DocumentVersion) => {
    setPreviewing(v);
    setSelectedVersion(v);
  }, []);

  const handleRestore = useCallback(
    async (version: DocumentVersion) => {
      setRestoring(true);
      try {
        setCurrentDocument({
          ...(useDocumentStore.getState().currentDocument as any),
          content: version.content,
          updatedAt: new Date().toISOString(),
        });
        setActivePanel("editor");
      } finally {
        setRestoring(false);
      }
    },
    [setCurrentDocument, setActivePanel],
  );

  const formatDate = useCallback((date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatContent = useCallback((content: Record<string, unknown>): string => {
    const text = (content as any)?.text ?? JSON.stringify(content, null, 2);
    if (typeof text === "string") return text;
    return JSON.stringify(content, null, 2);
  }, []);

  if (versions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-text-primary">Version History</h2>
          <Button variant="ghost" size="sm" onClick={() => setActivePanel("editor")}>
            Back to Editor
          </Button>
        </div>
        <GlassCard className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="size-16 rounded-2xl bg-glass-light border border-border-subtle flex items-center justify-center mx-auto">
              <Clock className="size-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary text-sm">No versions yet</p>
            <p className="text-text-tertiary text-xs">Versions are saved automatically as you edit</p>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary">
          Version History
          <span className="text-sm text-text-tertiary font-normal ml-2">({versions.length} versions)</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setActivePanel("editor")}>
          Back to Editor
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-64 shrink-0 overflow-y-auto pr-2 space-y-1">
          {sortedVersions.map((version, i) => {
            const isCurrent = version.version === currentVersion;
            const isSelected = selectedVersion?.id === version.id;

            return (
              <motion.button
                key={version.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handlePreview(version)}
                className={cn(
                  "relative w-full text-left rounded-xl p-3 transition-all duration-200 group",
                  isSelected
                    ? "bg-glass-heavy border border-neon-cyan/40 shadow-[0_0_15px_rgba(0,245,212,0.08)]"
                    : "border border-transparent hover:bg-glass-medium",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex flex-col items-center pt-1">
                    <div
                      className={cn(
                        "size-3 rounded-full border-2 shrink-0 z-10",
                        isCurrent
                          ? "bg-neon-cyan border-neon-cyan shadow-[0_0_8px_rgba(0,245,212,0.5)]"
                          : "bg-glass-medium border-border-default",
                      )}
                    />
                    {i < sortedVersions.length - 1 && (
                      <div className="w-px h-6 bg-border-subtle mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", isCurrent ? "text-neon-cyan" : "text-text-primary")}>
                        v{version.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 font-medium">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatDate(version.createdAt)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-tertiary">
                      <span>{(version.wordCount ?? 0).toLocaleString()} words</span>
                      <span>{formatBytes(version.size ?? 0)}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 mt-1 transition-all",
                      isSelected ? "text-neon-cyan opacity-100" : "text-text-tertiary opacity-0 group-hover:opacity-100",
                    )}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {previewing ? (
              <motion.div
                key={previewing.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">Version {previewing.version}</h3>
                    <p className="text-xs text-text-tertiary">{formatDate(previewing.createdAt)}</p>
                  </div>
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={() => handleRestore(previewing)}
                    loading={restoring}
                    disabled={previewing.version === currentVersion}
                  >
                    <RotateCcw className="size-4" />
                    Restore
                  </Button>
                </div>

                <GlassCard className="p-4">
                  <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Content Preview</h4>
                    <p className="text-sm font-mono text-text-secondary whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                    {formatContent(previewing.content ?? {})}
                  </p>
                </GlassCard>

                {selectedVersion && selectedVersion.id !== previewing.id && (
                  <GlassCard className="p-4">
                    <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Diff</h4>
                    <DiffView
                      oldContent={formatContent(previewing.content ?? {})}
                      newContent={formatContent(selectedVersion.content ?? {})}
                    />
                  </GlassCard>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <p className="text-sm text-text-tertiary">Select a version to preview</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
