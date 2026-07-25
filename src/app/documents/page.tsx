"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Save,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Code2,
  FileType,
  FileCode,
  History,
  ArrowRightLeft,
  Download,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import { DocumentList } from "@/components/documents/document-list";
import { CreateDocumentDialog } from "@/components/documents/create-document-dialog";
import { DocumentStatsBar } from "@/components/documents/document-stats-bar";
import { DocumentConverter } from "@/components/documents/document-converter";
import { DocumentVersions } from "@/components/documents/document-versions";
import { DocumentExport } from "@/components/documents/document-export";
import { Editor } from "@/components/documents/editor";
import type { Document, DocumentFormat } from "@/types/document";

const FORMAT_CONFIG: Record<DocumentFormat, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  rich: { label: "Rich Text", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/30", icon: FileText },
  markdown: { label: "Markdown", color: "text-neon-purple", bg: "bg-neon-purple/10 border-neon-purple/30", icon: Code2 },
  text: { label: "Plain Text", color: "text-text-secondary", bg: "bg-glass-medium border-border-default", icon: FileType },
  html: { label: "HTML", color: "text-neon-pink", bg: "bg-neon-pink/10 border-neon-pink/30", icon: FileCode },
};

export default function DocumentsPage() {
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [sidebarTab, setSidebarTab] = useState<"info" | "convert" | "versions" | "export">("info");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    documents,
    currentDocument,
    setCurrentDocument,
    setEditorContent,
    setRawContent,
    setIsDirty,
    setIsSaving,
    setLastSaved,
    setWordCount,
    setCharCount,
    setVersions,
    isDirty,
    isSaving,
    loadDocuments,
    saveCurrentDocument,
    reset,
  } = useDocumentStore();

  const stats = documents.length > 0
    ? {
        totalDocuments: documents.length,
        totalSize: documents.reduce((s, d) => s + (d.size || 0), 0),
        totalWords: documents.reduce((s, d) => s + (d.wordCount || 0), 0),
      }
    : null;

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const loadDocVersions = useCallback((docId: string) => {
    const stored = localStorage.getItem(`toolkit-versions-${docId}`);
    if (stored) {
      try { setVersions(JSON.parse(stored)); } catch { setVersions([]); }
    } else {
      setVersions([]);
    }
  }, [setVersions]);

  const handleSelectDocument = useCallback((doc: Document) => {
    setCurrentDocument(doc);
    setEditorContent(doc.content as Record<string, unknown>);
    const raw = typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content || {}, null, 2);
    setRawContent(raw);
    setWordCount(doc.wordCount || 0);
    setCharCount(raw.length);
    setIsDirty(false);
    loadDocVersions(doc.id);
    setView("editor");
    setSidebarTab("info");
  }, [setCurrentDocument, setEditorContent, setRawContent, setWordCount, setCharCount, setVersions, setIsDirty, loadDocVersions]);

  const handleCreateDocument = useCallback((doc: Document) => {
    setCurrentDocument(doc);
    setEditorContent(doc.content as Record<string, unknown>);
    const raw = typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content || {}, null, 2);
    setRawContent(raw);
    setWordCount(0);
    setCharCount(0);
    setIsDirty(false);
    setVersions([]);
    setView("editor");
    setSidebarTab("info");
  }, [setCurrentDocument, setEditorContent, setRawContent, setWordCount, setCharCount, setIsDirty, setVersions]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    saveCurrentDocument();
  }, [saveCurrentDocument, setIsSaving]);

  const handleContentChange = useCallback(
    (content: Record<string, unknown> | string) => {
      if (typeof content === "object") {
        setEditorContent(content);
      } else {
        setRawContent(content);
      }
      setIsDirty(true);

      const raw = typeof content === "string" ? content : JSON.stringify(content);
      const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
      const chars = raw.length;
      setWordCount(words);
      setCharCount(chars);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveCurrentDocument();
      }, 3000);
    },
    [setEditorContent, setRawContent, setIsDirty, setWordCount, setCharCount, saveCurrentDocument],
  );

  const handleBack = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (isDirty) {
      saveCurrentDocument();
    }
    reset();
    loadDocuments();
    setView("dashboard");
  }, [isDirty, saveCurrentDocument, reset, loadDocuments]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const sidebarItems = [
    { id: "info" as const, label: "Info", icon: FileText },
    { id: "versions" as const, label: "Versions", icon: History },
    { id: "convert" as const, label: "Convert", icon: ArrowRightLeft },
    { id: "export" as const, label: "Export", icon: Download },
  ];

  const formatCfg = currentDocument ? FORMAT_CONFIG[currentDocument.format] : FORMAT_CONFIG.rich;
  const FormatIcon = formatCfg.icon;

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <AnimatePresence mode="wait">
        {view === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a href="/" className="size-10 rounded-xl bg-glass-medium border border-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-glass-heavy transition-colors">
                  <ArrowLeft className="size-4" />
                </a>
                <div className="size-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
                  <FileText className="size-5 text-neon-cyan" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-text-primary">
                    <span className="gradient-text">Documents</span>
                  </h1>
                  <p className="text-xs text-text-tertiary">Create, edit, and convert documents</p>
                </div>
              </div>
              <Button variant="neon" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="size-4" />
                New Document
              </Button>
            </div>

            {stats && (
              <div className="px-6 py-3 flex gap-4 border-b border-border-subtle/50">
                {[
                  { label: "Documents", value: stats.totalDocuments, color: "text-neon-cyan" },
                  { label: "Total Words", value: stats.totalWords.toLocaleString(), color: "text-neon-purple" },
                  { label: "Total Size", value: formatBytes(stats.totalSize), color: "text-neon-pink" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={cn("text-lg font-bold font-display", s.color)}>{s.value}</span>
                    <span className="text-xs text-text-tertiary">{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <DocumentList onEdit={handleSelectDocument} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="h-12 px-3 flex items-center gap-2 border-b border-border-subtle bg-surface-secondary shrink-0">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="size-3.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="w-px h-5 bg-border-subtle" />

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
              </button>

              {currentDocument && (
                <>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={currentDocument.title}
                      onChange={(e) => {
                        setCurrentDocument({ ...currentDocument, title: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-full bg-transparent text-sm font-medium text-text-primary truncate focus:outline-none"
                    />
                  </div>

                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium", formatCfg.bg, formatCfg.color)}>
                    <FormatIcon className="size-3" />
                    {formatCfg.label}
                  </div>

                  <div className="w-px h-5 bg-border-subtle" />

                  <Button
                    variant={isDirty ? "neon" : "ghost"}
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="gap-1.5"
                  >
                    {isSaving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-1 min-h-0 relative">
              <AnimatePresence>
                {sidebarOpen && currentDocument && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="md:relative md:border-r border-border-subtle bg-surface-secondary overflow-hidden shrink-0 absolute inset-y-0 left-0 z-30 md:z-auto shadow-2xl md:shadow-none"
                  >
                    <div className="w-[280px] md:w-[280px] h-full flex flex-col">
                      <div className="flex border-b border-border-subtle">
                        {sidebarItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSidebarTab(item.id)}
                              className={cn(
                                "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors border-b-2",
                                sidebarTab === item.id
                                  ? "text-neon-cyan border-neon-cyan bg-neon-cyan/5"
                                  : "text-text-tertiary border-transparent hover:text-text-secondary hover:bg-glass-light",
                              )}
                            >
                              <Icon className="size-3.5" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {sidebarTab === "info" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">Description</label>
                              <textarea
                                value={currentDocument?.description || ""}
                                onChange={(e) => {
                                  if (currentDocument) {
                                    setCurrentDocument({ ...currentDocument, description: e.target.value });
                                    setIsDirty(true);
                                  }
                                }}
                                placeholder="Add a description..."
                                rows={3}
                                className="w-full rounded-xl bg-glass-light border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 transition-colors resize-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium flex items-center gap-1">
                                <Tag className="size-3" />
                                Tags
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  let tags: string[] = [];
                                  try {
                                    const raw = currentDocument?.tags;
                                    if (typeof raw === "string") {
                                      tags = JSON.parse(raw);
                                      if (!Array.isArray(tags)) tags = [];
                                    } else if (Array.isArray(raw)) {
                                      tags = raw;
                                    }
                                  } catch { tags = []; }
                                  return tags.map((tag: string) => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-glass-medium border border-border-subtle text-[11px] text-text-secondary">
                                      {tag}
                                      <button
                                        onClick={() => {
                                          if (currentDocument) {
                                            const newTags = tags.filter((t: string) => t !== tag);
                                            setCurrentDocument({ ...currentDocument, tags: JSON.stringify(newTags) });
                                            setIsDirty(true);
                                          }
                                        }}
                                        className="hover:text-neon-pink"
                                      >
                                        <X className="size-2.5" />
                                      </button>
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border-subtle">
                              <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">Details</h4>
                              <div className="space-y-1.5 text-xs text-text-secondary">
                                <div className="flex justify-between">
                                  <span>Created</span>
                                  <span>{currentDocument ? new Date(currentDocument.createdAt).toLocaleDateString() : "\u2014"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Updated</span>
                                  <span>{currentDocument ? new Date(currentDocument.updatedAt).toLocaleDateString() : "\u2014"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Size</span>
                                  <span>{currentDocument ? formatBytes(currentDocument.size ?? 0) : "\u2014"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Words</span>
                                  <span>{currentDocument?.wordCount?.toLocaleString() ?? "\u2014"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {sidebarTab === "versions" && <DocumentVersions />}
                        {sidebarTab === "convert" && <DocumentConverter />}
                        {sidebarTab === "export" && <DocumentExport />}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 flex flex-col min-w-0">
                {currentDocument ? (
                  <>
                    <div className="flex-1 min-h-0">
                      <Editor
                        documentId={currentDocument.id}
                        format={currentDocument.format}
                        initialContent={currentDocument.content}
                        onUpdate={handleContentChange}
                      />
                    </div>
                    <DocumentStatsBar />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="size-8 text-text-tertiary animate-spin mx-auto" />
                      <p className="text-sm text-text-secondary">Loading document...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateDocumentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCreateDocument}
      />
    </div>
  );
}
