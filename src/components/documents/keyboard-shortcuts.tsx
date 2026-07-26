"use client";

import { motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { category: "File", items: [
    { keys: "Ctrl + S", description: "Save document" },
    { keys: "Ctrl + P", description: "Print document" },
  ]},
  { category: "Edit", items: [
    { keys: "Ctrl + Z", description: "Undo" },
    { keys: "Ctrl + Shift + Z", description: "Redo" },
    { keys: "Ctrl + F", description: "Find & Replace (Text editor)" },
    { keys: "Ctrl + A", description: "Select all" },
  ]},
  { category: "Format", items: [
    { keys: "Ctrl + B", description: "Bold" },
    { keys: "Ctrl + I", description: "Italic" },
    { keys: "Ctrl + U", description: "Underline" },
  ]},
  { category: "View", items: [
    { keys: "F11", description: "Fullscreen" },
    { keys: "Ctrl + \\", description: "Toggle sidebar" },
  ]},
  { category: "Blocks", items: [
    { keys: "Tab", description: "Indent (2 spaces)" },
    { keys: "> + Space", description: "Blockquote" },
    { keys: "- + Space", description: "Bullet list" },
    { keys: "1. + Space", description: "Ordered list" },
    { keys: "# + Space", description: "Heading 1" },
    { keys: "## + Space", description: "Heading 2" },
    { keys: "### + Space", description: "Heading 3" },
  ]},
  { category: "Navigation", items: [
    { keys: "Escape", description: "Close dialogs / panels" },
    { keys: "Alt + Arrow Left", description: "Back to dashboard" },
  ]},
];

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassCard className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
              <Keyboard className="size-4 text-neon-cyan" />
            </div>
            <h2 className="text-base font-display font-semibold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider mb-2">{group.category}</h3>
              <div className="space-y-1">
                {group.items.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-text-secondary">{shortcut.description}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-glass-light border border-border-subtle text-xs font-mono text-text-primary">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border-subtle/50 text-[11px] text-text-tertiary text-center">
          Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-glass-light border border-border-subtle font-mono">?</kbd> anytime to open this panel
        </div>
      </GlassCard>
    </motion.div>
  );
}
