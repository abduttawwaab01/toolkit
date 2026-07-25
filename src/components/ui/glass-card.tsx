"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  glow?: boolean;
  hover3d?: boolean;
}

export function GlassCard({
  children,
  glow,
  hover3d,
  className,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover3d ? { scale: 1.02, rotateX: 2, rotateY: 2 } : undefined}
      className={cn(
        "glass rounded-2xl p-6",
        glow && "hover:animate-glow",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
