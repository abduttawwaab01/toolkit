"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionBadgeProps {
  label: string;
  className?: string;
}

export function SectionBadge({ label, className }: SectionBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium tracking-widest uppercase rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-neon-cyan animate-pulse-neon" />
      {label}
    </motion.span>
  );
}
