"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  List,
  Search,
  Filter,
  ChevronDown,
  FileText,
  FileType,
  Code2,
  FileCode,
  Pencil,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { useDocumentStore } from "@/lib/document-store";
import type { Document, DocumentFormat, DocumentFilters } from "@/types/document";

const FORMAT_CONFIG: Record<DocumentFormat, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  rich: { label: "Rich Text", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/30", icon: FileText },
  markdown: { label: "Markdown", color: "text-neon-purple", bg: "bg-neon-purple/10 border-neon-purple/30", icon: Code2 },
  text: { label: "Plain Text", color: "text-text-secondary", bg: "bg-glass-medium border-border-default", icon: FileType },
  html: { label: "HTML", color: "text-neon-pink", bg: "bg-neon-pink/10 border-neon-pink/30", icon: FileCode },
  visual: { label: "Visual Edit", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/30", icon: FileText },
};

function FormatBadge({ format }: { format: DocumentFormat }) {
  const cfg = FORMAT_CONFIG[format];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border", cfg.bg, cfg.color)}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-glass-medium rounded w-3/4 mb-3" />
      <div className="h-3 bg-glass-light rounded w-1/2 mb-4" />
      <div className="h-3 bg-glass-light rounded w-full mb-2" />
      <div className="h-3 bg-glass-light rounded w-2/3" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border-subtle">
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-24 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-3 bg-glass-medium rounded w-20 animate-pulse" /></td>
    </tr>
  );
}

export function DocumentList({ onEdit }: { onEdit?: (doc: Document) => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DocumentFilters>({
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: 1,
    limit: 12,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const documents = useDocumentStore((s) => s.documents);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);

  useEffect(() => {
    loadDocuments();
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [loadDocuments]);

  const formatDate = useCallback((date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }

    if (filters.format) {
      result = result.filter((d) => d.format === filters.format);
    }

    if (filters.isArchived !== undefined) {
      result = result.filter((d) => d.isArchived === filters.isArchived);
    }

    const sortBy = filters.sortBy || "updatedAt";
    const sortOrder = filters.sortOrder || "desc";
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "title") cmp = a.title.localeCompare(b.title);
      else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
      else if (sortBy === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortOrder === "desc" ? -cmp : cmp;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const start = (page - 1) * limit;
    return result.slice(start, start + limit);
  }, [documents, search, filters]);

  const totalFiltered = useMemo(() => {
    let result = [...documents];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }
    return result.length;
  }, [documents, search]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / (filters.limit || 12)));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredDocs.length) return new Set();
      return new Set(filteredDocs.map((d) => d.id));
    });
  }, [filteredDocs]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} document${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    selectedIds.forEach((id) => deleteDocument(id));
    setSelectedIds(new Set());
  }, [selectedIds, deleteDocument]);

  const handleBulkArchive = useCallback(() => {
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        const updated = { ...doc, isArchived: !doc.isArchived };
        const docs = documents.map((d) => (d.id === id ? updated : d));
        localStorage.setItem("toolkit-documents", JSON.stringify(docs));
        useDocumentStore.setState({ documents: docs });
      }
    });
    setSelectedIds(new Set());
  }, [selectedIds, documents]);

  const handleDelete = useCallback((id: string) => {
    deleteDocument(id);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteDocument]);

  const handleExport = useCallback((doc: Document) => {
    import("@/lib/document-convert").then(({ convertContent }) => {
      let raw = typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content, null, 2);
      // Convert rich/HTML content to readable text for export
      if (doc.format === "rich") {
        try {
          JSON.parse(raw);
          raw = convertContent("rich", "markdown", raw);
        } catch { /* use raw */ }
      }
      const mime = doc.format === "html" ? "text/html" : doc.format === "markdown" || doc.format === "rich" ? "text/markdown" : "text/plain";
      const ext = doc.format === "rich" ? "md" : doc.format === "markdown" ? "md" : "txt";
      const blob = new Blob([raw], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-glass-light border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 transition-colors"
          />
        </div>

        <Button variant="glass" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="size-4" />
          Filters
          <ChevronDown className={cn("size-3 transition-transform", showFilters && "rotate-180")} />
        </Button>

        <div className="flex rounded-lg border border-border-subtle overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={cn("p-2 transition-colors", view === "grid" ? "bg-glass-heavy text-neon-cyan" : "text-text-tertiary hover:text-text-secondary")}
          >
            <Grid3X3 className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-2 transition-colors", view === "list" ? "bg-glass-heavy text-neon-cyan" : "text-text-tertiary hover:text-text-secondary")}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass rounded-xl p-4 flex gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Format</label>
                <select
                  value={filters.format ?? ""}
                  onChange={(e) => setFilters((p) => ({ ...p, format: (e.target.value as DocumentFormat) || undefined }))}
                  className="bg-glass-light border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-neon-cyan/40"
                >
                  <option value="">All</option>
                  <option value="rich">Rich Text</option>
                  <option value="markdown">Markdown</option>
                  <option value="text">Plain Text</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Archived</label>
                <select
                  value={filters.isArchived === undefined ? "" : String(filters.isArchived)}
                  onChange={(e) => setFilters((p) => ({ ...p, isArchived: e.target.value === "" ? undefined : e.target.value === "true" }))}
                  className="bg-glass-light border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-neon-cyan/40"
                >
                  <option value="">All</option>
                  <option value="false">Active</option>
                  <option value="true">Archived</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Sort By</label>
                <select
                  value={filters.sortBy ?? "updatedAt"}
                  onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value as DocumentFilters["sortBy"] }))}
                  className="bg-glass-light border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-neon-cyan/40"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Date Created</option>
                  <option value="title">Title</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-3 mb-4 flex items-center gap-3"
        >
          <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleBulkArchive}>
            <Archive className="size-4" /> Archive
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-neon-pink hover:text-neon-pink/80">
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="size-4" />
          </Button>
        </motion.div>
      )}

      {loading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Title</th>
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Format</th>
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Words</th>
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Size</th>
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Updated</th>
                  <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        )
      ) : filteredDocs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="size-16 rounded-2xl bg-glass-light border border-border-subtle flex items-center justify-center mx-auto">
              <FileText className="size-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary text-sm">No documents found</p>
            <p className="text-text-tertiary text-xs">Create a new document to get started</p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {filteredDocs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "glass rounded-xl p-5 cursor-pointer group transition-all duration-300 hover:bg-glass-medium hover:shadow-lg hover:shadow-neon-cyan/5 hover:-translate-y-0.5 relative",
                selectedIds.has(doc.id) && "border-neon-cyan/50 shadow-[0_0_15px_rgba(0,245,212,0.1)]",
              )}
              onClick={() => onEdit?.(doc)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}
                className={cn(
                  "absolute top-3 right-3 size-5 rounded-md border flex items-center justify-center transition-all",
                  selectedIds.has(doc.id)
                    ? "bg-neon-cyan border-neon-cyan text-black"
                    : "border-border-subtle opacity-0 group-hover:opacity-100",
                )}
              >
                {selectedIds.has(doc.id) && <Check className="size-3" />}
              </button>

              <div className="mb-3">
                <FormatBadge format={doc.format} />
              </div>
              <h3 className="text-sm font-medium text-text-primary truncate mb-1">{doc.title}</h3>
              <p className="text-xs text-text-tertiary line-clamp-2 mb-3 leading-relaxed">
                {doc.description || `Document with ${doc.wordCount} words`}
              </p>
              <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                <span>{doc.wordCount.toLocaleString()} words</span>
                <span>{formatDate(doc.updatedAt)}</span>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(doc); }}
                  className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-cyan transition-colors"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExport(doc); }}
                  className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-purple transition-colors"
                >
                  <Download className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-pink transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="py-3 px-4">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      "size-4 rounded-sm border flex items-center justify-center transition-all",
                      selectedIds.size === filteredDocs.length && filteredDocs.length > 0
                        ? "bg-neon-cyan border-neon-cyan text-black"
                        : "border-border-subtle",
                    )}
                  >
                    {selectedIds.size === filteredDocs.length && filteredDocs.length > 0 && <Check className="size-2.5" />}
                  </button>
                </th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Title</th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Format</th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Words</th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Size</th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Updated</th>
                <th className="py-3 px-4 text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc, i) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onEdit?.(doc)}
                  className={cn(
                    "border-b border-border-subtle cursor-pointer transition-colors hover:bg-glass-medium",
                    selectedIds.has(doc.id) && "bg-neon-cyan/5",
                  )}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}
                      className={cn(
                        "size-4 rounded-sm border flex items-center justify-center transition-all",
                        selectedIds.has(doc.id) ? "bg-neon-cyan border-neon-cyan text-black" : "border-border-subtle",
                      )}
                    >
                      {selectedIds.has(doc.id) && <Check className="size-2.5" />}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary font-medium truncate max-w-[200px]">{doc.title}</td>
                  <td className="py-3 px-4"><FormatBadge format={doc.format} /></td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{doc.wordCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{formatBytes(doc.size ?? 0)}</td>
                  <td className="py-3 px-4 text-sm text-text-tertiary">{formatDate(doc.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(doc); }}
                        className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-cyan transition-colors"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExport(doc); }}
                        className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-purple transition-colors"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-1.5 rounded-lg hover:bg-glass-heavy text-text-tertiary hover:text-neon-pink transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredDocs.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>
            Showing {((filters.page ?? 1) - 1) * (filters.limit ?? 12) + 1}
            \u2013{Math.min((filters.page ?? 1) * (filters.limit ?? 12), totalFiltered)} of {totalFiltered} documents
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
              disabled={(filters.page ?? 1) <= 1}
              className="p-1.5 rounded-lg border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-glass-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 py-1 text-xs text-text-tertiary">
              Page {filters.page ?? 1} of {totalPages}
            </span>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, (p.page ?? 1) + 1) }))}
              disabled={(filters.page ?? 1) >= totalPages}
              className="p-1.5 rounded-lg border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-glass-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
