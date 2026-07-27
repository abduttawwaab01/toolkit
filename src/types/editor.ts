export interface EditorProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export type TrackType = "video" | "audio" | "text" | "overlay";

export interface EqBand {
  freq: number;
  gain: number;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  index: number;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  volume: number;
  audioEffects: AudioEffect[];
  eqBands: EqBand[];
  pan: number; // -1 (left) to 1 (right)
  height: number;
  color: string;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: "left" | "center" | "right" | "justify";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  lineHeight: number;
  letterSpacing: number;
  background: string;
  backgroundOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
}

export type TextAnimationType = "none" | "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "typewriter" | "bounce" | "glow" | "pop" | "flip" | "wave" | "shutter";

export interface TextAnimation {
  type: TextAnimationType;
  duration: number;
  delay: number;
  stagger: number;
}

export interface Subtitle {
  id: string;
  index: number;
  start: number;
  end: number;
  text: string;
}

export interface TextPreset {
  id: string;
  name: string;
  description: string;
  category: "title" | "lower-third" | "subtitle" | "callout" | "credit" | "lyric";
  preview: string;
  style: TextStyle;
  animation: TextAnimation;
}

export interface Effect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

export type TransitionType = "crossfade" | "fade-to-black" | "fade-to-white" | "slide-left" | "slide-right" | "wipe-left" | "wipe-right" | "zoom-in" | "zoom-out";

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number; // in seconds
  clipInId: string;  // the clip being transitioned FROM
  clipOutId: string; // the clip being transitioned TO
  trackId: string;
}

export interface EffectParamDefinition {
  key: string;
  label: string;
  type: "number" | "boolean" | "select";
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface EffectDefinition {
  id: string;
  name: string;
  category: "color" | "blur" | "filter" | "transform" | "stylistic" | "distort" | "light" | "film";
  description: string;
  params: EffectParamDefinition[];
  icon: string;
}

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  name: string;
  src: string | null;
  thumbnail: string | null;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
  volumeKeyframes: VolumeKeyframe[];
  effects: Effect[];
  textContent?: string;
  textStyle?: TextStyle;
  textAnimation?: TextAnimation;
  subtitles?: Subtitle[];
  fadeIn?: number;
  fadeOut?: number;
  opacity: number;
  scale: number;
  rotation: number;
  positionX: number;
  positionY: number;
  animationKeyframes?: AnimationKeyframe[];
}

export type AnimationProperty = "opacity" | "scale" | "rotation" | "positionX" | "positionY";

export interface AnimationKeyframe {
  id: string;
  time: number; // relative to clip start, in seconds
  property: AnimationProperty;
  value: number;
  easing: EasingType;
}

export type EasingType = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring" | "bounce" | "elastic";

export interface EasingDefinition {
  id: EasingType;
  label: string;
  css: string;
}

export const EASING_DEFINITIONS: EasingDefinition[] = [
  { id: "linear", label: "Linear", css: "linear" },
  { id: "ease-in", label: "Ease In", css: "cubic-bezier(0.4, 0, 1, 1)" },
  { id: "ease-out", label: "Ease Out", css: "cubic-bezier(0, 0, 0.2, 1)" },
  { id: "ease-in-out", label: "Ease In-Out", css: "cubic-bezier(0.4, 0, 0.2, 1)" },
  { id: "spring", label: "Spring", css: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  { id: "bounce", label: "Bounce", css: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" },
  { id: "elastic", label: "Elastic", css: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" },
];

export const ANIMATION_PROPERTIES: { id: AnimationProperty; label: string; icon: string; min: number; max: number; default: number; step: number }[] = [
  { id: "opacity", label: "Opacity", icon: "👁", min: 0, max: 1, default: 1, step: 0.01 },
  { id: "scale", label: "Scale", icon: "🔍", min: 0, max: 5, default: 1, step: 0.05 },
  { id: "rotation", label: "Rotation", icon: "🔄", min: -360, max: 360, default: 0, step: 1 },
  { id: "positionX", label: "Position X", icon: "↔", min: -2000, max: 2000, default: 0, step: 1 },
  { id: "positionY", label: "Position Y", icon: "↕", min: -2000, max: 2000, default: 0, step: 1 },
];

export interface VolumeKeyframe {
  time: number;  // relative to clip start
  value: number; // 0-1
}

export interface AudioEffect {
  id: string;
  type: AudioEffectType;
  name: string;
  enabled: boolean;
  params: Record<string, number>;
}

export type AudioEffectType = "noise-gate" | "compressor" | "reverb" | "delay" | "chorus" | "distortion" | "voice-changer" | "tone-enhancer" | "noise-removal" | "bg-music-removal" | "silence-removal";

export interface AudioEffectDefinition {
  id: AudioEffectType;
  name: string;
  description: string;
  icon: string;
  params: AudioEffectParamDefinition[];
}

export interface AudioEffectParamDefinition {
  key: string;
  label: string;
  default: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface TimeRulerMarker {
  time: number;
  label: string;
  type: "major" | "minor";
}

export type EditorPanel = "media" | "effects" | "text" | "properties" | "audio" | "ai" | "settings" | "elements" | "video" | "collaborate" | "templates" | "color" | "voice" | "music";

export interface EditorSnapshot {
  tracks: Track[];
  clips: Clip[];
  project: EditorProject;
  masterVolume: number;
}

export interface DragState {
  type: "move" | "trim-start" | "trim-end" | "none";
  clipId: string | null;
  startX: number;
  startTime: number;
  originalStartTime: number;
  originalDuration: number;
}
