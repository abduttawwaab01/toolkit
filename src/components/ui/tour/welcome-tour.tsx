"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: string;
  target?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to ToolKit",
    description: "The world's first mobile-first AI video editing platform. Edit videos in your browser, from any device.",
    icon: "🚀",
  },
  {
    title: "Timeline Editor",
    description: "Drag clips onto the timeline, trim with edge handles, split with S key. Undo/redo with Ctrl+Z.",
    icon: "🎬",
  },
  {
    title: "Media Library",
    description: "Upload videos, audio, and images via drag-and-drop. Click to add them to your timeline.",
    icon: "📁",
  },
  {
    title: "Effects & Transitions",
    description: "Add color grading, blur, filters, animations. Drag transitions between overlapping clips.",
    icon: "✨",
  },
  {
    title: "Audio Mixer",
    description: "Adjust volume, apply EQ, add audio effects. Use mute/solo per track.",
    icon: "🎵",
  },
  {
    title: "Text & Subtitles",
    description: "Add text overlays with 32 fonts, 25 presets, 14 animations. Import/export SRT files.",
    icon: "📝",
  },
  {
    title: "AI Tools",
    description: "Generate captions, rewrite text, chat with AI assistant, detect silence for smart cuts.",
    icon: "🤖",
  },
  {
    title: "Export",
    description: "Export in multiple formats (MP4, WebM, GIF, MP3) with presets for YouTube, TikTok, Instagram.",
    icon: "📥",
  },
];

const STORAGE_KEY = "toolkit_tour_completed_v2";

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            key={step}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-xl border border-border-subtle rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
          >
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-4">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-neon-cyan" : "w-1.5 bg-surface-light"
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-6 py-6 text-center">
              <div className="size-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center">
                <span className="text-2xl">{TOUR_STEPS[step].icon}</span>
              </div>
              <h2 className="text-base font-bold text-text-primary mb-2">{TOUR_STEPS[step].title}</h2>
              <p className="text-xs text-text-tertiary leading-relaxed">{TOUR_STEPS[step].description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
              <button
                onClick={complete}
                className="text-[10px] text-text-tertiary hover:text-text-primary transition-colors"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-text-secondary text-[10px] font-medium hover:bg-glass-medium transition-all"
                  >
                    <ChevronLeft size={12} /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all"
                >
                  {step < TOUR_STEPS.length - 1 ? (
                    <>Next <ChevronRight size={12} /></>
                  ) : (
                    <>Get Started <Sparkles size={12} /></>
                  )}
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={complete}
              className="absolute top-3 right-3 size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary"
              aria-label="Close tour"
            >
              <X size={13} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
