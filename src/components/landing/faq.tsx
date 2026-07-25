"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";

const faqs = [
  {
    q: "Do I need an account to start editing?",
    a: "No! ToolKit offers a fully functional guest mode. Upload a video, try AI features, and export — all without signing up. Guest exports include a small watermark.",
  },
  {
    q: "What AI models does ToolKit use?",
    a: "We use a combination of best-in-class models: our own fine-tuned models plus OpenAI, ElevenLabs, Replicate, and self-hosted Whisper. The system intelligently routes tasks to the optimal model.",
  },
  {
    q: "How long are my files stored?",
    a: "File retention is configurable by the admin. For free users, temp files are deleted after 6 hours, processed files after 7 days, and exports after 30 days. You'll get a notification before deletion.",
  },
  {
    q: "What export formats are supported?",
    a: "Video: MP4, AVI, MOV, MKV, WMV, WebM, HEVC, AV1, GIF. Audio: MP3, AAC, WAV, FLAC, OGG, M4A. Images: PNG, JPEG, WEBP, SVG. Custom presets and batch export available on Pro.",
  },
  {
    q: "Can I collaborate with my team?",
    a: "Yes! Business and Enterprise plans support real-time collaboration, shared workspaces, project folders, and team management.",
  },
  {
    q: "Is there a free plan?",
    a: "Absolutely. The Free plan includes basic editing, 720p exports, and 5 AI credits per month. No credit card required.",
  },
  {
    q: "How does AI credit billing work?",
    a: "Each AI feature costs a configurable number of credits. Credits reset monthly on subscription plans. You can also purchase additional credit packs.",
  },
  {
    q: "Can I run ToolKit on my own infrastructure?",
    a: "Enterprise customers can deploy ToolKit on their own infrastructure. Contact sales for a custom quote.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="section-padding max-width-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <SectionBadge label="FAQ" />
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight">
            Got Questions?
            <br />
            <span className="text-text-secondary">We&apos;ve Got Answers.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto mb-10"
        >
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search FAQ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/30"
            />
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {filtered.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="glass glass-hover rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left"
              >
                <span className="text-sm md:text-base font-medium pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown size={16} className="text-text-tertiary" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
