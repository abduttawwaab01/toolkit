"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileType,
  Code,
  FileCode,
  FileImage,
  ArrowRight,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  List,
  Image,
  Link2,
  Palette,
  ChevronRight,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";
import { Button } from "@/components/ui/button";

const formats = [
  { ext: "DOCX", color: "from-blue-500 to-blue-600", label: "Word" },
  { ext: "PDF", color: "from-red-500 to-red-600", label: "PDF" },
  { ext: "MD", color: "from-slate-400 to-slate-500", label: "Markdown" },
  { ext: "TXT", color: "from-text-secondary to-text-tertiary", label: "Plain Text" },
  { ext: "HTML", color: "from-orange-400 to-orange-500", label: "HTML" },
  { ext: "LaTeX", color: "from-emerald-400 to-emerald-500", label: "LaTeX" },
  { ext: "DOCX", color: "from-neon-cyan to-cyan-400", label: "Rich Text" },
  { ext: "RTF", color: "from-neon-purple to-purple-400", label: "RTF" },
];

const conversionPaths = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 2 },
  { from: 2, to: 4 },
  { from: 4, to: 1 },
  { from: 3, to: 0 },
  { from: 2, to: 3 },
];

const formatCards = [
  { icon: FileType, label: "DOCX → PDF", desc: "Preserve formatting perfectly", color: "text-blue-400" },
  { icon: FileCode, label: "MD → HTML", desc: "Web-ready in seconds", color: "text-orange-400" },
  { icon: Code, label: "PDF → TXT", desc: "Extract all text content", color: "text-red-400" },
  { icon: FileText, label: "Any → Markdown", desc: "Clean, portable format", color: "text-neon-cyan" },
];

const orbitFormats = [
  { icon: FileText, label: "DOCX", color: "#3b82f6", angle: 0 },
  { icon: FileType, label: "PDF", color: "#ef4444", angle: 51.4 },
  { icon: Code, label: "MD", color: "#94a3b8", angle: 102.8 },
  { icon: FileCode, label: "HTML", color: "#f97316", angle: 154.3 },
  { icon: FileImage, label: "TXT", color: "#00f5d4", angle: 205.7 },
];

function EditorMockup() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 glass-deep">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-neon-pink/60" />
          <div className="w-3 h-3 rounded-full bg-amber-400/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
        </div>
        <span className="ml-3 text-xs text-text-tertiary font-mono">document-toolkit.md</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="px-2 py-0.5 rounded text-[10px] bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
            Auto-saved
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/5 bg-white/[0.015]">
        {[Bold, Italic, Underline, "sep", AlignLeft, AlignCenter, List, "sep", Link2, Image, Palette].map((item, i) =>
          item === "sep" ? (
            <div key={i} className="w-px h-4 bg-white/10 mx-1" />
          ) : (
            <button
              key={i}
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              {React.createElement(item as React.ElementType, { size: 14 })}
            </button>
          )
        )}
        <div className="ml-auto flex items-center gap-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
            AI
          </span>
        </div>
      </div>

      <div className="flex min-h-[280px]">
        {/* Editor area */}
        <div className="flex-1 p-5 space-y-3">
          <div className="h-6 w-48 bg-gradient-to-r from-neon-cyan/20 to-transparent rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-[90%] bg-white/5 rounded" />
            <div className="h-3 w-[75%] bg-white/5 rounded" />
          </div>
          <div className="h-5 w-32 bg-gradient-to-r from-neon-purple/20 to-transparent rounded mt-4" />
          <div className="space-y-2">
            <div className="h-3 w-[95%] bg-white/5 rounded" />
            <div className="h-3 w-[85%] bg-white/5 rounded" />
            <div className="h-3 w-[60%] bg-white/5 rounded" />
          </div>
          <div className="mt-4 p-3 rounded-lg border border-neon-cyan/10 bg-neon-cyan/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={12} className="text-neon-cyan" />
              <span className="text-[10px] text-neon-cyan font-medium uppercase tracking-wider">AI Suggestion</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-neon-cyan/10 rounded" />
              <div className="h-2 w-[70%] bg-neon-cyan/10 rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar — Format conversion cards */}
        <div className="w-48 border-l border-white/5 p-3 space-y-2 bg-white/[0.01]">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-1">
            <ArrowRightLeft size={10} />
            Convert To
          </div>
          {formatCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2">
                <card.icon size={12} className={card.color} />
                <span className="text-[11px] text-text-primary font-medium">{card.label}</span>
              </div>
              <p className="text-[9px] text-text-tertiary mt-1">{card.desc}</p>
              <ChevronRight
                size={10}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConversionOrbit() {
  const radius = 120;
  return (
    <div className="relative size-[300px] mx-auto">
      {/* Connection lines */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 300 300">
        {conversionPaths.map((path, i) => {
          const fromAngle = (orbitFormats[path.from].angle * Math.PI) / 180;
          const toAngle = (orbitFormats[path.to].angle * Math.PI) / 180;
          const cx = 150;
          const cy = 150;
          const x1 = cx + radius * Math.cos(fromAngle);
          const y1 = cy + radius * Math.sin(fromAngle);
          const x2 = cx + radius * Math.cos(toAngle);
          const y2 = cy + radius * Math.sin(toAngle);
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
          );
        })}
        {/* Flowing particles on lines */}
        {conversionPaths.map((path, i) => {
          const fromAngle = (orbitFormats[path.from].angle * Math.PI) / 180;
          const toAngle = (orbitFormats[path.to].angle * Math.PI) / 180;
          const cx = 150;
          const cy = 150;
          const x1 = cx + radius * Math.cos(fromAngle);
          const y1 = cy + radius * Math.sin(fromAngle);
          const x2 = cx + radius * Math.cos(toAngle);
          const y2 = cy + radius * Math.sin(toAngle);
          return (
            <motion.circle
              key={`particle-${i}`}
              r="2"
              fill="#00f5d4"
              opacity="0.6"
              initial={{ cx: x1, cy: y1 }}
              animate={{ cx: [x1, x2, x1], cy: [y1, y2, y1] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "linear", delay: i * 0.3 }}
            />
          );
        })}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#bf6aff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff006e" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Orbiting format icons */}
      <div className="absolute inset-0 animate-rotate-slow" style={{ animationDuration: "30s" }}>
        {orbitFormats.map((fmt) => {
          const angleRad = (fmt.angle * Math.PI) / 180;
          const x = 150 + radius * Math.cos(angleRad);
          const y = 150 + radius * Math.sin(angleRad);
          return (
            <motion.div
              key={fmt.label}
              className="absolute"
              style={{
                left: x - 20,
                top: y - 20,
              }}
              whileHover={{ scale: 1.2 }}
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ background: `${fmt.color}15`, boxShadow: `0 0 20px ${fmt.color}20` }}
              >
                <fmt.icon size={18} style={{ color: fmt.color }} />
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-text-tertiary">
                {fmt.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Center pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-12 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center animate-pulse-neon">
          <ArrowRightLeft size={16} className="text-neon-cyan" />
        </div>
      </div>
    </div>
  );
}

export function DocumentShowcase() {
  return (
    <section id="documents" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(0,245,212,0.05) 0%, transparent 60%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(191,106,255,0.04) 0%, transparent 60%)" }} />

      <div className="section-padding max-width-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 md:mb-20"
        >
          <SectionBadge label="Documents" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            Create. Convert.<br />
            <span className="gradient-text">Collaborate.</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
            A powerful document system that handles every format. Write, convert between formats instantly,
            and collaborate with AI-powered suggestions — all in your browser.
          </p>
        </motion.div>

        {/* Editor Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-20 max-w-5xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-pink/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <EditorMockup />
          </div>
        </motion.div>

        {/* Conversion orbit + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-bold font-display mb-4">
              Instant Format<br />
              <span className="gradient-text">Conversion</span>
            </h3>
            <p className="text-text-secondary mb-6 max-w-md">
              Drag in any document and convert it to the format you need. Our engine preserves
              formatting, structure, and media — no copy-paste required.
            </p>
            <div className="space-y-3">
              {["100+ format combinations", "Preserve styles & layout", "Batch convert entire folders"].map(
                (text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="size-5 rounded-full bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                      <div className="size-1.5 rounded-full bg-neon-cyan" />
                    </div>
                    <span className="text-sm text-text-secondary">{text}</span>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <ConversionOrbit />
          </motion.div>
        </div>

        {/* Supported formats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h4 className="text-sm uppercase tracking-widest text-text-tertiary mb-6">Supported Formats</h4>
          <div className="flex flex-wrap justify-center gap-3">
            {formats.map((fmt, i) => (
              <motion.div
                key={`${fmt.ext}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, y: -2 }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-br ${fmt.color} bg-opacity-10 border border-white/10 cursor-default`}
              >
                <span className="text-xs font-mono font-bold text-white/90">{fmt.ext}</span>
                <span className="text-[10px] text-white/50 ml-2">{fmt.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a href="/documents">
            <Button variant="neon" size="xl" className="group">
              Start Writing
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
