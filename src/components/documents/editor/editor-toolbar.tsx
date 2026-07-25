"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ToolbarAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface EditorToolbarProps {
  actions: ToolbarAction[];
  className?: string;
  separators?: boolean;
}

export function EditorToolbar({ actions, className, separators = true }: EditorToolbarProps) {
  const groups: ToolbarAction[][] = [];
  let current: ToolbarAction[] = [];

  actions.forEach((action, i) => {
    if (action.label === "separator") {
      if (current.length > 0) groups.push(current);
      current = [];
    } else {
      current.push(action);
    }
    if (i === actions.length - 1 && current.length > 0) groups.push(current);
  });

  const renderAction = (action: ToolbarAction, key: string) => (
    <motion.button
      key={key}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={action.label}
      disabled={action.disabled}
      onClick={action.onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50",
        "disabled:pointer-events-none disabled:opacity-30",
        action.active
          ? "bg-neon-cyan/15 text-neon-cyan shadow-[0_0_12px_rgba(0,245,212,0.15)]"
          : "text-text-secondary hover:text-text-primary hover:bg-white/5",
      )}
    >
      <action.icon className="size-4" />
    </motion.button>
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 px-2 py-1.5",
        "bg-glass-light/50 backdrop-blur-xl border border-white/[0.06] rounded-xl",
        className,
      )}
    >
      {separators
        ? groups.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5">
              {gi > 0 && (
                <div className="w-px h-5 bg-white/10 mx-1.5" />
              )}
              {group.map((action, ai) =>
                renderAction(action, `${gi}-${ai}`),
              )}
            </div>
          ))
        : actions.map((action, i) =>
            action.label === "separator" ? (
              <div key={i} className="w-px h-5 bg-white/10 mx-1.5" />
            ) : (
              renderAction(action, String(i))
            ),
          )}
    </div>
  );
}
