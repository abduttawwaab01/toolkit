"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Building2,
  Package,
  ShoppingCart,
  Settings,
  Save,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceNaira: number;
  bonusCredits: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

interface PurchaseRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amountNaira: number;
  credits: number;
  accountName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: string;
}

interface ExportLimit {
  role: string;
  freeExportsPerDay: number;
  freeExportsPerWeek: number;
  freeExportsPerMonth: number;
  freeExportsPerYear: number;
  creditsPerExport: number;
  creditsPerMinute: number;
}

const defaultExportLimits: ExportLimit[] = [
  { role: "GUEST", freeExportsPerDay: 1, freeExportsPerWeek: 3, freeExportsPerMonth: 5, freeExportsPerYear: 30, creditsPerExport: 2, creditsPerMinute: 2 },
  { role: "USER", freeExportsPerDay: 3, freeExportsPerWeek: 15, freeExportsPerMonth: 50, freeExportsPerYear: 500, creditsPerExport: 1, creditsPerMinute: 1 },
  { role: "ADMIN", freeExportsPerDay: 9999, freeExportsPerWeek: 9999, freeExportsPerMonth: 9999, freeExportsPerYear: 9999, creditsPerExport: 0, creditsPerMinute: 0 },
];

const subTabs = [
  { id: "bank", label: "Bank Details", icon: Building2 },
  { id: "packages", label: "Packages", icon: Package },
  { id: "purchases", label: "Purchase Requests", icon: ShoppingCart },
  { id: "export-limits", label: "Export Limits", icon: Settings },
] as const;

export function AdminCredits() {
  const [activeSubTab, setActiveSubTab] = useState<string>("bank");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard size={20} className="text-neon-cyan" />
        <h2 className="text-lg font-semibold">Credit Management</h2>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === tab.id
                ? "text-neon-cyan"
                : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeSubTab === tab.id && (
              <motion.div
                layoutId="credit-subtab"
                className="absolute inset-0 glass rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "bank" && <BankDetailsTab onToast={setToast} />}
          {activeSubTab === "packages" && <PackagesTab onToast={setToast} />}
          {activeSubTab === "purchases" && <PurchasesTab onToast={setToast} />}
          {activeSubTab === "export-limits" && <ExportLimitsTab onToast={setToast} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium glass ${
              toast.type === "success" ? "border-neon-cyan/30 text-neon-cyan" : "border-neon-pink/30 text-neon-pink"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function BankDetailsTab({ onToast }: { onToast: (t: { message: string; type: "success" | "error" }) => void }) {
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountName: "Odebunmi Tawwab",
    accountNumber: "9033460322",
    bankName: "Palmpay",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/credits/bank-details")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setBankDetails)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/credits/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankDetails),
      });
      if (!res.ok) throw new Error("Failed to save");
      onToast({ message: "Bank details saved successfully", type: "success" });
    } catch {
      onToast({ message: "Failed to save bank details", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
        <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading bank details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-4">Edit Bank Details</h3>
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Account Name</label>
            <input
              type="text"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails((p) => ({ ...p, accountName: e.target.value }))}
              className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Account Number</label>
            <input
              type="text"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
              className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Bank Name</label>
            <input
              type="text"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
              className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
              <Save size={14} />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-4">User Preview</h3>
        <div className="glass rounded-xl p-5 max-w-sm">
          <p className="text-xs text-text-tertiary mb-3">How users see the bank details:</p>
          <div className="glass rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-text-tertiary">Account Name</span>
              <span className="text-sm font-medium">{bankDetails.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-tertiary">Account Number</span>
              <span className="text-sm font-medium font-mono">{bankDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-tertiary">Bank</span>
              <span className="text-sm font-medium">{bankDetails.bankName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackagesTab({ onToast }: { onToast: (t: { message: string; type: "success" | "error" }) => void }) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPkg, setEditPkg] = useState<CreditPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credits/packages");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPackages(data);
    } catch {
      onToast({ message: "Failed to load packages", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openCreate = () => {
    setEditPkg({ id: "", name: "", credits: 100, priceNaira: 500, bonusCredits: 0, description: "", isActive: true, sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (pkg: CreditPackage) => {
    setEditPkg({ ...pkg });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editPkg) return;
    setSaving(true);
    try {
      const isNew = !editPkg.id;
      const res = await fetch("/api/credits/packages", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPkg),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: isNew ? "Package created" : "Package updated", type: "success" });
      setShowModal(false);
      fetchPackages();
    } catch {
      onToast({ message: "Failed to save package", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/credits/packages?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Package deleted", type: "success" });
      setDeleteConfirm(null);
      fetchPackages();
    } catch {
      onToast({ message: "Failed to delete package", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
        <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading packages...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{packages.length} packages</p>
        <Button variant="neon" size="sm" onClick={openCreate}>
          <Plus size={14} />
          Add Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Package size={32} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary mb-1">No packages yet</p>
          <p className="text-xs text-text-tertiary mb-4">Create your first credit package to get started.</p>
          <Button variant="neon" size="sm" onClick={openCreate}>
            <Plus size={14} />
            Add Package
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 pr-3 font-medium text-text-secondary">Name</th>
                <th className="text-right py-3 px-3 font-medium text-text-secondary">Credits</th>
                <th className="text-right py-3 px-3 font-medium text-text-secondary">Price</th>
                <th className="text-right py-3 px-3 font-medium text-text-secondary">Bonus</th>
                <th className="text-center py-3 px-3 font-medium text-text-secondary">Status</th>
                <th className="text-right py-3 pl-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <motion.tr
                  key={pkg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border-subtle/50 last:border-0"
                >
                  <td className="py-3 pr-3">
                    <div className="font-medium">{pkg.name}</div>
                    {pkg.description && <div className="text-xs text-text-tertiary">{pkg.description}</div>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{pkg.credits.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-neon-cyan">{formatNaira(pkg.priceNaira)}</td>
                  <td className="py-3 px-3 text-right font-mono">{pkg.bonusCredits > 0 ? `+${pkg.bonusCredits}` : "-"}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs font-medium ${pkg.isActive ? "text-emerald-400" : "text-text-tertiary"}`}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary hover:text-neon-cyan transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === pkg.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg hover:bg-neon-pink/20 text-neon-pink transition-colors" title="Confirm delete">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary transition-colors" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(pkg.id)} className="p-1.5 rounded-lg hover:bg-glass-medium text-text-secondary hover:text-neon-pink transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && editPkg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">{editPkg.id ? "Edit Package" : "Create Package"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Name</label>
                  <input
                    type="text"
                    value={editPkg.name}
                    onChange={(e) => setEditPkg((p) => p ? { ...p, name: e.target.value } : p)}
                    className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    placeholder="e.g. Starter Pack"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Credits</label>
                    <input
                      type="number"
                      value={editPkg.credits}
                      onChange={(e) => setEditPkg((p) => p ? { ...p, credits: Number(e.target.value) } : p)}
                      className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Price (₦)</label>
                    <input
                      type="number"
                      value={editPkg.priceNaira}
                      onChange={(e) => setEditPkg((p) => p ? { ...p, priceNaira: Number(e.target.value) } : p)}
                      className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Bonus Credits</label>
                    <input
                      type="number"
                      value={editPkg.bonusCredits}
                      onChange={(e) => setEditPkg((p) => p ? { ...p, bonusCredits: Number(e.target.value) } : p)}
                      className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Sort Order</label>
                    <input
                      type="number"
                      value={editPkg.sortOrder}
                      onChange={(e) => setEditPkg((p) => p ? { ...p, sortOrder: Number(e.target.value) } : p)}
                      className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Description</label>
                  <input
                    type="text"
                    value={editPkg.description}
                    onChange={(e) => setEditPkg((p) => p ? { ...p, description: e.target.value } : p)}
                    className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditPkg((p) => p ? { ...p, isActive: !p.isActive } : p)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editPkg.isActive ? "bg-neon-cyan/30" : "bg-glass-medium"}`}
                  >
                    <motion.div animate={{ x: editPkg.isActive ? 20 : 2 }} className="absolute top-0.5 size-4 rounded-full bg-white" />
                  </button>
                  <span className="text-xs text-text-tertiary">{editPkg.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="neon" size="sm" onClick={handleSave} loading={saving}>
                  <Save size={14} />
                  {editPkg.id ? "Save Changes" : "Create Package"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PurchasesTab({ onToast }: { onToast: (t: { message: string; type: "success" | "error" }) => void }) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [actionTarget, setActionTarget] = useState<{ request: PurchaseRequest; action: "approve" | "reject" } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [acting, setActing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "15" });
    if (statusFilter) params.set("status", statusFilter);
    try {
      const res = await fetch(`/api/credits/admin?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setStatusCounts(data.statusCounts || {});
    } catch {
      onToast({ message: "Failed to load purchase requests", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, onToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async () => {
    if (!actionTarget) return;
    setActing(true);
    try {
      const res = await fetch("/api/credits/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionTarget.request.id,
          action: actionTarget.action,
          adminNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({
        message: actionTarget.action === "approve" ? "Request approved" : "Request rejected",
        type: "success",
      });
      setActionTarget(null);
      setAdminNotes("");
      fetchRequests();
    } catch {
      onToast({ message: "Action failed", type: "error" });
    } finally {
      setActing(false);
    }
  };

  const statusTabs = [
    { id: "", label: "All", count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { id: "PENDING", label: "Pending", count: statusCounts["PENDING"] || 0 },
    { id: "APPROVED", label: "Approved", count: statusCounts["APPROVED"] || 0 },
    { id: "REJECTED", label: "Rejected", count: statusCounts["REJECTED"] || 0 },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-400/20 text-amber-400";
      case "APPROVED": return "bg-emerald-400/20 text-emerald-400";
      case "REJECTED": return "bg-neon-pink/20 text-neon-pink";
      default: return "bg-glass-medium text-text-secondary";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? "text-neon-cyan bg-glass-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-glass-light"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              statusFilter === tab.id ? "bg-neon-cyan/20 text-neon-cyan" : "bg-glass-medium text-text-tertiary"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
          <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <ShoppingCart size={32} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No purchase requests found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 pr-3 font-medium text-text-secondary">User</th>
                <th className="text-right py-3 px-3 font-medium text-text-secondary">Amount</th>
                <th className="text-right py-3 px-3 font-medium text-text-secondary">Credits</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Account Name</th>
                <th className="text-center py-3 px-3 font-medium text-text-secondary">Status</th>
                <th className="text-left py-3 px-3 font-medium text-text-secondary">Date</th>
                <th className="text-right py-3 pl-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border-subtle/50 last:border-0"
                >
                  <td className="py-3 pr-3">
                    <div className="font-medium">{req.userName || req.userEmail}</div>
                    <div className="text-xs text-text-tertiary">{req.packageName}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-neon-cyan">{formatNaira(req.amountNaira)}</td>
                  <td className="py-3 px-3 text-right font-mono">{req.credits.toLocaleString()}</td>
                  <td className="py-3 px-3 text-xs">{req.accountName || "-"}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-text-tertiary">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pl-3">
                    {req.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setActionTarget({ request: req, action: "approve" }); setAdminNotes(""); }}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setActionTarget({ request: req, action: "reject" }); setAdminNotes(""); }}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">{req.adminNotes || "-"}</span>
                    )}
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
        {actionTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActionTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={20} className={actionTarget.action === "approve" ? "text-emerald-400" : "text-neon-pink"} />
                <h3 className="text-lg font-semibold">
                  {actionTarget.action === "approve" ? "Approve Request" : "Reject Request"}
                </h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                {actionTarget.action === "approve"
                  ? `Approve ${actionTarget.request.userName}'s purchase of ${formatNaira(actionTarget.request.amountNaira)}?`
                  : `Reject ${actionTarget.request.userName}'s purchase of ${formatNaira(actionTarget.request.amountNaira)}?`}
              </p>
              {actionTarget.action === "reject" && (
                <div className="mb-4">
                  <label className="text-xs text-text-secondary mb-1 block">Admin Notes (optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan/30 resize-none"
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActionTarget(null)}>Cancel</Button>
                <Button
                  variant={actionTarget.action === "approve" ? "neon" : "ghost"}
                  size="sm"
                  onClick={handleAction}
                  loading={acting}
                  className={actionTarget.action === "reject" ? "text-neon-pink border-neon-pink/30 hover:bg-neon-pink/10" : ""}
                >
                  {actionTarget.action === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExportLimitsTab({ onToast }: { onToast: (t: { message: string; type: "success" | "error" }) => void }) {
  const [limits, setLimits] = useState<ExportLimit[]>(defaultExportLimits);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/credits/export-limits")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => {
        if (data.rules && data.rules.length > 0) setLimits(data.rules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateLimit = (role: string, key: keyof ExportLimit, value: number) => {
    setLimits((prev) => prev.map((l) => l.role === role ? { ...l, [key]: value } : l));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const limit of limits) {
        const res = await fetch("/api/credits/export-limits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(limit),
        });
        if (!res.ok) throw new Error("Failed");
      }
      onToast({ message: "Export limits saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save export limits", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-text-secondary">
        <div className="size-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading export limits...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">Free export limits per role + credit costs</p>
        <Button variant="neon" size="sm" onClick={handleSaveAll} loading={saving}>
          <Save size={14} />
          Save All
        </Button>
      </div>

      <div className="space-y-4">
        {limits.map((limit) => (
          <div key={limit.role} className="glass rounded-xl p-5">
            <h4 className="text-sm font-semibold mb-3 text-neon-cyan">{limit.role}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Free/Day</label>
                <input type="number" min={0} value={limit.freeExportsPerDay}
                  onChange={(e) => updateLimit(limit.role, "freeExportsPerDay", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Free/Week</label>
                <input type="number" min={0} value={limit.freeExportsPerWeek}
                  onChange={(e) => updateLimit(limit.role, "freeExportsPerWeek", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Free/Month</label>
                <input type="number" min={0} value={limit.freeExportsPerMonth}
                  onChange={(e) => updateLimit(limit.role, "freeExportsPerMonth", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Free/Year</label>
                <input type="number" min={0} value={limit.freeExportsPerYear}
                  onChange={(e) => updateLimit(limit.role, "freeExportsPerYear", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Credits/Export</label>
                <input type="number" min={0} value={limit.creditsPerExport}
                  onChange={(e) => updateLimit(limit.role, "creditsPerExport", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Credits/Minute</label>
                <input type="number" min={0} value={limit.creditsPerMinute}
                  onChange={(e) => updateLimit(limit.role, "creditsPerMinute", Number(e.target.value))}
                  className="w-full glass rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-neon-cyan/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
