"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Copy,
  Check,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface CreditPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/25", icon: XCircle },
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

export function CreditPurchaseModal({ open, onClose, onPurchased }: CreditPurchaseModalProps) {
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
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, bankRes, reqRes] = await Promise.all([
        fetch("/api/credits/packages"),
        fetch("/api/credits/bank-details"),
        fetch("/api/credits/request"),
      ]);
      if (pkgRes.ok) setPackages(await pkgRes.json());
      if (bankRes.ok) setBankDetail(await bankRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
      setSubmitted(false);
    }
  }, [open, fetchData]);

  const selected = packages.find((p) => p.id === selectedPkg);

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
        onPurchased?.();
        fetchData();
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass rounded-3xl border border-white/[0.06] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                  <Zap size={18} className="text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-display">Purchase Credits</h2>
                  <p className="text-xs text-text-tertiary">Choose a package and complete payment</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-xl glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold font-display mb-2">Request Submitted</h3>
                  <p className="text-sm text-text-secondary max-w-sm mx-auto">
                    Your purchase request has been submitted for verification. You&apos;ll receive your credits once the payment is confirmed.
                  </p>
                  <Button variant="neon" size="md" className="mt-6" onClick={onClose}>
                    Close
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Step 1: Package Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="size-6 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-[11px] font-bold text-neon-cyan">
                        1
                      </span>
                      <h3 className="text-sm font-semibold text-text-primary">Select a Package</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {packages.map((pkg) => {
                        const isSelected = pkg.id === selectedPkg;
                        const isBest = pkg.id === bestValueId;
                        const totalCredits = pkg.credits + pkg.bonusCredits;

                        return (
                          <motion.button
                            key={pkg.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPkg(pkg.id)}
                            className={cn(
                              "relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer",
                              isSelected
                                ? "border-neon-cyan/50 bg-neon-cyan/5 shadow-[0_0_20px_rgba(0,245,212,0.08)]"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                            )}
                          >
                            {isBest && (
                              <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-neon-cyan text-black flex items-center gap-1">
                                <Sparkles size={9} /> Best Value
                              </span>
                            )}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-text-secondary">{pkg.name}</span>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="size-4 rounded-full bg-neon-cyan flex items-center justify-center"
                                >
                                  <Check size={10} className="text-black" />
                                </motion.div>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="text-2xl font-bold font-display text-text-primary">{totalCredits}</span>
                              <span className="text-xs text-text-tertiary">credits</span>
                            </div>
                            {pkg.bonusCredits > 0 && (
                              <p className="text-[11px] text-neon-cyan mb-2">
                                +{pkg.bonusCredits} bonus credits
                              </p>
                            )}
                            <p className="text-lg font-semibold text-text-primary">{formatNaira(pkg.priceNaira)}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Payment Instructions */}
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6">
                          {/* Transfer Step */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="size-6 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-[11px] font-bold text-neon-cyan">
                                2
                              </span>
                              <h3 className="text-sm font-semibold text-text-primary">Make Payment</h3>
                            </div>

                            <p className="text-sm text-text-secondary mb-3">
                              Transfer <span className="font-semibold text-neon-cyan">{formatNaira(selected.priceNaira)}</span> to the account below:
                            </p>

                            {bankDetail && (
                              <div className="glass rounded-2xl p-5 border border-white/[0.06]">
                                <div className="space-y-3">
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
                              </div>
                            )}
                          </div>

                          {/* Payment Details Form */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="size-6 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-[11px] font-bold text-neon-cyan">
                                3
                              </span>
                              <h3 className="text-sm font-semibold text-text-primary">Enter Payment Details</h3>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-text-tertiary mb-1.5">
                                  Name on Account <span className="text-neon-pink">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={accountName}
                                  onChange={(e) => setAccountName(e.target.value)}
                                  placeholder="Name used to make the transfer"
                                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-text-tertiary mb-1.5">
                                  Bank You Paid From <span className="text-text-tertiary">(optional)</span>
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
                                  Reference / Remark <span className="text-text-tertiary">(optional)</span>
                                </label>
                                <input
                                  type="text"
                                  value={reference}
                                  onChange={(e) => setReference(e.target.value)}
                                  placeholder="e.g. transaction ref"
                                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Submit */}
                          <Button
                            variant="neon"
                            size="lg"
                            className="w-full"
                            loading={submitting}
                            disabled={!accountName.trim()}
                            onClick={handleSubmit}
                          >
                            Submit for Verification
                            <ArrowRight size={16} />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Purchase History */}
                  {requests.length > 0 && (
                    <div>
                      <button
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-text-tertiary" />
                          <h3 className="text-sm font-semibold text-text-primary">Purchase History</h3>
                          <span className="text-[11px] text-text-tertiary">({requests.length})</span>
                        </div>
                        {historyExpanded ? (
                          <ChevronUp size={14} className="text-text-tertiary" />
                        ) : (
                          <ChevronDown size={14} className="text-text-tertiary" />
                        )}
                      </button>

                      <AnimatePresence>
                        {historyExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2">
                              {requests.map((req) => {
                                const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                const Icon = st.icon;
                                return (
                                  <div
                                    key={req.id}
                                    className="glass rounded-xl p-3.5 border border-white/[0.04]"
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-primary">
                                          {req.package?.name || `${req.credits} credits`}
                                        </span>
                                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border", st.color)}>
                                          <Icon size={9} />
                                          {st.label}
                                        </span>
                                      </div>
                                      <span className="text-xs text-text-tertiary">
                                        {new Date(req.createdAt).toLocaleDateString("en-NG", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-text-tertiary">
                                        {req.credits} credits
                                      </span>
                                      <span className="text-xs font-medium text-text-secondary">
                                        {formatNaira(req.amountNaira)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
