"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className={cn("relative p-2 rounded-xl bg-glass-light border border-glass-medium backdrop-blur-xl text-text-secondary", className)} aria-label="Toggle theme">
        <Sun size={18} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative p-2 rounded-xl backdrop-blur-xl transition-all duration-300",
        "bg-glass-light border border-glass-medium",
        "hover:bg-glass-medium hover:border-glass-heavy",
        "text-text-secondary hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50",
        className,
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}
