"use client";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({ className, children }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 animate-aurora opacity-30"
        style={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)",
          backgroundSize: "400% 400%",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,245,212,0.1) 0%, transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
