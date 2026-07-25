"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Ban, Trash2, ChevronLeft, ChevronRight, Shield, Eye } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
  creditsBalance: number;
  storageUsed: string;
  storageLimit: string;
  maxProjects: number | null;
  isSuspended: boolean;
  suspendedReason: string | null;
  adminNotes: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  lastActiveAt: string;
  _count: { projects: number; files: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCredits, setEditCredits] = useState(0);
  const [editStorage, setEditStorage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: "15" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditCredits(u.creditsBalance);
    setEditStorage(String(Math.floor(Number(u.storageLimit) / 1048576)));
    setEditNotes(u.adminNotes || "");
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
          creditsBalance: editCredits,
          storageLimit: String(BigInt(editStorage) * BigInt(1048576)),
          adminNotes: editNotes,
        }),
      });
      setSelectedUser(null);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (u: AdminUser) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, isSuspended: !u.isSuspended, suspendedReason: u.isSuspended ? null : "Suspended by admin" }),
    });
    fetchUsers();
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-neon-cyan" />
          <h2 className="text-lg font-semibold">User Management</h2>
          <span className="text-sm text-text-secondary">({total} users)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
        >
          <option value="">All Roles</option>
          <option value="GUEST">Guest</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading users...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-neon-pink text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 pr-3 font-medium text-text-secondary">User</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Role</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Projects</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Storage</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Status</th>
                <th className="text-left py-3 pl-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border-subtle/50 last:border-0"
                >
                  <td className="py-3 pr-3">
                    <div>
                      <div className="font-medium">{u.name || u.email || "Unknown"}</div>
                      <div className="text-xs text-text-tertiary">{u.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-neon-purple/20 text-neon-purple" :
                      u.role === "USER" ? "bg-neon-cyan/20 text-neon-cyan" :
                      "bg-glass-medium text-text-secondary"
                    }`}>
                      {u.role === "ADMIN" && <Shield size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">{u._count.projects}</td>
                  <td className="py-3 px-3 text-xs">{formatBytes(Number(u.storageUsed))}</td>
                  <td className="py-3 px-3">
                    {u.isSuspended ? (
                      <span className="text-neon-pink text-xs font-medium">Suspended</span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openUser(u)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary hover:text-text-primary transition-colors" title="Edit user">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => toggleSuspend(u)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary hover:text-amber-400 transition-colors" title={u.isSuspended ? "Unsuspend" : "Suspend"}>
                        <Ban size={14} />
                      </button>
                      <button onClick={() => deleteUser(u)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary hover:text-neon-pink transition-colors" title="Delete user">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
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

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Edit User: {selectedUser.email}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30">
                    <option value="GUEST">Guest</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Credits Balance</label>
                  <input type="number" value={editCredits} onChange={(e) => setEditCredits(Number(e.target.value))} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Storage Limit (MB)</label>
                  <input type="number" value={editStorage} onChange={(e) => setEditStorage(e.target.value)} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Admin Notes</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30 resize-none" placeholder="Internal notes about this user..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Cancel</Button>
                <Button variant="neon" size="sm" onClick={saveUser} loading={saving}>Save Changes</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
