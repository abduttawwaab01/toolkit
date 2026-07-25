import type { TextStyle, TextAnimation } from "@/types/editor";

export const FONTS = [
  { name: "Inter", family: "'Inter', sans-serif", category: "sans-serif" },
  { name: "Roboto", family: "'Roboto', sans-serif", category: "sans-serif" },
  { name: "Poppins", family: "'Poppins', sans-serif", category: "sans-serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", category: "sans-serif" },
  { name: "Open Sans", family: "'Open Sans', sans-serif", category: "sans-serif" },
  { name: "Lato", family: "'Lato', sans-serif", category: "sans-serif" },
  { name: "Raleway", family: "'Raleway', sans-serif", category: "sans-serif" },
  { name: "Oswald", family: "'Oswald', sans-serif", category: "sans-serif" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif", category: "display" },
  { name: "Anton", family: "'Anton', sans-serif", category: "display" },
  { name: "Playfair Display", family: "'Playfair Display', serif", category: "serif" },
  { name: "Merriweather", family: "'Merriweather', serif", category: "serif" },
  { name: "Lora", family: "'Lora', serif", category: "serif" },
  { name: "PT Serif", family: "'PT Serif', serif", category: "serif" },
  { name: "DM Serif", family: "'DM Serif Display', serif", category: "serif" },
  { name: "Pacifico", family: "'Pacifico', cursive", category: "handwriting" },
  { name: "Dancing Script", family: "'Dancing Script', cursive", category: "handwriting" },
  { name: "Caveat", family: "'Caveat', cursive", category: "handwriting" },
  { name: "Kalam", family: "'Kalam', cursive", category: "handwriting" },
  { name: "Unbounded", family: "'Unbounded', sans-serif", category: "display" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif", category: "mono" },
  { name: "DM Sans", family: "'DM Sans', sans-serif", category: "sans-serif" },
  { name: "Archivo", family: "'Archivo', sans-serif", category: "sans-serif" },
  { name: "Syne", family: "'Syne', sans-serif", category: "display" },
  { name: "Sora", family: "'Sora', sans-serif", category: "sans-serif" },
  { name: "Clash Display", family: "'Clash Display', sans-serif", category: "display" },
  { name: "Cabinet Grotesk", family: "'Cabinet Grotesk', sans-serif", category: "sans-serif" },
  { name: "Zodiak", family: "'Zodiak', serif", category: "serif" },
  { name: "Ranade", family: "'Ranade', sans-serif", category: "sans-serif" },
  { name: "Stardom", family: "'Stardom', sans-serif", category: "display" },
  { name: "Gilroy", family: "'Gilroy', sans-serif", category: "sans-serif" },
  { name: "Monument", family: "'Monument Extended', sans-serif", category: "display" },
];

export const FONT_LOAD_URLS = FONTS.map(
  (f) => `https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`,
);

export const ANIMATIONS: { id: string; name: string; description: string }[] = [
  { id: "none", name: "None", description: "No animation" },
  { id: "fade", name: "Fade In", description: "Smooth opacity fade" },
  { id: "slide-up", name: "Slide Up", description: "Slides up from below" },
  { id: "slide-down", name: "Slide Down", description: "Slides down from above" },
  { id: "slide-left", name: "Slide Left", description: "Slides in from right" },
  { id: "slide-right", name: "Slide Right", description: "Slides in from left" },
  { id: "scale", name: "Scale In", description: "Grows from center" },
  { id: "typewriter", name: "Typewriter", description: "Reveals letter by letter" },
  { id: "bounce", name: "Bounce", description: "Elastic bounce entrance" },
  { id: "glow", name: "Glow", description: "Neon glow fade in" },
  { id: "pop", name: "Pop", description: "Quick pop with overshoot" },
  { id: "flip", name: "Flip", description: "3D flip rotation" },
  { id: "wave", name: "Wave", description: "Staggered wave effect" },
  { id: "shutter", name: "Shutter", description: "Vertical shutter reveal" },
];

export function getAnimationCss(animation: TextAnimation, duration: number): React.CSSProperties {
  const animDuration = animation.duration || 0.5;
  const delay = animation.delay || 0;

  const base: React.CSSProperties = {
    animationDuration: `${animDuration}s`,
    animationDelay: `${delay}s`,
    animationFillMode: "both",
  };

  switch (animation.type) {
    case "none":
      return {};
    case "fade":
      return { ...base, animationName: "textFadeIn" };
    case "slide-up":
      return { ...base, animationName: "textSlideUp" };
    case "slide-down":
      return { ...base, animationName: "textSlideDown" };
    case "slide-left":
      return { ...base, animationName: "textSlideLeft" };
    case "slide-right":
      return { ...base, animationName: "textSlideRight" };
    case "scale":
      return { ...base, animationName: "textScaleIn" };
    case "typewriter":
      return { ...base, animationName: "textFadeIn", overflow: "hidden", whiteSpace: "nowrap" as const };
    case "bounce":
      return { ...base, animationName: "textBounce" };
    case "glow":
      return { ...base, animationName: "textGlow" };
    case "pop":
      return { ...base, animationName: "textPop" };
    case "flip":
      return { ...base, animationName: "textFlip" };
    case "wave":
      return { ...base, animationName: "textFadeIn" };
    case "shutter":
      return { ...base, animationName: "textShutter" };
    default:
      return {};
  }
}

export function getTextStyleCss(style: TextStyle): React.CSSProperties {
  return {
    fontFamily: style.fontFamily || "'Inter', sans-serif",
    fontSize: style.fontSize || 48,
    color: style.color || "#ffffff",
    textAlign: style.alignment || "center",
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textTransform: style.uppercase ? "uppercase" : "none",
    lineHeight: style.lineHeight || 1.2,
    letterSpacing: `${style.letterSpacing || 0}px`,
    background: style.background ? `${style.background}${Math.round((style.backgroundOpacity ?? 0.6) * 255).toString(16).padStart(2, "0")}` : "transparent",
    WebkitTextStroke: style.strokeWidth ? `${style.strokeWidth}px ${style.strokeColor || "#000"}` : undefined,
    textShadow: style.shadowColor
      ? `${style.shadowOffsetX || 2}px ${style.shadowOffsetY || 2}px ${style.shadowBlur || 4}px ${style.shadowColor}`
      : undefined,
    borderRadius: `${style.borderRadius || 0}px`,
    padding: `${style.paddingY || 8}px ${style.paddingX || 16}px`,
  } as React.CSSProperties;
}

export function defaultTextStyle(): TextStyle {
  return {
    fontFamily: "'Inter', sans-serif",
    fontSize: 48,
    color: "#ffffff",
    alignment: "center",
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    lineHeight: 1.2,
    letterSpacing: 0,
    background: "",
    backgroundOpacity: 0.6,
    strokeColor: "#000000",
    strokeWidth: 0,
    shadowColor: "#000000",
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    borderRadius: 0,
    paddingX: 16,
    paddingY: 8,
  };
}

export function defaultTextAnimation(): TextAnimation {
  return { type: "none", duration: 0.5, delay: 0, stagger: 0.05 };
}
