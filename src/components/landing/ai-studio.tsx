"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Wand2, Mic2, FileAudio, Subtitles, Terminal } from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";

const aiFeatures = [
  { icon: Sparkles, label: "Smart Cut", desc: "AI removes silences and filler words automatically" },
  { icon: Zap, label: "Auto Enhance", desc: "One-click colour grading and audio cleanup" },
  { icon: Wand2, label: "Object Removal", desc: "Remove anything from your video with a brush" },
  { icon: Mic2, label: "Voice Cloning", desc: "Clone any voice with 30 seconds of audio" },
  { icon: FileAudio, label: "Music Gen", desc: "Generate royalty-free music from text prompts" },
  { icon: Subtitles, label: "Auto Subtitles", desc: "Transcribe and translate in 50+ languages" },
];

const terminalLines = [
  { type: "input", text: "$ toolkit process my-video.mp4 --ai-enhance" },
  { type: "output", text: "Analyzing video... 47 scenes detected" },
  { type: "output", text: "Removing background noise... done (3.2s)" },
  { type: "output", text: "Applying colour grade... Cinematic Warm applied" },
  { type: "output", text: "Generating subtitles... 24 languages detected" },
  { type: "success", text: "Export ready: my-video-enhanced.mp4 (4K, HDR)" },
  { type: "output", text: "Time saved: ~4 hours of manual editing" },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= terminalLines.length) {
          setTimeout(() => setVisibleLines(0), 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={ref} className="glass-deep rounded-2xl overflow-hidden border border-neon-cyan/10">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-neon-pink/60" />
          <div className="w-3 h-3 rounded-full bg-amber-400/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
        </div>
        <div className="flex items-center gap-2 ml-4 text-xs text-text-tertiary">
          <Terminal size={12} />
          <span>toolkit-cli v2.4.0</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-sm min-h-[280px]">
        <AnimatePresence>
          {terminalLines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-1.5 ${
                line.type === "input" ? "text-neon-cyan" :
                line.type === "success" ? "text-emerald-400" :
                "text-text-secondary"
              }`}
            >
              {line.type === "input" ? (
                <span className="neon-text">{line.text}</span>
              ) : (
                <span>
                  <span className="text-text-tertiary mr-2">{"->"}</span>
                  {line.text}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleLines <= terminalLines.length && (
          <span className="inline-block w-2 h-4 bg-neon-cyan animate-pulse-neon mt-1" />
        )}
      </div>
    </div>
  );
}

export function AIStudio() {
  return (
    <section id="ai-studio" className="relative py-24 md:py-32">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-20" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(191,106,255,0.08) 0%, transparent 60%)" }} />

      <div className="section-padding max-width-container relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 md:mb-20">
          <SectionBadge label="AI Studio" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            AI That Actually Works.<br />
            <span className="text-text-secondary">Not Just Hype.</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
            Our AI doesn&apos;t just tag along — it does the heavy lifting. Every feature is engineered for real results.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-12">
          {aiFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="holographic-card rounded-2xl p-4 md:p-5 text-center cursor-pointer group">
                <div className="inline-flex p-2.5 rounded-xl bg-neon-purple/10 text-neon-purple mb-3 relative z-10 group-hover:bg-neon-purple/20 transition-colors">
                  <Icon size={20} />
                </div>
                <h4 className="text-sm font-semibold mb-1 relative z-10">{feature.label}</h4>
                <p className="text-xs text-text-tertiary hidden md:block relative z-10">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Animated Terminal Demo */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-12">
          <AnimatedTerminal />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="holographic-card rounded-3xl p-6 md:p-10 text-center max-w-4xl mx-auto relative">
          <h3 className="text-2xl md:text-3xl font-bold font-display mb-4 relative z-10">
            Try It Right Now.<br className="md:hidden" />
            <span className="text-text-secondary"> No account needed.</span>
          </h3>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto relative z-10">
            Upload a video and see the AI magic instantly. Guest mode is fully functional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <span className="glass rounded-xl px-4 py-2 text-sm text-text-secondary flex items-center gap-2">
              <Sparkles size={14} className="text-neon-cyan" /> Drop your video here
            </span>
            <span className="text-text-tertiary text-sm">or</span>
            <span className="glass rounded-xl px-4 py-2 text-sm text-neon-cyan border border-neon-cyan/20 cursor-pointer hover:bg-neon-cyan/5 transition-colors">
              Browse Files
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
