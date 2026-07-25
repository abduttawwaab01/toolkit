"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: "border-l-neon-cyan",
  error: "border-l-neon-pink",
  warning: "border-l-yellow-500",
  info: "border-l-blue-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = crypto.randomUUID();
    const t: Toast = { ...toast, id };
    setToasts((prev) => [...prev.slice(-4), t]);

    const dur = toast.duration ?? 4000;
    if (dur > 0) {
      timers.current.set(id, setTimeout(() => removeToast(id), dur));
    }
    return id;
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => addToast({ type: "success", title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: "error", title, message, duration: 6000 }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: "warning", title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: "info", title, message }), [addToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto glass-xl border border-border-subtle border-l-2 ${COLORS[toast.type]} rounded-xl px-4 py-3 min-w-[280px] max-w-[380px] shadow-2xl`}
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <Icon size={16} className="text-text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-text-primary">{toast.title}</p>
                    {toast.message && (
                      <p className="text-[10px] text-text-tertiary mt-0.5">{toast.message}</p>
                    )}
                    {toast.action && (
                      <button
                        onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                        className="mt-1.5 text-[10px] font-medium text-neon-cyan hover:underline"
                      >
                        {toast.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="size-5 rounded-lg glass flex items-center justify-center shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
                    aria-label="Dismiss"
                  >
                    <X size={10} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
