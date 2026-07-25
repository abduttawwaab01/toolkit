"use client";

import { useEffect, useRef, useState } from "react";

export function HolographicGrid({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pulsePos, setPulsePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const triggerPulse = () => {
      setPulsePos({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        active: true,
      });
      timeout = setTimeout(() => {
        setPulsePos((prev) => ({ ...prev, active: false }));
        timeout = setTimeout(triggerPulse, 2000 + Math.random() * 4000);
      }, 1200);
    };
    triggerPulse();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}
      style={{ zIndex: -1 }}
    >
      {/* Base grid */}
      <div
        className="absolute inset-0 animate-grid-move"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,245,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,212,0.04) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Secondary offset grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(191,106,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(191,106,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: "40px 40px",
        }}
      />

      {/* Perspective tilt overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,245,212,0.02) 50%, transparent 100%)",
          transform: "perspective(800px) rotateX(2deg)",
          transformOrigin: "center bottom",
        }}
      />

      {/* Pulse traveling along a grid line */}
      {pulsePos.active && (
        <div
          className="absolute size-32 rounded-full transition-all duration-1000 ease-out"
          style={{
            left: `${pulsePos.x}%`,
            top: `${pulsePos.y}%`,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(0,245,212,0.12) 0%, rgba(191,106,255,0.06) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Horizontal pulse line */}
      {pulsePos.active && (
        <div
          className="absolute h-px w-full transition-all duration-[2000ms] ease-linear"
          style={{
            top: `${pulsePos.y}%`,
            background:
              "linear-gradient(90deg, transparent, rgba(0,245,212,0.2), rgba(191,106,255,0.15), transparent)",
          }}
        />
      )}

      {/* Vertical pulse line */}
      {pulsePos.active && (
        <div
          className="absolute w-px h-full transition-all duration-[2000ms] ease-linear"
          style={{
            left: `${pulsePos.x}%`,
            background:
              "linear-gradient(180deg, transparent, rgba(0,245,212,0.2), rgba(191,106,255,0.15), transparent)",
          }}
        />
      )}

      {/* Edge fade mask */}
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
    </div>
  );
}
