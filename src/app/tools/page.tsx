"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CursorGlow } from "@/components/ui/cursor-glow";
import {
  Music, Scissors, Sparkles, Wand2, Image, Video,
  FileAudio, FileVideo, FileImage, Type, Mic, Volume2,
  ArrowUpCircle, Layers, Zap, ChevronRight, Users,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "audio" | "video" | "image" | "text" | "ai";
  href?: string;
  badge?: string;
  gradient: string;
}

const TOOLS: Tool[] = [
  // Audio
  { id: "stem-separation", name: "Stem Separation", description: "Isolate vocals, drums, bass, and other instruments from any audio file using AI.", icon: <Music size={20} />, category: "audio", href: "/editor?tool=stems", badge: "AI", gradient: "from-neon-cyan to-blue-500" },
  { id: "noise-removal", name: "Noise Removal", description: "Remove background noise from recordings, podcasts, and calls.", icon: <Volume2 size={20} />, category: "audio", href: "/editor?tool=noise", gradient: "from-neon-cyan to-blue-500" },
  { id: "audio-converter", name: "Audio Converter", description: "Convert between MP3, WAV, AAC, FLAC, OGG and more formats.", icon: <FileAudio size={20} />, category: "audio", href: "/editor?tool=convert-audio", gradient: "from-neon-cyan to-blue-500" },
  { id: "audio-trimmer", name: "Audio Trimmer", description: "Cut and trim audio files with precision. Remove unwanted parts.", icon: <Scissors size={20} />, category: "audio", href: "/editor?tool=trim-audio", gradient: "from-neon-cyan to-blue-500" },

  // Video
  { id: "video-trimmer", name: "Video Trimmer", description: "Cut and trim video clips quickly. Remove unwanted sections.", icon: <Scissors size={20} />, category: "video", href: "/editor?tool=trim-video", gradient: "from-neon-pink to-purple-500" },
  { id: "video-compressor", name: "Video Compressor", description: "Reduce video file size while maintaining quality.", icon: <FileVideo size={20} />, category: "video", href: "/editor?tool=compress", gradient: "from-neon-pink to-purple-500" },
  { id: "video-enhancer", name: "Video Enhancer", description: "AI-powered video upscaling, sharpening, and quality enhancement.", icon: <Sparkles size={20} />, category: "video", href: "/editor?tool=enhance", badge: "AI", gradient: "from-neon-pink to-purple-500" },
  { id: "video-converter", name: "Video Converter", description: "Convert between MP4, WebM, AVI, MOV and more formats.", icon: <FileVideo size={20} />, category: "video", href: "/editor?tool=convert-video", gradient: "from-neon-pink to-purple-500" },

  // Image
  { id: "background-removal", name: "Background Remover", description: "Remove image backgrounds instantly with AI precision.", icon: <Layers size={20} />, category: "image", href: "/editor?tool=bg-remove", badge: "AI", gradient: "from-amber-500 to-orange-500" },
  { id: "image-resize", name: "Image Resizer", description: "Resize and crop images to any dimension. Perfect for social media.", icon: <Image size={20} />, category: "image", href: "/editor?tool=resize", gradient: "from-amber-500 to-orange-500" },
  { id: "image-converter", name: "Image Converter", description: "Convert between PNG, JPEG, WebP, SVG and more.", icon: <FileImage size={20} />, category: "image", href: "/editor?tool=convert-image", gradient: "from-amber-500 to-orange-500" },

  // AI
  { id: "ai-image-gen", name: "AI Image Generator", description: "Generate images from text prompts using Stable Diffusion.", icon: <Wand2 size={20} />, category: "ai", href: "/editor?tool=generate", badge: "AI", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "ai-video-upscale", name: "AI Video Upscaler", description: "Upscale video resolution up to 4x using Real-ESRGAN AI.", icon: <ArrowUpCircle size={20} />, category: "ai", href: "/editor?tool=upscale", badge: "AI", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "ai-object-removal", name: "AI Object Removal", description: "Remove unwanted objects from video frames using AI inpainting.", icon: <Wand2 size={20} />, category: "ai", href: "/editor?tool=object-removal", badge: "AI", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "ai-subtitles", name: "AI Subtitles", description: "Auto-generate subtitles and captions from video/audio.", icon: <Type size={20} />, category: "ai", href: "/editor?tool=transcribe", badge: "AI", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "ai-music-gen", name: "AI Music Generator", description: "Generate original music from text descriptions using MusicGen AI.", icon: <Music size={20} />, category: "ai", href: "/editor?tool=music", badge: "AI", gradient: "from-violet-500 to-fuchsia-500" },

  // Text
  { id: "text-to-speech", name: "Text to Speech", description: "Convert text to natural-sounding speech using ElevenLabs AI.", icon: <Mic size={20} />, category: "text", href: "/editor?tool=tts", badge: "AI", gradient: "from-emerald-500 to-teal-500" },
  { id: "voice-cloning", name: "Voice Cloning", description: "Clone any voice from audio samples for personalized TTS.", icon: <Mic size={20} />, category: "text", href: "/editor?tool=clone", badge: "AI", gradient: "from-emerald-500 to-teal-500" },

  // Collaboration
  { id: "collaboration", name: "Real-time Collaboration", description: "Share projects, leave comments, and collaborate with your team.", icon: <Users size={20} />, category: "text", href: "/editor?tool=collaborate", gradient: "from-emerald-500 to-teal-500" },
];

const CATEGORIES = [
  { id: "all", label: "All Tools", icon: <Zap size={14} /> },
  { id: "audio", label: "Audio", icon: <Music size={14} /> },
  { id: "video", label: "Video", icon: <Video size={14} /> },
  { id: "image", label: "Image", icon: <Image size={14} /> },
  { id: "ai", label: "AI Tools", icon: <Sparkles size={14} /> },
  { id: "text", label: "Text & Speech", icon: <Type size={14} /> },
] as const;

export default function ToolsPage() {
  const [category, setCategory] = useState<string>("all");

  const filteredTools = category === "all"
    ? TOOLS
    : TOOLS.filter((t) => t.category === category);

  return (
    <>
      <CursorGlow />
      <Navbar />
      <div className="min-h-screen pt-24 pb-16">
        <div className="section-padding max-width-container">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display gradient-text mb-4">
              All Tools
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Everything you need to create, edit, and enhance your content — powered by AI.
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat.id
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "glass text-text-tertiary border border-border-subtle hover:text-text-primary hover:bg-glass-medium"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Tools Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredTools.map((tool, i) => (
              <motion.a
                key={tool.id}
                href={tool.href || "#"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                layout
                className="glass rounded-2xl p-5 border border-border-subtle hover:border-neon-cyan/20 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${tool.gradient} bg-opacity-20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <div className="text-white">{tool.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">{tool.name}</h3>
                      {tool.badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan text-[9px] font-bold">{tool.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary leading-relaxed">{tool.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-text-tertiary group-hover:text-neon-cyan group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </motion.a>
            ))}
          </motion.div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-tertiary">No tools in this category yet.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
