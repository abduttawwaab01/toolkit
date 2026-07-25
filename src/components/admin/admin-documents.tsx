"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Trash2, Eye, Plus, Save, X, ChevronLeft, ChevronRight, LayoutTemplate, Settings, Filter } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const FORMAT_OPTIONS = ["txt", "md", "html", "pdf", "docx", "rtf"];
const SUB_TABS = [
  { id: "all", label: "All Documents", icon: FileText },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "settings", label: "Document Settings", icon: Settings },
] as const;

interface DocWithUser {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  format: string;
  mimeType: string;
  extension: string;
  size: string;
  wordCount: number;
  isArchived: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string | null };
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  format: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

interface DocStats {
  totalDocuments: number;
  totalSize: string;
  totalWords: number;
  formatDistribution: Record<string, number>;
}

interface RoleSettings {
  role: string;
  maxDocuments: number;
  maxDocumentSizeKB: number;
  allowedDocFormats: string[];
}

interface GlobalSettings {
  enableDocumentFeature: boolean;
  enableConversions: boolean;
  defaultFormat: string;
  autoSaveInterval: number;
  maxVersions: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="glass" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="neon" size="sm" onClick={onConfirm} className="bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30">
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function TemplateModal({ open, template, onClose, onSave }: {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; category: string; format: string; isPublic: boolean }) => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [category, setCategory] = useState(template?.category || "general");
  const [format, setFormat] = useState(template?.format || "rich");
  const [isPublic, setIsPublic] = useState(template?.isPublic ?? true);

  useEffect(() => {
    setName(template?.name || "");
    setDescription(template?.description || "");
    setCategory(template?.category || "general");
    setFormat(template?.format || "rich");
    setIsPublic(template?.isPublic ?? true);
  }, [template, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{template ? "Edit Template" : "New Template"}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30" placeholder="Template name" />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30 resize-none h-20" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30">
                <option value="rich">Rich</option>
                <option value="markdown">Markdown</option>
                <option value="plain">Plain Text</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPublic(!isPublic)} className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-neon-cyan/30" : "bg-glass-medium"}`}>
              <motion.div animate={{ x: isPublic ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
            </button>
            <span className="text-sm text-text-secondary">Public template</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="glass" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="neon" size="sm" onClick={() => { if (name.trim()) onSave({ name, description, category, format, isPublic }); }} disabled={!name.trim()}>
            <Save size={14} /> {template ? "Update" : "Create"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function AdminDocuments() {
  const [subTab, setSubTab] = useState<"all" | "templates" | "settings">("all");

  const [stats, setStats] = useState<DocStats | null>(null);
  const [docs, setDocs] = useState<DocWithUser[]>([]);
  const [docTotal, setDocTotal] = useState(0);
  const [docPage, setDocPage] = useState(1);
  const [docTotalPages, setDocTotalPages] = useState(1);
  const [docSearch, setDocSearch] = useState("");
  const [docFormat, setDocFormat] = useState("");
  const [docLoading, setDocLoading] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [tmplLoading, setTmplLoading] = useState(true);
  const [tmplModal, setTmplModal] = useState(false);
  const [tmplEdit, setTmplEdit] = useState<Template | null>(null);

  const [roleSettings, setRoleSettings] = useState<RoleSettings[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ enableDocumentFeature: true, enableConversions: true, defaultFormat: "html", autoSaveInterval: 30, maxVersions: 10 });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/documents?limit=1");
      const data = await r.json();
      setStats(data.stats);
    } catch {}
  }, []);

  const fetchDocs = useCallback(async () => {
    setDocLoading(true);
    try {
      const params = new URLSearchParams({ page: String(docPage), limit: "15" });
      if (docSearch) params.set("search", docSearch);
      if (docFormat) params.set("format", docFormat);
      const r = await fetch(`/api/admin/documents?${params}`);
      const data = await r.json();
      setDocs(data.documents);
      setDocTotal(data.total);
      setDocTotalPages(data.totalPages);
    } catch {} finally {
      setDocLoading(false);
    }
  }, [docPage, docSearch, docFormat]);

  const fetchTemplates = useCallback(async () => {
    setTmplLoading(true);
    try {
      const r = await fetch("/api/admin/document-templates");
      const data = await r.json();
      setTemplates(data);
    } catch {} finally {
      setTmplLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const r = await fetch("/api/admin/document-settings");
      const data = await r.json();
      if (data.roleSettings) setRoleSettings(data.roleSettings);
      if (data.globalSettings) setGlobalSettings((prev) => ({ ...prev, ...data.globalSettings }));
    } catch {} finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (subTab === "all") fetchDocs();
    if (subTab === "templates") fetchTemplates();
    if (subTab === "settings") fetchSettings();
  }, [subTab, fetchDocs, fetchTemplates, fetchSettings, fetchStats]);

  const handleDeleteDoc = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/documents?id=${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchDocs();
      fetchStats();
    } catch {}
  };

  const handleSaveTemplate = async (data: { name: string; description: string; category: string; format: string; isPublic: boolean }) => {
    if (tmplEdit) {
      await fetch("/api/admin/document-templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tmplEdit.id, ...data }) });
    } else {
      await fetch("/api/admin/document-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setTmplModal(false);
    setTmplEdit(null);
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await fetch(`/api/admin/document-templates?id=${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await fetch("/api/admin/document-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleSettings, globalSettings }),
      });
    } catch {} finally {
      setSettingsSaving(false);
    }
  };

  const maxFormatCount = stats ? Math.max(...Object.values(stats.formatDistribution), 1) : 1;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Document Management</h2>
        </div>
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                subTab === tab.id ? "text-neon-cyan" : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {subTab === tab.id && (
                <motion.div layoutId="doc-sub-tab" className="absolute inset-0 glass rounded-lg -z-10" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={subTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {subTab === "all" && (
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Documents", value: stats.totalDocuments.toLocaleString(), color: "text-neon-cyan" },
                      { label: "Total Size", value: stats.totalSize, color: "text-neon-purple" },
                      { label: "Total Words", value: stats.totalWords.toLocaleString(), color: "text-emerald-400" },
                      { label: "Formats Used", value: Object.keys(stats.formatDistribution).length.toString(), color: "text-amber-400" },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs text-text-secondary">{card.label}</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {stats && Object.keys(stats.formatDistribution).length > 0 && (
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-medium mb-3">Format Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.formatDistribution).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => (
                        <div key={fmt} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-16 text-right uppercase">{fmt}</span>
                          <div className="flex-1 h-5 bg-glass-medium rounded overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxFormatCount) * 100}%` }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full bg-neon-cyan/30 rounded flex items-center justify-end pr-2">
                              <span className="text-[10px] font-mono text-neon-cyan">{count}</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input value={docSearch} onChange={(e) => { setDocSearch(e.target.value); setDocPage(1); }} placeholder="Search by title or user email..." className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30" />
                  </div>
                  <select value={docFormat} onChange={(e) => { setDocFormat(e.target.value); setDocPage(1); }} className="glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30">
                    <option value="">All Formats</option>
                    {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                  <span className="text-xs text-text-tertiary">{docTotal} documents</span>
                </div>

                <div className="glass rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-glass-medium">
                          <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary">Title</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary">User</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary">Format</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary">Words</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary">Size</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary">Created</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docLoading ? (
                          <tr><td colSpan={7} className="text-center py-8 text-text-secondary"><div className="inline-flex items-center gap-2"><div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /> Loading...</div></td></tr>
                        ) : docs.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8 text-text-secondary text-sm">No documents found</td></tr>
                        ) : docs.map((doc) => (
                          <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-glass-light hover:bg-glass-medium/50 transition-colors">
                            <td className="px-4 py-3 font-medium truncate max-w-[200px]">{doc.title}</td>
                            <td className="px-4 py-3 text-text-secondary text-xs">{doc.user.email || "—"}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-mono bg-glass-medium uppercase">{doc.extension}</span></td>
                            <td className="px-4 py-3 text-right text-text-secondary text-xs">{doc.wordCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-text-secondary text-xs">{formatBytes(Number(doc.size))}</td>
                            <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(doc.createdAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => window.open(`/documents/${doc.id}`, "_blank")} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-tertiary hover:text-neon-cyan transition-colors" title="View">
                                  <Eye size={14} />
                                </button>
                                <button onClick={() => setDeleteTarget({ id: doc.id, title: doc.title })} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-tertiary hover:text-neon-pink transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {docTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="glass" size="sm" onClick={() => setDocPage((p) => Math.max(1, p - 1))} disabled={docPage <= 1}><ChevronLeft size={14} /></Button>
                    <span className="text-xs text-text-secondary">Page {docPage} of {docTotalPages}</span>
                    <Button variant="glass" size="sm" onClick={() => setDocPage((p) => Math.min(docTotalPages, p + 1))} disabled={docPage >= docTotalPages}><ChevronRight size={14} /></Button>
                  </div>
                )}
              </div>
            )}

            {subTab === "templates" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">{templates.length} templates</p>
                  <Button variant="neon" size="sm" onClick={() => { setTmplEdit(null); setTmplModal(true); }}><Plus size={14} /> New Template</Button>
                </div>

                {tmplLoading ? (
                  <GlassCard className="p-8 text-center"><div className="inline-flex items-center gap-2 text-text-secondary"><div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /> Loading templates...</div></GlassCard>
                ) : templates.length === 0 ? (
                  <GlassCard className="p-8 text-center text-text-secondary text-sm">No templates yet</GlassCard>
                ) : (
                  <div className="space-y-3">
                    {templates.map((t, i) => (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <LayoutTemplate size={16} className="text-neon-purple shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{t.name}</div>
                            <div className="text-xs text-text-tertiary flex items-center gap-2">
                              <span>{t.category}</span>
                              <span>·</span>
                              <span>Used {t.usageCount}x</span>
                              <span>·</span>
                              <span>{t.isPublic ? "Public" : "Private"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { setTmplEdit(t); setTmplModal(true); }} className="px-3 py-1 rounded-lg text-xs font-medium glass hover:bg-glass-medium transition-colors">Edit</button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-tertiary hover:text-neon-pink transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {subTab === "settings" && (
              <div className="space-y-6">
                {settingsLoading ? (
                  <GlassCard className="p-8 text-center"><div className="inline-flex items-center gap-2 text-text-secondary"><div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /> Loading settings...</div></GlassCard>
                ) : (
                  <>
                    <div className="glass rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-4">Per-Role Limits</h3>
                      <div className="space-y-4">
                        {roleSettings.map((rs) => (
                          <div key={rs.role} className="glass rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                rs.role === "ADMIN" ? "bg-neon-purple/20 text-neon-purple" : rs.role === "USER" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-glass-medium text-text-secondary"
                              }`}>{rs.role}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Max Documents</label>
                                <input type="number" value={rs.maxDocuments} onChange={(e) => setRoleSettings((prev) => prev.map((r) => r.role === rs.role ? { ...r, maxDocuments: Number(e.target.value) } : r))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                              </div>
                              <div>
                                <label className="text-xs text-text-tertiary mb-1 block">Max Doc Size (KB)</label>
                                <input type="number" value={rs.maxDocumentSizeKB} onChange={(e) => setRoleSettings((prev) => prev.map((r) => r.role === rs.role ? { ...r, maxDocumentSizeKB: Number(e.target.value) } : r))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                              </div>
                              <div>
                                <label className="text-xs text-text-tertiary mb-2 block">Allowed Formats</label>
                                <div className="flex flex-wrap gap-2">
                                  {FORMAT_OPTIONS.map((fmt) => (
                                    <button key={fmt} onClick={() => setRoleSettings((prev) => prev.map((r) => {
                                      if (r.role !== rs.role) return r;
                                      const formats = r.allowedDocFormats.includes(fmt) ? r.allowedDocFormats.filter((f) => f !== fmt) : [...r.allowedDocFormats, fmt];
                                      return { ...r, allowedDocFormats: formats };
                                    }))} className={`px-2 py-1 rounded text-xs font-mono transition-colors ${rs.allowedDocFormats.includes(fmt) ? "bg-neon-cyan/20 text-neon-cyan" : "bg-glass-medium text-text-tertiary"}`}>{fmt}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-4">Global Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 glass rounded-lg">
                          <span className="text-sm">Enable Document Feature</span>
                          <button onClick={() => setGlobalSettings((p) => ({ ...p, enableDocumentFeature: !p.enableDocumentFeature }))} className={`relative w-10 h-5 rounded-full transition-colors ${globalSettings.enableDocumentFeature ? "bg-neon-cyan/30" : "bg-glass-medium"}`}>
                            <motion.div animate={{ x: globalSettings.enableDocumentFeature ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 glass rounded-lg">
                          <span className="text-sm">Enable Conversions</span>
                          <button onClick={() => setGlobalSettings((p) => ({ ...p, enableConversions: !p.enableConversions }))} className={`relative w-10 h-5 rounded-full transition-colors ${globalSettings.enableConversions ? "bg-neon-cyan/30" : "bg-glass-medium"}`}>
                            <motion.div animate={{ x: globalSettings.enableConversions ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
                          </button>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary mb-1 block">Default Format</label>
                          <select value={globalSettings.defaultFormat} onChange={(e) => setGlobalSettings((p) => ({ ...p, defaultFormat: e.target.value }))} className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30">
                            {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary mb-1 block">Auto-Save Interval (sec)</label>
                          <input type="number" value={globalSettings.autoSaveInterval} onChange={(e) => setGlobalSettings((p) => ({ ...p, autoSaveInterval: Number(e.target.value) }))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                        </div>
                        <div>
                          <label className="text-xs text-text-tertiary mb-1 block">Max Versions to Keep</label>
                          <input type="number" value={globalSettings.maxVersions} onChange={(e) => setGlobalSettings((p) => ({ ...p, maxVersions: Number(e.target.value) }))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="neon" size="sm" onClick={handleSaveSettings} loading={settingsSaving}><Save size={14} /> Save Settings</Button>
                    </div>
                  </>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </GlassCard>

      <ConfirmModal open={!!deleteTarget} title="Delete Document" message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`} onConfirm={handleDeleteDoc} onCancel={() => setDeleteTarget(null)} />
      <TemplateModal open={tmplModal} template={tmplEdit} onClose={() => { setTmplModal(false); setTmplEdit(null); }} onSave={handleSaveTemplate} />
    </div>
  );
}
