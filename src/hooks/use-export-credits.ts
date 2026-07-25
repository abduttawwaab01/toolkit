"use client";

import { useState, useCallback } from "react";

interface SpendLimits {
  withinFreeLimit: boolean;
  creditsNeeded?: number;
  creditsPerExport?: number;
  creditsPerMinute?: number;
  dailyRemaining?: number;
  weeklyRemaining?: number;
  monthlyRemaining?: number;
  yearlyRemaining?: number;
}

export function useExportCredits() {
  const [showSpendDialog, setShowSpendDialog] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [pendingCost, setPendingCost] = useState(0);
  const [spending, setSpending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<SpendLimits | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [pendingResolve, setPendingResolve] = useState<((value: boolean) => void) | null>(null);

  const checkExportCredits = useCallback(async (durationMinutes: number): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch("/api/credits/spend");
      if (!res.ok) throw new Error("Failed to check export limits");
      const data: SpendLimits = await res.json();
      setLimits(data);

      if (data.withinFreeLimit) {
        const spendRes = await fetch("/api/credits/spend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationMinutes: 0 }),
        });
        if (!spendRes.ok) throw new Error("Failed to record free export");
        return true;
      }

      const cost = data.creditsNeeded ?? 0;
      setPendingCost(cost);
      setPendingDuration(durationMinutes);
      setShowSpendDialog(true);

      return new Promise<boolean>((resolve) => {
        setPendingResolve(() => resolve);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export check failed");
      return false;
    }
  }, []);

  const confirmSpend = useCallback(async (): Promise<boolean> => {
    setSpending(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: pendingDuration }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError("Insufficient credits");
          setShowSpendDialog(false);
          setShowPurchaseModal(true);
          pendingResolve?.(false);
          return false;
        }
        throw new Error(data.error || "Failed to spend credits");
      }
      setShowSpendDialog(false);
      pendingResolve?.(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spend failed");
      pendingResolve?.(false);
      return false;
    } finally {
      setSpending(false);
      setPendingResolve(null);
    }
  }, [pendingDuration, pendingResolve]);

  const cancelSpend = useCallback(() => {
    setShowSpendDialog(false);
    pendingResolve?.(false);
    setPendingResolve(null);
  }, [pendingResolve]);

  return {
    showSpendDialog,
    showPurchaseModal,
    setShowPurchaseModal,
    pendingCost,
    spending,
    error,
    limits,
    checkExportCredits,
    confirmSpend,
    cancelSpend,
  };
}
