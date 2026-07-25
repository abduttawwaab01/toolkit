"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, Download, Sparkles } from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Media",
    description: "Drag and drop any video, audio, or image. We support 100+ formats. Guest mode available — no signup needed.",
    color: "from-neon-cyan to-cyan-400",
    glowColor: "rgba(0,245,212,0.15)",
  },
  {
    icon: Cpu,
    title: "AI Processes Everything",
    description: "Our AI analyses your content — detects scenes, removes noise, colour grades, adds subtitles, and applies effects automatically.",
    color: "from-neon-purple to-purple-400",
    glowColor: "rgba(191,106,255,0.15)",
  },
  {
    icon: Sparkles,
    title: "Fine-Tune with AI Tools",
    description: "Use our browser editor to trim, rearrange, add effects, adjust audio, or let the AI co-pilot do it for you.",
    color: "from-neon-pink to-pink-400",
    glowColor: "rgba(255,0,110,0.15)",
  },
  {
    icon: Download,
    title: "Export & Share",
    description: "Export in 4K, 8K, or any format. Direct publish to YouTube, TikTok, Instagram. Watermark-free on paid plans.",
    color: "from-emerald-400 to-teal-400",
    glowColor: "rgba(52,211,153,0.15)",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,245,212,0.04) 0%, transparent 50%)" }} />

      <div className="section-padding max-width-container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 md:mb-20">
          <SectionBadge label="How It Works" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            Three Steps to<br />
            <span className="gradient-text">Studio Quality.</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center group"
              >
                {/* Step number */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.2, type: "spring", bounce: 0.4 }}
                  className="relative z-10 mx-auto mb-6"
                >
                  <div className="relative inline-flex">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-10`}>
                      <step.icon size={28} className="text-white relative z-10" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: step.glowColor }} />
                    <div className="absolute -top-2 -right-2 size-7 rounded-full glass flex items-center justify-center text-xs font-bold text-neon-cyan border border-neon-cyan/20">
                      {i + 1}
                    </div>
                  </div>
                </motion.div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{step.description}</p>

                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-px bg-gradient-to-r from-neon-cyan/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
