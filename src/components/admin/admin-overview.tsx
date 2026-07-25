"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, HardDrive, Cpu, FileText, UserX, UserCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface Stats {
  users: { total: number; registered: number; guests: number; active7Days: number; suspended: number };
  storage: { used: number };
  aiCalls: number;
  files: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading stats...</span>
        </div>
      </GlassCard>
    );
  }

  if (error || !stats) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <p className="text-sm text-neon-pink">Failed to load stats: {error || "Unknown error"}</p>
        </div>
      </GlassCard>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.users.total, icon: Users, color: "text-neon-cyan" },
    { label: "Active (7d)", value: stats.users.active7Days, icon: UserCheck, color: "text-emerald-400" },
    { label: "Suspended", value: stats.users.suspended, icon: UserX, color: "text-neon-pink" },
    { label: "Guests", value: stats.users.guests, icon: Users, color: "text-amber-400" },
    { label: "Storage Used", value: formatBytes(stats.storage.used), icon: HardDrive, color: "text-neon-purple" },
    { label: "AI Calls", value: stats.aiCalls.toLocaleString(), icon: Cpu, color: "text-blue-400" },
    { label: "Active Files", value: stats.files.toLocaleString(), icon: FileText, color: "text-emerald-400" },
  ];

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold mb-6">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <card.icon size={18} className={`${card.color} mb-2`} />
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-text-secondary">{card.label}</div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
