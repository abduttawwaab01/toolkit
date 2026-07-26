"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Clock,
  Banknote,
  Sparkles,
  Copy,
  Check,
  XCircle,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Package,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceNaira: number;
  bonusCredits: number;
  description?: string | null;
}

interface BankDetail {
  id: string;
  accountName: string;
  accountNo: string;
  bankName: string;
}

interface PurchaseRequest {
  id: string;
  credits: number;
  amountNaira: number;
  accountName: string;
  reference?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  package?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/25", icon: XCircle },
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [bankDetail, setBankDetail] = useState<BankDetail | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [bankFrom, setBankFrom] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = role === "ADMIN";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, pkgRes, bankRes, reqRes] = await Promise.all([
        fetch("/api/credits/balance"),
        fetch("/api/credits/packages"),
        fetch("/api/credits/bank-details"),
        fetch("/api/credits/request"),
      ]);
      if (balRes.ok) {
        const d = await balRes.json();
        setBalance(d.balance ?? d.creditsBalance ?? 0);
        setRole(d.role ?? null);
      } else {
        setBalance(0);
      }
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (bankRes.ok) setBankDetail(await bankRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = packages.find((p) => p.id === selectedPkg);

  const totalPurchased = requests.filter((r) => r.status === "APPROVED").reduce((s, r) => s + r.credits, 0);
  const totalSpent = requests.filter((r) => r.status === "APPROVED").reduce((s, r) => s + r.amountNaira, 0);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!selected || !accountName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/credits/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selected.id,
          credits: selected.credits + selected.bonusCredits,
          amountNaira: selected.priceNaira,
          accountName: accountName.trim(),
          reference: reference.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setAccountName("");
        setBankFrom("");
        setReference("");
        setSelectedPkg(null);
        fetchData();
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch {
      /* handle error */
    } finally {
      setSubmitting(false);
    }
  };

  const bestValueId = packages.length > 1 ? packages.reduce((best, pkg) => {
    const bestValue = (best.credits + best.bonusCredits) / best.priceNaira;
    const pkgValue = (pkg.credits + pkg.bonusCredits) / pkg.priceNaira;
    return pkgValue > bestValue ? pkg : best;
  }, packages[0])?.id : null;

  return (
    <div className="min-h-screen relative">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neon-cyan/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-neon-purple/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

          {/* Back Button */}
          <motion.div variants={itemVariants}>
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors">
              <ArrowLeft className="size-3.5" />
              Back to Home
            </a>
          </motion.div>

          {/* Hero */}
          <motion.div variants={itemVariants} className="text-center mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan mb-4">
              <span className="size-1.5 rounded-full bg-neon-cyan animate-pulse" />
              Credits
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">
                Credits
              </span>
            </h1>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Purchase credits to unlock premium features and continue creating without limits.
            </p>
          </motion.div>

          {/* Balance + Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Balance */}
            <GlassCard glow className="sm:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/[0.05] rounded-full blur-[60px]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-neon-cyan" />
                  <span className="text-sm text-text-secondary">
                    {isAdmin ? "Admin Account" : "Current Balance"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  {isAdmin ? (
                    <>
                      <Infinity size={40} className="text-neon-cyan" />
                      <span className="text-lg text-neon-cyan font-medium">Unlimited</span>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-bold font-display text-text-primary">
                        {balance !== null ? balance : "--"}
                      </span>
                      <span className="text-lg text-text-tertiary">credits</span>
                    </>
                  )}
                </div>
                {!isAdmin && (
                  <div className="w-full h-1.5 rounded-full bg-white/5 mt-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((balance ?? 0) / 100, 1) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_10px_rgba(0,245,212,0.2)]"
                    />
                  </div>
                )}
                {isAdmin && (
                  <p className="mt-3 text-xs text-neon-cyan/70">You have unlimited free exports. No credits needed.</p>
                )}
              </div>
            </GlassCard>

            {/* Quick Stats */}
            <GlassCard className="flex flex-col items-center justify-center text-center">
              <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                <ArrowUpRight size={16} className="text-emerald-400" />
              </div>
              <span className="text-2xl font-bold font-display text-text-primary">{totalPurchased}</span>
              <span className="text-xs text-text-tertiary">Total Purchased</span>
            </GlassCard>

            <GlassCard className="flex flex-col items-center justify-center text-center">
              <div className="size-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-2">
                <Clock size={16} className="text-yellow-400" />
              </div>
              <span className="text-2xl font-bold font-display text-text-primary">{pendingCount}</span>
              <span className="text-xs text-text-tertiary">Pending Requests</span>
            </GlassCard>
          </motion.div>

          {!isAdmin && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-neon-cyan" />
              <h2 className="text-lg font-semibold font-display text-text-primary">Available Packages</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPkg;
                  const isBest = pkg.id === bestValueId;
                  const totalCredits = pkg.credits + pkg.bonusCredits;

                  return (
                    <motion.div
                      key={pkg.id}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => setSelectedPkg(pkg.id)}
                        className={cn(
                          "relative text-left w-full p-5 rounded-2xl border transition-all duration-200 cursor-pointer",
                          isSelected
                            ? "border-neon-cyan/50 bg-neon-cyan/5 shadow-[0_0_25px_rgba(0,245,212,0.08)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                        )}
                      >
                        {isBest && (
                          <span className="absolute -top-3 left-5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-neon-cyan text-black flex items-center gap-1">
                            <Sparkles size={9} /> Best Value
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-text-secondary">{pkg.name}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="size-5 rounded-full bg-neon-cyan flex items-center justify-center"
                            >
                              <Check size={12} className="text-black" />
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-3xl font-bold font-display text-text-primary">{totalCredits}</span>
                          <span className="text-xs text-text-tertiary">credits</span>
                        </div>
                        {pkg.bonusCredits > 0 && (
                          <p className="text-xs text-neon-cyan mb-3">
                            +{pkg.bonusCredits} bonus credits included
                          </p>
                        )}
                        {!pkg.bonusCredits && <div className="mb-3" />}
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-semibold text-text-primary">{formatNaira(pkg.priceNaira)}</span>
                          <span className="text-[11px] text-text-tertiary">
                            {formatNaira(Math.round(pkg.priceNaira / totalCredits))}/credit
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
          )}

          {!isAdmin && selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="space-y-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-neon-cyan" />
                  <h2 className="text-lg font-semibold font-display text-text-primary">Complete Purchase</h2>
                </div>

                {/* Selected package summary */}
                <div className="glass rounded-xl p-4 border border-neon-cyan/15 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{selected.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {selected.credits + selected.bonusCredits} credits
                      {selected.bonusCredits > 0 && ` (+${selected.bonusCredits} bonus)`}
                    </p>
                  </div>
                  <span className="text-xl font-bold font-display text-neon-cyan">
                    {formatNaira(selected.priceNaira)}
                  </span>
                </div>

                {/* Bank details */}
                <div>
                  <p className="text-sm text-text-secondary mb-3">
                    Transfer <span className="font-semibold text-neon-cyan">{formatNaira(selected.priceNaira)}</span> to:
                  </p>
                  {bankDetail && (
                    <div className="glass rounded-xl p-4 border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-tertiary">Account Name</span>
                        <span className="text-sm font-medium text-text-primary">{bankDetail.accountName}</span>
                      </div>
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-tertiary">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium font-mono text-text-primary tracking-wider">
                            {bankDetail.accountNo}
                          </span>
                          <button
                            onClick={() => handleCopy(bankDetail.accountNo)}
                            className="size-7 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan hover:bg-neon-cyan/15 transition-colors"
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <div className="h-px bg-white/[0.06]" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-tertiary">Bank</span>
                        <span className="text-sm font-medium text-text-primary">{bankDetail.bankName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs text-text-tertiary mb-1.5">
                      Name on Account <span className="text-neon-pink">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1.5">
                      Bank You Paid From
                    </label>
                    <input
                      type="text"
                      value={bankFrom}
                      onChange={(e) => setBankFrom(e.target.value)}
                      placeholder="e.g. GTBank, OPay"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1.5">
                      Reference / Remark
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. tx ref"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>
                </div>

                <Button
                  variant="neon"
                  size="lg"
                  className="w-full sm:w-auto"
                  loading={submitting}
                  disabled={!accountName.trim()}
                  onClick={handleSubmit}
                >
                  Submit for Verification
                  <ArrowRight size={16} />
                </Button>

                {submitted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    Request submitted successfully! We&apos;ll verify your payment shortly.
                  </motion.p>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Purchase History */}
          {requests.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-neon-cyan" />
                <h2 className="text-lg font-semibold font-display text-text-primary">Purchase History</h2>
                <span className="text-xs text-text-tertiary">({requests.length})</span>
              </div>
              <GlassCard className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Date</th>
                      <th className="pb-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Package</th>
                      <th className="pb-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">Credits</th>
                      <th className="pb-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">Amount</th>
                      <th className="pb-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                      const Icon = st.icon;
                      return (
                        <tr key={req.id} className="border-b border-white/[0.03] last:border-0">
                          <td className="py-3 text-xs text-text-secondary">
                            {new Date(req.createdAt).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 text-sm text-text-primary">
                            {req.package?.name || `${req.credits} credits`}
                          </td>
                          <td className="py-3 text-sm text-text-primary text-right">{req.credits}</td>
                          <td className="py-3 text-sm text-text-secondary text-right">{formatNaira(req.amountNaira)}</td>
                          <td className="py-3 text-right">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border", st.color)}>
                              <Icon size={9} />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </GlassCard>
            </motion.div>
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </motion.div>
      </div>
    </div>
  );
}
