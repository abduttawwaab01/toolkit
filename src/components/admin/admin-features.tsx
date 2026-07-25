"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Puzzle, Save } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface Feature {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  roles: string;
}

export function AdminFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/features")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setFeatures)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleFeature = (key: string) => {
    setFeatures((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const getRoles = (rolesStr: string): string[] => {
    try { return JSON.parse(rolesStr); } catch { return []; }
  };

  const updateRoles = (key: string, role: string) => {
    setFeatures((prev) => prev.map((f) => {
      if (f.key !== key) return f;
      const parsed = getRoles(f.roles);
      const updated = parsed.includes(role) ? parsed.filter((r) => r !== role) : [...parsed, role];
      return { ...f, roles: JSON.stringify(updated) };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(features.map((f) =>
        fetch("/api/admin/features", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: f.key, enabled: f.enabled, roles: f.roles }),
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
          <span className="text-sm">Loading features...</span>
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
          <Puzzle size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Feature Toggles</h2>
        </div>
        <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} />
          Save Changes
        </Button>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Enable or disable features globally and control which roles have access.
      </p>

      <div className="space-y-3">
        {features.map((f, i) => {
          const parsedRoles = getRoles(f.roles);
          return (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-4 glass rounded-xl"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleFeature(f.key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${f.enabled ? "bg-neon-cyan/30" : "bg-glass-medium"}`}
                >
                  <motion.div
                    animate={{ x: f.enabled ? 20 : 2 }}
                    className="absolute top-0.5 size-4 rounded-full bg-white"
                  />
                </button>
                <div>
                  <div className="font-medium text-sm">{f.label}</div>
                  <div className="text-xs text-text-tertiary">{f.key}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {["ADMIN", "USER", "GUEST"].map((role) => (
                  <button
                    key={role}
                    onClick={() => updateRoles(f.key, role)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      parsedRoles.includes(role)
                        ? role === "ADMIN" ? "bg-neon-purple/20 text-neon-purple" : role === "USER" ? "bg-neon-cyan/20 text-neon-cyan" : "bg-amber-400/20 text-amber-400"
                        : "bg-glass-medium text-text-tertiary"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
