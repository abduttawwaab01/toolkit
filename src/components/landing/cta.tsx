"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { APP_NAME } from "@/lib/constants";

export function CTA() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(191,106,255,0.1) 0%, rgba(0,245,212,0.05) 50%, transparent 70%)" }} />
      <Particles count={40} color="#bf6aff" speed={0.2} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/6 size-32 rounded-full bg-neon-cyan/5 blur-[80px] animate-float" />
      <div className="absolute bottom-1/4 right-1/6 size-40 rounded-full bg-neon-purple/5 blur-[80px] animate-float" style={{ animationDelay: "-4s" }} />

      <div className="section-padding max-width-container text-center relative">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="holographic-card rounded-3xl p-8 md:p-16 max-w-4xl mx-auto relative">
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl opacity-50"
            style={{ background: "linear-gradient(135deg, rgba(0,245,212,0.1), transparent, rgba(191,106,255,0.1))", padding: "1px" }} />

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight mb-4">
              Ready to Create?
            </h2>
            <p className="text-text-secondary text-lg md:text-xl max-w-xl mx-auto mb-8">
              Join millions of creators using {APP_NAME} to make professional content in minutes, not hours.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <a href="/auth/register">
              <Button variant="neon" size="xl" className="group">
                <Sparkles size={18} /> Start Creating Free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <a href="#pricing">
              <Button variant="ghost" size="xl">See Plans</Button>
            </a>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.4 }} className="mt-6 text-sm text-text-tertiary relative z-10">
            No credit card required. 5 AI credits free on sign-up.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
