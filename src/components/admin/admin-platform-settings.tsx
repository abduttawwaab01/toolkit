"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  type: string;
}

const categoryLabels: Record<string, string> = {
  platform: "Platform",
  users: "Users",
  uploads: "Uploads",
  exports: "Exports",
  files: "Files",
  ai: "AI",
  security: "Security",
};

export function AdminPlatformSettings() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/platform-settings")
      .then((r) => r.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/platform-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: settings.map((s) => ({ key: s.key, value: s.value })) }),
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading settings...</span>
        </div>
      </GlassCard>
    );
  }

  const grouped = settings.reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Platform Settings</h2>
        </div>
        <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} />
          Save All
        </Button>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Global platform configuration. Changes take effect immediately.
      </p>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">
              {categoryLabels[category] || category}
            </h3>
            <div className="space-y-2">
              {items.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between p-3 glass rounded-xl"
                >
                  <label className="text-sm font-medium mr-4">{s.label}</label>
                  {s.type === "boolean" ? (
                    <button
                      onClick={() => updateValue(s.key, s.value === "true" ? "false" : "true")}
                      className={`relative w-10 h-5 rounded-full transition-colors ${s.value === "true" ? "bg-neon-cyan/30" : "bg-glass-medium"}`}
                    >
                      <motion.div
                        animate={{ x: s.value === "true" ? 20 : 2 }}
                        className="absolute top-0.5 size-4 rounded-full bg-white"
                      />
                    </button>
                  ) : s.type === "number" ? (
                    <input
                      type="number"
                      value={s.value}
                      onChange={(e) => updateValue(s.key, e.target.value)}
                      className="w-32 glass rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:border-neon-cyan/30"
                    />
                  ) : (
                    <input
                      type="text"
                      value={s.value}
                      onChange={(e) => updateValue(s.key, e.target.value)}
                      className="w-64 glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
