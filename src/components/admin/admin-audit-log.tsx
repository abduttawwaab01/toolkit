"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "30" });
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionColor = (action: string) => {
    if (action.includes("deleted")) return "text-neon-pink";
    if (action.includes("updated") || action.includes("toggled")) return "text-neon-cyan";
    if (action.includes("created")) return "text-emerald-400";
    return "text-text-secondary";
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ScrollText size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <span className="text-sm text-text-secondary">({total} entries)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by action (e.g. user.updated)"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="w-full max-w-xs glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading audit logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">No audit logs found.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start justify-between p-3 glass rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${actionColor(log.action)}`}>{log.action}</span>
                  <span className="text-xs text-text-tertiary">{log.entity}</span>
                  {log.entityId && <span className="text-xs text-text-tertiary truncate">({log.entityId.slice(0, 8)})</span>}
                </div>
                {log.metadata && (
                  <pre className="text-xs text-text-tertiary overflow-hidden text-ellipsis max-w-lg">
                    {JSON.stringify(log.metadata)}
                  </pre>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-xs text-text-tertiary">{new Date(log.createdAt).toLocaleString()}</div>
                {log.ipAddress && <div className="text-xs text-text-tertiary">{log.ipAddress}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
          <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
