"use client";

import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Play, ArrowDown, Zap } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/landing/floating-particles";
import { APP_TAGLINE, APP_NAME } from "@/lib/constants";

function HolographicOrb() {
  return (
    <div className="relative size-64 md:size-80 lg:size-96 mx-auto">
      {/* Pulsing rings — outer */}
      <div className="absolute inset-0 rounded-full border border-neon-cyan/10 animate-rotate-slow">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(0,245,212,0.8)]" />
      </div>
      <div className="absolute inset-4 rounded-full border border-neon-purple/10 animate-rotate-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-neon-purple shadow-[0_0_12px_rgba(191,106,255,0.8)]" />
      </div>
      <div className="absolute inset-8 rounded-full border border-neon-pink/10 animate-rotate-slow" style={{ animationDuration: "25s" }}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-neon-pink shadow-[0_0_12px_rgba(255,0,110,0.8)]" />
      </div>

      {/* Pulsing rings — additional */}
      <div className="absolute inset-[-8px] rounded-full border border-neon-cyan/5" style={{ animation: "pulse-ring 4s cubic-bezier(0.4,0,0.6,1) infinite" }} />
      <div className="absolute inset-[-16px] rounded-full border border-neon-purple/5" style={{ animation: "pulse-ring 4s cubic-bezier(0.4,0,0.6,1) infinite 1s" }} />
      <div className="absolute inset-[-24px] rounded-full border border-neon-pink/5" style={{ animation: "pulse-ring 4s cubic-bezier(0.4,0,0.6,1) infinite 2s" }} />

      {/* Orbiting dots */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ animation: `orbit ${10 + i * 3}s linear infinite`, animationDelay: `${i * -2}s` }}
        >
          <div className={`size-2 rounded-full ${
            i % 3 === 0 ? "bg-neon-cyan shadow-[0_0_10px_rgba(0,245,212,0.8)]" :
            i % 3 === 1 ? "bg-neon-purple shadow-[0_0_10px_rgba(191,106,255,0.8)]" :
            "bg-neon-pink shadow-[0_0_10px_rgba(255,0,110,0.8)]"
          }`} />
        </div>
      ))}

      {/* Central morphing blob */}
      <div className="absolute inset-16 md:inset-20">
        <div className="w-full h-full animate-morph bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 blur-xl" />
      </div>

      {/* Core glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-20 md:size-24 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 blur-2xl animate-pulse-neon" />
      </div>

      {/* Holographic scan lines */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent animate-scan-line" />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-purple/20 to-transparent animate-scan-line" style={{ animationDelay: "-2s", animationDuration: "6s" }} />
      </div>

      {/* Holographic shimmer overlay */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(0,245,212,0.06) 38%, rgba(191,106,255,0.06) 42%, rgba(255,0,110,0.06) 46%, transparent 54%)",
            backgroundSize: "300% 300%",
            animation: "shimmer-intense 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <Zap size={32} className="text-neon-cyan neon-text" />
          <div className="absolute inset-0 size-12 rounded-full bg-neon-cyan/10 blur-xl animate-pulse-ring" />
        </div>
      </div>
    </div>
  );
}

function FloatingGrid() {
  const lines = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {lines.map((i) => (
        <div
          key={i}
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent"
          style={{ top: `${i * 5}%`, animation: `grid-move ${4 + (i % 3)}s linear infinite`, animationDelay: `${i * -0.2}s` }}
        />
      ))}
    </div>
  );
}

function FloatingShapes() {
  const shapes = useMemo(() => [
    { type: "diamond", x: "15%", y: "20%", size: 16, color: "neon-cyan", delay: 0 },
    { type: "diamond", x: "80%", y: "30%", size: 12, color: "neon-purple", delay: -2 },
    { type: "triangle", x: "25%", y: "65%", size: 14, color: "neon-pink", delay: -1 },
    { type: "diamond", x: "70%", y: "70%", size: 10, color: "neon-cyan", delay: -3 },
    { type: "triangle", x: "90%", y: "15%", size: 11, color: "neon-purple", delay: -1.5 },
    { type: "diamond", x: "40%", y: "80%", size: 8, color: "neon-pink", delay: -4 },
    { type: "triangle", x: "55%", y: "10%", size: 13, color: "neon-cyan", delay: -2.5 },
    { type: "diamond", x: "10%", y: "45%", size: 9, color: "neon-purple", delay: -0.5 },
  ], []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {shapes.map((shape, i) => {
        const colorMap: Record<string, string> = {
          "neon-cyan": "rgba(0,245,212,0.15)",
          "neon-purple": "rgba(191,106,255,0.15)",
          "neon-pink": "rgba(255,0,110,0.15)",
        };
        const borderColorMap: Record<string, string> = {
          "neon-cyan": "rgba(0,245,212,0.25)",
          "neon-purple": "rgba(191,106,255,0.25)",
          "neon-pink": "rgba(255,0,110,0.25)",
        };
        return (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: shape.x,
              top: shape.y,
              animationDelay: `${shape.delay}s`,
              animationDuration: `${6 + (i % 4)}s`,
            }}
          >
            {shape.type === "diamond" ? (
              <div
                style={{
                  width: shape.size,
                  height: shape.size,
                  transform: "rotate(45deg)",
                  border: `1px solid ${borderColorMap[shape.color]}`,
                  background: colorMap[shape.color],
                  animation: `rotate-slow ${20 + i * 5}s linear infinite`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${shape.size / 2}px solid transparent`,
                  borderRight: `${shape.size / 2}px solid transparent`,
                  borderBottom: `${shape.size}px solid ${colorMap[shape.color]}`,
                  filter: `drop-shadow(0 0 4px ${borderColorMap[shape.color]})`,
                  animation: `rotate-slow ${20 + i * 5}s linear infinite reverse`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <AuroraBackground className="relative min-h-screen overflow-hidden">
      <div ref={ref} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-surface" />
        <FloatingGrid />
        <FloatingParticles className="absolute inset-0" count={65} />
        <Particles count={150} color="#00f5d4" speed={0.4} />
        <FloatingShapes />
        <div className="absolute top-1/4 left-1/4 size-64 rounded-full bg-neon-purple/10 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-neon-cyan/8 blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/3 right-1/3 size-48 rounded-full bg-neon-pink/5 blur-[100px] animate-float" style={{ animationDelay: "-1.5s" }} />

        {/* Data stream lines */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-neon-cyan/20 to-transparent"
            style={{
              left: `${15 + i * 17}%`,
              animation: `data-stream ${6 + i}s linear infinite`,
              animationDelay: `${i * -1.5}s`,
            }}
          />
        ))}

        {/* Holographic shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(0,245,212,0.03) 42%, rgba(191,106,255,0.03) 48%, rgba(255,0,110,0.03) 54%, transparent 62%)",
            backgroundSize: "400% 400%",
            animation: "shimmer-intense 8s ease-in-out infinite",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface pointer-events-none" />

      <motion.section
        style={{ opacity, scale, y }}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-widest uppercase rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan">
            <Sparkles size={12} /> AI-Powered Creative Suite
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold font-display tracking-tight leading-[0.9] max-w-5xl"
        >
          <span className="gradient-text">{APP_NAME}</span><br />
          <span className="text-text-primary">Edit Like a Pro.</span><br />
          <span className="text-text-secondary">Think Like AI.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl">
          The world&apos;s most advanced AI-powered video and audio editing platform.<br className="hidden sm:block" />
          Professional editing, zero experience required.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Button variant="neon" size="xl" className="group">
            <Play size={18} className="group-hover:translate-x-0.5 transition-transform" /> Start Editing Free
          </Button>
          <Button variant="glass" size="xl">
            <Sparkles size={18} /> See AI in Action
          </Button>
        </motion.div>

        {/* Holographic Orb */}
        <motion.div style={{ y: orbY }} className="mt-16 md:mt-20">
          <HolographicOrb />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-10">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ArrowDown size={20} className="text-text-tertiary" />
          </motion.div>
        </motion.div>
      </motion.section>
    </AuroraBackground>
  );
}
