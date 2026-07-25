"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedCounter({ target, suffix = "", duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  { label: "Active Creators", value: 250000, suffix: "+", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { label: "Videos Edited", value: 12000000, suffix: "+", icon: "M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" },
  { label: "AI Processing Hours", value: 8500000, suffix: "+", icon: "M13 2L3 14h9l-1 10 10-12h-9l1-10z" },
  { label: "Uptime", value: 99, suffix: ".99%", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14" },
];

export function Stats() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-50" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,245,212,0.05) 0%, transparent 60%)" }} />

      <div className="section-padding max-width-container relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex p-3 rounded-2xl glass mb-4 group-hover:glow transition-all duration-300">
                <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold font-display gradient-text mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
