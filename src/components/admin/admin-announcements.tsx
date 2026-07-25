"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Trash2, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  severity: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSeverity, setNewSeverity] = useState("info");
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = () => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const createAnnouncement = async () => {
    if (!newTitle || !newContent) return;
    setSaving(true);
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent, severity: newSeverity }),
    });
    setNewTitle("");
    setNewContent("");
    setNewSeverity("info");
    setShowForm(false);
    setSaving(false);
    fetchAnnouncements();
  };

  const toggleActive = async (a: Announcement) => {
    await fetch("/api/admin/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, isActive: !a.isActive }),
    });
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (a: Announcement) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements?id=${a.id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "border-neon-pink bg-neon-pink/10";
    if (s === "warning") return "border-amber-400 bg-amber-400/10";
    if (s === "success") return "border-emerald-400 bg-emerald-400/10";
    return "border-neon-cyan bg-neon-cyan/10";
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Announcements</h2>
        </div>
        <Button variant="neon" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          New Announcement
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="glass rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
              />
              <textarea
                placeholder="Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30 resize-none"
              />
              <div className="flex items-center gap-3">
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="success">Success</option>
                </select>
                <Button variant="neon" size="sm" onClick={createAnnouncement} loading={saving}>Publish</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">No announcements yet.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`border rounded-xl p-4 ${severityColor(a.severity)} ${!a.isActive ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-glass-medium">{a.severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(a)} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                    {a.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => deleteAnnouncement(a)} className="text-text-secondary hover:text-neon-pink transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{a.content}</p>
              <div className="text-xs text-text-tertiary mt-2">
                Created: {new Date(a.createdAt).toLocaleString()}
                {a.endsAt && ` | Expires: ${new Date(a.endsAt).toLocaleString()}`}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
