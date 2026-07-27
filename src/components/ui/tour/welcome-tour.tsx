"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  title: string;
  description: string;
  icon: string;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to ToolKit",
    description: "Your free browser-based creative studio. Edit videos, images, and documents with AI-powered tools — no downloads, no watermark, no cost.",
    icon: "🚀",
  },
  {
    title: "Multi-Track Timeline",
    description: "Drag and drop media onto the timeline. Add video, audio, text, and overlay tracks. Trim, split, and arrange clips with precision.",
    icon: "🎬",
    highlight: "timeline",
  },
  {
    title: "AI Co-Pilot",
    description: "Ask the AI to make edits for you. Try: 'Make this clip slower' or 'Add cinematic color'. The AI understands your project context.",
    icon: "🤖",
    highlight: "ai-panel",
  },
  {
    title: "Effects & Transitions",
    description: "Add visual effects, color grading, and transitions between clips. Keyframe animations for position, scale, rotation, and opacity.",
    icon: "✨",
    highlight: "effects-panel",
  },
  {
    title: "Audio Studio",
    description: "Generate background music procedurally, separate stems, remove noise, apply voice effects, and mix with the built-in audio mixer.",
    icon: "🎵",
    highlight: "audio-panel",
  },
  {
    title: "Export in Any Format",
    description: "Export to MP4, WebM, MOV, GIF, MP3, WAV, AAC, FLAC, and more. 4K supported. All processing happens in your browser via FFmpeg WASM.",
    icon: "📤",
    highlight: "export",
  },
  {
    title: "All Free, Forever",
    description: "No watermarks, no hidden costs, no server fees. Everything runs client-side or on free tiers. You own your creations.",
    icon: "💎",
  },
];

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("toolkit-tour-seen");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setDismissed(true);
    localStorage.setItem("toolkit-tour-seen", "true");
  }, []);

  const next = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      close();
    }
  }, [currentStep, close]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass rounded-2xl border border-border-subtle p-6 max-w-sm w-full mx-4 shadow-2xl"
          >
            <button onClick={close} className="absolute top-3 right-3 size-7 rounded-full glass flex items-center justify-center hover:bg-glass-medium transition-all">
              <X size={12} className="text-text-tertiary" />
            </button>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="size-14 rounded-2xl glass flex items-center justify-center">
                <span className="text-2xl">{TOUR_STEPS[currentStep].icon}</span>
              </div>

              <h3 className="text-sm font-semibold text-text-primary">{TOUR_STEPS[currentStep].title}</h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">{TOUR_STEPS[currentStep].description}</p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`size-1.5 rounded-full transition-all ${i === currentStep ? "bg-neon-cyan w-3" : "bg-text-tertiary/30"}`} />
                ))}
              </div>

              <div className="flex gap-1.5">
                {currentStep > 0 && (
                  <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-text-secondary text-[10px] hover:text-text-primary transition-all">
                    <ArrowLeft size={12} /> Back
                  </button>
                )}
                <button onClick={next} className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[10px] hover:bg-neon-cyan/30 transition-all">
                  {currentStep < TOUR_STEPS.length - 1 ? (
                    <>Next <ArrowRight size={12} /></>
                  ) : (
                    <>Get Started <Sparkles size={12} /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
