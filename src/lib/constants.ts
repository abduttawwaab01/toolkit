export const APP_NAME = "ToolKit";
export const APP_TAGLINE = "Edit Like a Pro. Think Like AI.";
export const APP_DESCRIPTION =
  "The world's most advanced AI-powered video, audio, and document editing platform. Professional editing so easy a beginner can create studio-quality content.";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Documents", href: "#documents" },
  { label: "AI Studio", href: "#ai-studio" },
  { label: "Pricing", href: "#pricing" },
  { label: "Credits", href: "/credits" },
  { label: "FAQ", href: "#faq" },
] as const;

export const FEATURES = [
  {
    title: "AI Video Editor",
    description: "Smart cut, scene detection, object removal, colour grading, and more — all powered by AI.",
    gradient: "from-neon-cyan to-blue-500",
    icon: "Video",
  },
  {
    title: "AI Audio Studio",
    description: "Noise cancellation, vocal isolation, voice cloning, podcast cleanup, and AI music generation.",
    gradient: "from-neon-purple to-pink-500",
    icon: "Music",
  },
  {
    title: "Speech AI",
    description: "Speech-to-text, text-to-speech, auto subtitles, translation, speaker detection in 50+ languages.",
    gradient: "from-amber-400 to-orange-500",
    icon: "Mic",
  },
  {
    title: "AI Image Tools",
    description: "Background removal, upscaling, face restoration, magic eraser, and AI inpainting.",
    gradient: "from-emerald-400 to-teal-500",
    icon: "Image",
  },
  {
    title: "AI Co-Pilot",
    description: "Chat with your editor. Generate scripts, titles, descriptions, and hashtags with one click.",
    gradient: "from-rose-400 to-red-500",
    icon: "Bot",
  },
  {
    title: "Auto Magic",
    description: "One-click enhancement, podcast cleanup, social media optimisation, and auto colour correction.",
    gradient: "from-violet-400 to-purple-500",
    icon: "Wand",
  },
] as const;

export const PRICING_PLANS = [
  {
    name: "Free",
    price: 0,
    description: "Get started with basic editing",
    features: ["Basic video trimming", "Watermarked exports", "720p max resolution", "5 AI credits/month", "Basic subtitles"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Starter",
    price: 12,
    description: "For content creators getting serious",
    features: ["Full video editor", "No watermark", "1080p exports", "50 AI credits/month", "AI subtitles", "Background removal"],
    cta: "Go Starter",
    popular: false,
  },
  {
    name: "Pro",
    price: 29,
    description: "For professional creators",
    features: ["4K exports", "300 AI credits/month", "Voice cloning", "AI music generator", "Batch processing", "Priority support"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Business",
    price: 79,
    description: "For teams and studios",
    features: ["8K exports", "Unlimited AI credits", "Team collaboration", "Custom branding", "API access", "Dedicated support"],
    cta: "Go Business",
    popular: false,
  },
] as const;

export const AUTO_DELETE_DEFAULTS = {
  guest: { temp: 1, processed: 24, export: 168 },
  free: { temp: 6, processed: 168, export: 720 },
  pro: { temp: 24, processed: 720, export: 2160 },
  business: { temp: 48, processed: 1440, export: 4320 },
} as const;
