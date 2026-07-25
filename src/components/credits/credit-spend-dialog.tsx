"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreditSpendDialogProps {
  feature: string;
  featureLabel: string;
  creditsCost: number;
  onSpend: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CreditSpendDialog({
  feature,
  featureLabel,
  creditsCost,
  onSpend,
  onCancel,
  loading = false,
}: CreditSpendDialogProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const insufficient = balance !== null && balance < creditsCost;

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? d.creditsBalance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  return (
    <AnimatePresence>
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
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm glass rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
        >
          {/* Amber warning top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-yellow-500/80 via-amber-500/80 to-yellow-500/80" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Rate Limit Reached</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{featureLabel}</p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm text-text-secondary mb-4">
              You&apos;ve reached the limit for <span className="font-medium text-text-primary">{featureLabel}</span>.
              Spend credits to continue?
            </p>

            {/* Cost & Balance */}
            <div className="glass rounded-xl p-4 mb-5 space-y-2.5 border border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Cost</span>
                <div className="flex items-center gap-1.5">
                  <Zap size={12} className="text-neon-cyan" />
                  <span className="text-sm font-semibold text-neon-cyan">{creditsCost} credits</span>
                </div>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Your Balance</span>
                <span className={cn("text-sm font-medium", insufficient ? "text-red-400" : "text-text-primary")}>
                  {balance !== null ? `${balance} credits` : "..."}
                </span>
              </div>
            </div>

            {/* Insufficient warning */}
            {insufficient && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 mb-4 flex items-center gap-1.5"
              >
                <AlertTriangle size={12} />
                Insufficient credits. Purchase more to use this feature.
              </motion.p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="glass" size="md" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="neon"
                size="md"
                className="flex-1"
                loading={loading}
                disabled={insufficient || loading}
                onClick={onSpend}
              >
                <Zap size={14} />
                Spend Credits
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
