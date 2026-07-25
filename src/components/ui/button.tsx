"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "neon" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  children: React.ReactNode;
}

const variants: Record<string, string> = {
  primary: "bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold hover:opacity-90 shadow-lg shadow-neon-cyan/20",
  secondary: "glass glass-hover text-text-primary",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-glass-medium",
  neon: "bg-transparent text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,245,212,0.15)]",
  glass: "glass glass-hover text-text-primary",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3 text-base rounded-xl",
  xl: "px-9 py-4 text-lg rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="size-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
