import { useEditorStore } from "@/lib/editor-store";
import type { Track, Clip } from "@/types/editor";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: "social" | "education" | "presentation" | "music" | "gaming" | "business";
  platform?: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  tracks: Array<{
    type: Track["type"];
    name: string;
    clips: Array<{
      type: Clip["type"];
      duration: number;
      name?: string;
      src?: string | null;
      placeholder?: string;
      effects?: string[];
      textContent?: string;
      textStyle?: Partial<Clip["textStyle"]>;
      textAnimation?: Partial<Clip["textAnimation"]>;
      fadeIn?: number;
      fadeOut?: number;
    }>;
  }>;
  thumbnail?: string;
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "tiktok-transition",
    name: "TikTok Transition Pack",
    description: "Fast-paced transitions with glitch effects for short-form content",
    category: "social",
    platform: "TikTok",
    duration: 15,
    fps: 30,
    width: 1080,
    height: 1920,
    tracks: [
      { type: "video", name: "Main Video", clips: [
        { type: "video", duration: 3, name: "Intro", placeholder: "Upload intro clip", effects: ["glitch"] },
        { type: "video", duration: 4, name: "Main 1", placeholder: "Upload main clip 1" },
        { type: "video", duration: 4, name: "Main 2", placeholder: "Upload main clip 2" },
        { type: "video", duration: 4, name: "Main 3", placeholder: "Upload main clip 3" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 2, textContent: "{{TITLE}}", textStyle: { fontSize: 64, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "fade", duration: 0.5, delay: 0, stagger: 0 }, fadeIn: 0.3 },
        { type: "text", duration: 3, textContent: "Follow for more!", textStyle: { fontSize: 36, color: "#ff6b35", alignment: "center" }, textAnimation: { type: "bounce", duration: 0.5, delay: 0, stagger: 0 } },
      ]},
      { type: "audio", name: "Background", clips: [
        { type: "audio", duration: 15, placeholder: "Add trending audio", fadeIn: 0.5, fadeOut: 2 },
      ]},
    ],
  },
  {
    id: "youtube-intro",
    name: "YouTube Intro",
    description: "Professional channel intro with animated title",
    category: "social",
    platform: "YouTube",
    duration: 10,
    fps: 30,
    width: 1920,
    height: 1080,
    tracks: [
      { type: "video", name: "Video", clips: [
        { type: "video", duration: 5, name: "Intro Footage", placeholder: "Upload intro clip", effects: ["brightness"] },
        { type: "video", duration: 5, name: "Title Card", placeholder: "Upload title card" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 4, textContent: "{{TITLE}}", textStyle: { fontSize: 72, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "scale", duration: 0.5, delay: 0, stagger: 0 } },
        { type: "text", duration: 3, textContent: "Subscribe for weekly content", textStyle: { fontSize: 32, color: "#aaaaaa", alignment: "center" }, fadeIn: 1 },
      ]},
      { type: "audio", name: "Music", clips: [
        { type: "audio", duration: 10, name: "Intro Music", placeholder: "Add intro music", fadeIn: 0.3, fadeOut: 1.5 },
      ]},
    ],
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    description: "Vertical story with dynamic text and gradient background",
    category: "social",
    platform: "Instagram",
    duration: 15,
    fps: 30,
    width: 1080,
    height: 1920,
    tracks: [
      { type: "video", name: "Video", clips: [
        { type: "video", duration: 15, name: "Story Content", placeholder: "Upload your story" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 3, textContent: "{{TITLE}}", textStyle: { fontSize: 56, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "slide-up", duration: 0.4, delay: 0, stagger: 0 } },
        { type: "text", duration: 4, textContent: "Swipe up to learn more!", textStyle: { fontSize: 28, color: "#4cc9f0", alignment: "center" }, textAnimation: { type: "pop", duration: 0.3, delay: 0, stagger: 0 } },
      ]},
      { type: "audio", name: "Audio", clips: [
        { type: "audio", duration: 15, placeholder: "Add background music" },
      ]},
    ],
  },
  {
    id: "presentation",
    name: "Clean Presentation",
    description: "Professional presentation with title and content slides",
    category: "presentation",
    duration: 30,
    fps: 30,
    width: 1920,
    height: 1080,
    tracks: [
      { type: "video", name: "Slides", clips: [
        { type: "video", duration: 10, name: "Title Slide", placeholder: "Upload title slide image", effects: ["brightness"] },
        { type: "video", duration: 10, name: "Content 1", placeholder: "Upload content image 1" },
        { type: "video", duration: 10, name: "Content 2", placeholder: "Upload content image 2" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 8, textContent: "{{TITLE}}", textStyle: { fontSize: 64, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "fade", duration: 0.3, delay: 0, stagger: 0 } },
        { type: "text", duration: 9, textContent: "Key insight 1", textStyle: { fontSize: 40, color: "#4cc9f0", alignment: "left" }, fadeIn: 0.5 },
        { type: "text", duration: 9, textContent: "Key insight 2", textStyle: { fontSize: 40, color: "#f72585", alignment: "left" }, fadeIn: 0.5 },
      ]},
      { type: "audio", name: "Music", clips: [
        { type: "audio", duration: 30, placeholder: "Add background music", fadeIn: 1, fadeOut: 3 },
      ]},
    ],
  },
  {
    id: "gaming-montage",
    name: "Gaming Montage",
    description: "High-energy gaming highlight reel with effects",
    category: "gaming",
    duration: 20,
    fps: 60,
    width: 1920,
    height: 1080,
    tracks: [
      { type: "video", name: "Gameplay", clips: [
        { type: "video", duration: 5, name: "Highlight 1", placeholder: "Upload highlight 1", effects: ["saturate", "contrast"] },
        { type: "video", duration: 5, name: "Highlight 2", placeholder: "Upload highlight 2", effects: ["saturate"] },
        { type: "video", duration: 5, name: "Highlight 3", placeholder: "Upload highlight 3", effects: ["contrast"] },
        { type: "video", duration: 5, name: "Highlight 4", placeholder: "Upload highlight 4" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 2, textContent: "{{TITLE}}", textStyle: { fontSize: 48, color: "#ff6b35", bold: true, alignment: "center" }, textAnimation: { type: "scale", duration: 0.3, delay: 0, stagger: 0 } },
        { type: "text", duration: 2, textContent: "GAMEPLAY", textStyle: { fontSize: 72, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "typewriter", duration: 0.5, delay: 0, stagger: 0.03 } },
      ]},
      { type: "audio", name: "Music", clips: [
        { type: "audio", duration: 20, placeholder: "Add high-energy music" },
      ]},
      { type: "audio", name: "Sound FX", clips: [
        { type: "audio", duration: 0.5, name: "Transition SFX", placeholder: "Add transition sound" },
      ]},
    ],
  },
  {
    id: "karaoke-lyrics",
    name: "Karaoke / Lyrics Video",
    description: "Music visualizer with synchronized lyrics",
    category: "music",
    duration: 30,
    fps: 30,
    width: 1920,
    height: 1080,
    tracks: [
      { type: "video", name: "Background", clips: [
        { type: "video", duration: 30, name: "Background Visual", placeholder: "Upload background video or image" },
      ]},
      { type: "text", name: "Lyrics", clips: [
        { type: "text", duration: 5, textContent: "{{LINE1}}", textStyle: { fontSize: 56, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "fade", duration: 0.3, delay: 0, stagger: 0 } },
        { type: "text", duration: 5, textContent: "{{LINE2}}", textStyle: { fontSize: 56, color: "#ffffff", bold: true, alignment: "center" }, textAnimation: { type: "fade", duration: 0.3, delay: 0, stagger: 0 } },
      ]},
      { type: "audio", name: "Song", clips: [
        { type: "audio", duration: 30, placeholder: "Upload song file" },
      ]},
    ],
  },
  {
    id: "business-promo",
    name: "Business Promo",
    description: "Professional product or service promotion",
    category: "business",
    duration: 20,
    fps: 30,
    width: 1920,
    height: 1080,
    tracks: [
      { type: "video", name: "Main", clips: [
        { type: "video", duration: 5, name: "Opening Shot", placeholder: "Upload establishing shot" },
        { type: "video", duration: 10, name: "Product Demo", placeholder: "Upload product footage" },
        { type: "video", duration: 5, name: "Closing", placeholder: "Upload closing shot", effects: ["brightness"] },
      ]},
      { type: "overlay", name: "Logo", clips: [
        { type: "overlay", duration: 20, name: "Brand Logo", placeholder: "Upload your logo" },
      ]},
      { type: "text", name: "Text", clips: [
        { type: "text", duration: 4, textContent: "{{TITLE}}", textStyle: { fontSize: 60, color: "#ffffff", bold: true, alignment: "left" }, textAnimation: { type: "slide-left", duration: 0.4, delay: 0, stagger: 0 } },
        { type: "text", duration: 4, textContent: "Contact us today!", textStyle: { fontSize: 32, color: "#4cc9f0", alignment: "center" }, textAnimation: { type: "pop", duration: 0.3, delay: 0, stagger: 0 } },
      ]},
      { type: "audio", name: "Music", clips: [
        { type: "audio", duration: 20, placeholder: "Add corporate music", fadeIn: 0.5, fadeOut: 2 },
      ]},
    ],
  },
];

export function getAllTemplates(): TemplateDefinition[] {
  return TEMPLATES;
}

export function getTemplatesByCategory(category: string): TemplateDefinition[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templateToProject(template: TemplateDefinition, variables?: Record<string, string>): any {
  const store = useEditorStore.getState();
  const projectId = crypto.randomUUID();
  const project = { id: projectId, name: template.name, duration: template.duration, fps: template.fps, width: template.width, height: template.height };

  const tracks: Track[] = template.tracks.map((t, i) => ({
    id: crypto.randomUUID(),
    name: t.name,
    type: t.type,
    index: i,
    locked: false,
    muted: false,
    solo: false,
    volume: 1,
    audioEffects: [],
    eqBands: [],
    pan: 0,
    height: t.type === "audio" ? 50 : t.type === "text" ? 40 : 60,
    color: ["#4facfe", "#00f5d4", "#bf6aff", "#ff006e"][i % 4],
  }));

  const clips: Clip[] = [];
  let clipStartTimes: Record<string, number> = {};

  template.tracks.forEach((t, trackIdx) => {
    let currentTime = 0;
    t.clips.forEach((c, clipIdx) => {
      const content = c.textContent?.replace(/\{\{(\w+)\}\}/g, (_, key) => variables?.[key] || `[${key}]`) || c.textContent;
      clips.push({
        id: crypto.randomUUID(),
        trackId: tracks[trackIdx].id,
        type: c.type,
        name: c.name || `${t.name} Clip ${clipIdx + 1}`,
        src: c.src || null,
        thumbnail: null,
        startTime: currentTime,
        duration: c.duration,
        trimStart: 0,
        trimEnd: 0,
        speed: 1,
        volume: 1,
        effects: (c.effects || []).map((e) => ({
          id: crypto.randomUUID(),
          type: e,
          name: e,
          enabled: true,
          params: {},
        })),
        opacity: 1,
        scale: 1,
        rotation: 0,
        positionX: 960,
        positionY: 540,
        textContent: content,
        textStyle: c.textStyle as any,
        textAnimation: c.textAnimation as any,
        fadeIn: c.fadeIn,
        fadeOut: c.fadeOut,
      } as Clip);
      currentTime += c.duration;
    });
  });

  return { project, tracks, clips };
}
