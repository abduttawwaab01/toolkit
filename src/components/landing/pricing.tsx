"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionBadge } from "@/components/ui/section-badge";
import { PRICING_PLANS } from "@/lib/constants";

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-20" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(0,245,212,0.05) 0%, transparent 60%)" }} />

      <div className="section-padding max-width-container relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12">
          <SectionBadge label="Pricing" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            Start free.<br />
            <span className="text-text-secondary">Scale when you&apos;re ready.</span>
          </h2>
          <p className="mt-4 text-text-tertiary max-w-xl mx-auto">
            Every account starts free with credits included. Buy more credits anytime — no subscriptions, no hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.1 }} className="relative">
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center z-10">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-neon-cyan text-black flex items-center gap-1">
                    <Sparkles size={10} /> Most Popular
                  </span>
                </div>
              )}
              <motion.div
                whileHover={{ y: -5 }}
                className={`holographic-card rounded-2xl p-6 h-full flex flex-col ${plan.popular ? "border-neon-cyan/30 ring-1 ring-neon-cyan/20" : ""}`}
              >
                <div className="mb-6 relative z-10">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-text-tertiary mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display">
                      {plan.priceLabel}
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1 relative z-10">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check size={16} className="mt-0.5 shrink-0 text-neon-cyan" /> {feature}
                    </li>
                  ))}
                </ul>
                <a href={plan.href} className="relative z-10">
                  <Button variant={plan.popular ? "neon" : "glass"} size="lg" className="w-full">{plan.cta}</Button>
                </a>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
