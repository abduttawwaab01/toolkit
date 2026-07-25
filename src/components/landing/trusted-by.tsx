"use client";

import { motion } from "framer-motion";
import { SectionBadge } from "@/components/ui/section-badge";

const logos = [
  { name: "YouTube", letter: "YT" },
  { name: "TikTok", letter: "TT" },
  { name: "Spotify", letter: "SP" },
  { name: "Netflix", letter: "NX" },
  { name: "Adobe", letter: "AD" },
  { name: "Discord", letter: "DC" },
  { name: "Twitch", letter: "TW" },
  { name: "Vimeo", letter: "VM" },
];

export function TrustedBy() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div className="section-padding max-width-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm text-text-tertiary uppercase tracking-widest">Trusted by creators at</p>
        </motion.div>

        <div className="relative">
          {/* Gradient fades on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />

          <div className="flex gap-8 md:gap-12 animate-marquee">
            {[...logos, ...logos].map((logo, i) => (
              <motion.div
                key={`${logo.name}-${i}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % logos.length) * 0.05 }}
                className="flex-shrink-0 glass rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-glass-medium transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-xs font-bold text-neon-cyan">
                  {logo.letter}
                </div>
                <span className="text-sm font-medium text-text-tertiary group-hover:text-text-secondary transition-colors">{logo.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
