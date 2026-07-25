import type { TransitionType } from "@/types/editor";

export interface TransitionDefinition {
  id: TransitionType;
  name: string;
  description: string;
  icon: string;
  defaultDuration: number;
}

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  {
    id: "crossfade",
    name: "Crossfade",
    description: "Smooth dissolve between clips",
    icon: "⟷",
    defaultDuration: 0.5,
  },
  {
    id: "fade-to-black",
    name: "Fade to Black",
    description: "Fade out to black, then fade in",
    icon: "⬛",
    defaultDuration: 0.5,
  },
  {
    id: "fade-to-white",
    name: "Fade to White",
    description: "Fade out to white, then fade in",
    icon: "⬜",
    defaultDuration: 0.5,
  },
  {
    id: "slide-left",
    name: "Slide Left",
    description: "Next clip slides in from the right",
    icon: "⏩",
    defaultDuration: 0.4,
  },
  {
    id: "slide-right",
    name: "Slide Right",
    description: "Next clip slides in from the left",
    icon: "⏪",
    defaultDuration: 0.4,
  },
  {
    id: "wipe-left",
    name: "Wipe Left",
    description: "Horizontal wipe from right to left",
    icon: "▌",
    defaultDuration: 0.5,
  },
  {
    id: "wipe-right",
    name: "Wipe Right",
    description: "Horizontal wipe from left to right",
    icon: "▐",
    defaultDuration: 0.5,
  },
  {
    id: "zoom-in",
    name: "Zoom In",
    description: "Next clip zooms in from center",
    icon: "🔍",
    defaultDuration: 0.4,
  },
  {
    id: "zoom-out",
    name: "Zoom Out",
    description: "Current clip zooms out to reveal next",
    icon: "🔎",
    defaultDuration: 0.4,
  },
];

export function getTransitionDefinition(type: TransitionType): TransitionDefinition | undefined {
  return TRANSITION_DEFINITIONS.find((t) => t.id === type);
}

/** Generate a CSS animation name for a given transition type */
export function transitionCssClass(type: TransitionType): string {
  switch (type) {
    case "crossfade":
      return "opacity";
    case "fade-to-black":
      return "fade-to-black";
    case "fade-to-white":
      return "fade-to-white";
    case "slide-left":
      return "slide-left";
    case "slide-right":
      return "slide-right";
    case "wipe-left":
      return "wipe-left";
    case "wipe-right":
      return "wipe-right";
    case "zoom-in":
      return "zoom-in";
    case "zoom-out":
      return "zoom-out";
  }
}

/** CSS @keyframes and transition overlay styles */
export function transitionOverlayStyle(type: TransitionType, duration: number): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    transition: `all ${duration}s ease`,
  };

  switch (type) {
    case "crossfade":
      return { ...base, background: "transparent" };
    case "fade-to-black":
      return { ...base, background: "#000", opacity: 0 };
    case "fade-to-white":
      return { ...base, background: "#fff", opacity: 0 };
    default:
      return base;
  }
}
