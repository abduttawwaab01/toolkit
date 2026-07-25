"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Gauge } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  concurrentJobs: number;
  maxFileSize: string;
  maxStoragePerUser: string;
  maxProjects: number;
  maxDurationMinutes: number;
  maxResolution: string;
  exportQuality: string;
  exportWatermark: boolean;
  aiCreditsPerDay: number;
  allowedMimeTypes: string;
}

const resolutionOptions = ["480p", "720p", "1080p", "1440p", "4K", "8K"];
const qualityOptions = ["standard", "high", "lossless"];
const fileSizeOptions = [
  { label: "50 MB", value: "52428800" },
  { label: "100 MB", value: "104857600" },
  { label: "250 MB", value: "262144000" },
  { label: "500 MB", value: "524288000" },
  { label: "1 GB", value: "1073741824" },
  { label: "5 GB", value: "5368709120" },
  { label: "10 GB", value: "10737418240" },
  { label: "50 GB", value: "53687091200" },
  { label: "100 GB", value: "107374182400" },
];

const storageOptions = [
  { label: "100 MB", value: "104857600" },
  { label: "500 MB", value: "524288000" },
  { label: "1 GB", value: "1073741824" },
  { label: "5 GB", value: "5368709120" },
  { label: "10 GB", value: "10737418240" },
  { label: "50 GB", value: "53687091200" },
  { label: "100 GB", value: "107374182400" },
  { label: "1 TB", value: "1099511627776" },
];

export function AdminRateLimits() {
  const [limits, setLimits] = useState<Record<string, RateLimitConfig>>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/rate-limits")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data: any[]) => {
        const map: Record<string, RateLimitConfig> = {};
        const roleList: string[] = [];
        for (const r of data) {
          roleList.push(r.role);
          map[r.role] = {
            requestsPerMinute: r.requestsPerMinute,
            requestsPerHour: r.requestsPerHour,
            concurrentJobs: r.concurrentJobs,
            maxFileSize: String(r.maxFileSize),
            maxStoragePerUser: String(r.maxStoragePerUser),
            maxProjects: r.maxProjects,
            maxDurationMinutes: r.maxDurationMinutes,
            maxResolution: r.maxResolution,
            exportQuality: r.exportQuality,
            exportWatermark: r.exportWatermark,
            aiCreditsPerDay: r.aiCreditsPerDay,
            allowedMimeTypes: r.allowedMimeTypes || "",
          };
        }
        setLimits(map);
        setRoles(roleList);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateLimit = (role: string, key: keyof RateLimitConfig, value: any) => {
    setLimits((prev) => ({ ...prev, [role]: { ...prev[role], [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(limits).map(([role, config]) =>
        fetch("/api/admin/rate-limits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, ...config }),
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
          <span className="text-sm">Loading rate limits...</span>
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
          <Gauge size={20} className="text-neon-purple" />
          <h2 className="text-lg font-semibold">Rate Limits & Quotas</h2>
        </div>
        <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
          <Save size={14} />
          Save Changes
        </Button>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        Control how much each user role can use the platform. All limits are enforced in real-time.
      </p>

      <div className="space-y-6">
        {roles.map((role) => {
          const config = limits[role];
          if (!config) return null;
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  role === "ADMIN" ? "bg-neon-purple/20 text-neon-purple" :
                  role === "USER" ? "bg-neon-cyan/20 text-neon-cyan" :
                  "bg-glass-medium text-text-secondary"
                }`}>
                  {role}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Req/min</label>
                  <input type="number" value={config.requestsPerMinute} onChange={(e) => updateLimit(role, "requestsPerMinute", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Req/hr</label>
                  <input type="number" value={config.requestsPerHour} onChange={(e) => updateLimit(role, "requestsPerHour", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Concurrent Jobs</label>
                  <input type="number" value={config.concurrentJobs} onChange={(e) => updateLimit(role, "concurrentJobs", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">AI Credits/day</label>
                  <input type="number" value={config.aiCreditsPerDay} onChange={(e) => updateLimit(role, "aiCreditsPerDay", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Max File Size</label>
                  <select value={config.maxFileSize} onChange={(e) => updateLimit(role, "maxFileSize", e.target.value)} className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30">
                    {fileSizeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Max Storage/User</label>
                  <select value={config.maxStoragePerUser} onChange={(e) => updateLimit(role, "maxStoragePerUser", e.target.value)} className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30">
                    {storageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Max Projects</label>
                  <input type="number" value={config.maxProjects} onChange={(e) => updateLimit(role, "maxProjects", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Max Duration (min)</label>
                  <input type="number" value={config.maxDurationMinutes} onChange={(e) => updateLimit(role, "maxDurationMinutes", Number(e.target.value))} className="w-full glass rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Max Resolution</label>
                  <select value={config.maxResolution} onChange={(e) => updateLimit(role, "maxResolution", e.target.value)} className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30">
                    {resolutionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Export Quality</label>
                  <select value={config.exportQuality} onChange={(e) => updateLimit(role, "exportQuality", e.target.value)} className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30">
                    {qualityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => updateLimit(role, "exportWatermark", !config.exportWatermark)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${config.exportWatermark ? "bg-neon-pink/30" : "bg-glass-medium"}`}
                  >
                    <motion.div animate={{ x: config.exportWatermark ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
                  </button>
                  <span className="ml-2 text-xs text-text-tertiary mb-0.5">Watermark</span>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Allowed MIME Types</label>
                  <input type="text" value={config.allowedMimeTypes} onChange={(e) => updateLimit(role, "allowedMimeTypes", e.target.value)} placeholder="Leave empty for all" className="w-full glass rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neon-cyan/30" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
