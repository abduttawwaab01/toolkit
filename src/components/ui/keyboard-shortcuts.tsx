"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Playback",
    shortcuts: [
      { keys: ["Space"], label: "Play / Stop" },
      { keys: ["←", "→"], label: "Step frame backward / forward" },
      { keys: ["Shift", "←"], label: "Jump to previous clip edge" },
      { keys: ["Shift", "→"], label: "Jump to next clip edge" },
      { keys: ["Home"], label: "Go to beginning" },
      { keys: ["End"], label: "Go to end" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["S"], label: "Split clip at playhead" },
      { keys: ["D"], label: "Delete selected clip" },
      { keys: ["Shift", "Del"], label: "Ripple delete (close gap)" },
      { keys: ["I"], label: "Set in point" },
      { keys: ["O"], label: "Set out point" },
      { keys: ["N"], label: "Toggle snap" },
    ],
  },
  {
    title: "History",
    shortcuts: [
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], label: "Redo" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["Ctrl", "+"], label: "Zoom in" },
      { keys: ["Ctrl", "-"], label: "Zoom out" },
      { keys: ["Ctrl", "0"], label: "Reset zoom" },
      { keys: ["\\"], label: "Toggle panels" },
      { keys: ["F"], label: "Toggle fullscreen player" },
    ],
  },
  {
    title: "Tools",
    shortcuts: [
      { keys: ["M"], label: "Toggle mute" },
      { keys: ["A"], label: "Select all clips" },
      { keys: ["Escape"], label: "Deselect / Close dialog" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-xl border border-border-subtle rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle sticky top-0 glass z-10">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl glass flex items-center justify-center">
                  <Keyboard size={15} className="text-neon-cyan" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {SHORTCUTS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold mb-2.5">{group.title}</h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px] text-text-secondary">{sc.label}</span>
                        <div className="flex gap-1">
                          {sc.keys.map((key, j) => (
                            <kbd
                              key={j}
                              className="px-1.5 py-0.5 rounded-md glass text-[9px] font-mono text-text-primary border border-border-subtle min-w-[20px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border-subtle text-[9px] text-text-tertiary text-center">
              Press <kbd className="px-1 py-0.5 rounded glass text-[8px] font-mono">?</kbd> anytime to open this help
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useKeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return { open, setOpen };
}
