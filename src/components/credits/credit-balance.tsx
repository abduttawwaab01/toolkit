"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditPurchaseModal } from "./credit-purchase-modal";

interface CreditBalanceProps {
  compact?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (displayed === value) return;
    const diff = value - displayed;
    const step = diff > 0 ? 1 : -1;
    const steps = Math.abs(diff);
    const interval = Math.max(30, 400 / steps);
    let current = displayed;
    const timer = setInterval(() => {
      current += step;
      setDisplayed(current);
      if (current === value) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [value, displayed]);

  return <span>{displayed}</span>;
}

export function CreditBalance({ compact = true }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const isAdmin = role === "ADMIN";

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance");
      if (res.status === 401) {
        setAuthenticated(false);
        setBalance(0);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? data.creditsBalance ?? 0);
        setRole(data.role ?? null);
        setAuthenticated(true);
      }
    } catch {
      setBalance(0);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (compact) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan hover:bg-neon-cyan/15 transition-all duration-200 shadow-[0_0_12px_rgba(0,245,212,0.08)] cursor-pointer"
        >
          <Zap size={14} className="shrink-0" />
          {authenticated === false ? (
            <span className="text-xs">0</span>
          ) : isAdmin ? (
            <Infinity size={16} className="shrink-0" />
          ) : balance !== null ? (
            <AnimatedNumber value={balance} />
          ) : (
            <span className="size-3 rounded-full bg-neon-cyan/30 animate-pulse" />
          )}
        </button>
        {!isAdmin && (
          <CreditPurchaseModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onPurchased={fetchBalance}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl p-5 w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">Credits</span>
          <Zap size={16} className="text-neon-cyan" />
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold font-display text-text-primary">
            {isAdmin ? (
              <span className="flex items-center gap-1.5"><Infinity size={28} /> Unlimited</span>
            ) : balance !== null ? (
              <AnimatedNumber value={balance} />
            ) : (
              "--"
            )}
          </span>
          {!isAdmin && <span className="text-sm text-text-tertiary">remaining</span>}
        </div>
        {!isAdmin && (
          <>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((balance ?? 0) / 100, 1) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_8px_rgba(0,245,212,0.3)]"
              />
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 text-[11px] text-text-tertiary hover:text-neon-cyan/70 transition-colors cursor-pointer"
            >
              Click to purchase more credits
            </button>
          </>
        )}
        {isAdmin && (
          <p className="mt-1 text-[11px] text-neon-cyan/70">Admin accounts have unlimited free exports</p>
        )}
      </div>
      {!isAdmin && (
        <CreditPurchaseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onPurchased={fetchBalance}
        />
      )}
    </>
  );
}
