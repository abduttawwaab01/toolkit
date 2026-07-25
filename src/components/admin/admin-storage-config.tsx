"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface RoleConfig {
  role: string;
  tempTtlHours: number;
  processedTtlHours: number;
  exportTtlHours: number;
  enabled: boolean;
}

export function AdminStorageConfig() {
  const [configs, setConfigs] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auto-delete")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setConfigs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (role: string, key: keyof RoleConfig, value: number | boolean) => {
    setConfigs((prev) => prev.map((c) => c.role === role ? { ...c, [key]: value } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(configs.map((config) =>
        fetch("/api/admin/auto-delete", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        })
      ));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading auto-delete config...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8 text-neon-pink text-sm">{error}</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Auto-Delete Configuration</h2>
        </div>
        <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} />
          Save Changes
        </Button>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Configure how long files are stored before automatic deletion. Changes apply to new uploads immediately.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-3 pr-4 font-medium text-text-secondary">Role</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Temp Files (hrs)</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Processed (hrs)</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Exports (hrs)</th>
              <th className="text-center py-3 pl-4 font-medium text-text-secondary">Active</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <motion.tr
                key={config.role}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border-subtle/50 last:border-0"
              >
                <td className="py-3 pr-4 font-medium">{config.role}</td>
                <td className="py-3 px-4">
                  <input type="number" min={1} max={8760} value={config.tempTtlHours} onChange={(e) => updateConfig(config.role, "tempTtlHours", Number(e.target.value))} className="w-20 glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </td>
                <td className="py-3 px-4">
                  <input type="number" min={1} max={8760} value={config.processedTtlHours} onChange={(e) => updateConfig(config.role, "processedTtlHours", Number(e.target.value))} className="w-20 glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </td>
                <td className="py-3 px-4">
                  <input type="number" min={1} max={8760} value={config.exportTtlHours} onChange={(e) => updateConfig(config.role, "exportTtlHours", Number(e.target.value))} className="w-20 glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </td>
                <td className="py-3 pl-4 text-center">
                  <button onClick={() => updateConfig(config.role, "enabled", !config.enabled)} className={`relative w-10 h-5 rounded-full transition-colors ${config.enabled ? "bg-neon-cyan/30" : "bg-glass-medium"}`}>
                    <motion.div animate={{ x: config.enabled ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
