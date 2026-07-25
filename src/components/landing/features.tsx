"use client";

import { motion } from "framer-motion";
import { Video, Music, Mic, Image, Bot, Wand } from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";
import { FEATURES } from "@/lib/constants";

const iconMap = { Video, Music, Mic, Image, Bot, Wand } as const;

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-30" />

      <div className="section-padding max-width-container relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 md:mb-20">
          <SectionBadge label="Features" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            Everything You Need.<br />
            <span className="text-text-secondary">Nothing You Don&apos;t.</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
            AI-powered tools that make professional editing effortless. From smart cuts to voice cloning, we&apos;ve got you covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.1 }}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="holographic-card rounded-2xl p-6 h-full cursor-default group"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 mb-4 relative z-10`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 relative z-10">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed relative z-10">{feature.description}</p>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,245,212,0.06) 0%, transparent 60%)" }} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
