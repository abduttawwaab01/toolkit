import { create } from "zustand";
import type { EditorProject, Track, Clip, EditorPanel, DragState, Transition, TransitionType, AudioEffectType } from "@/types/editor";
import type { ExportHistoryEntry, ExportJob } from "@/types/export";
import { clampZoom } from "./timeline-utils";
import { createEffect } from "./effects/index";
import { createAudioEffect } from "./effects/audio-effects";

const MAX_HISTORY = 50;
const uuid = () => crypto.randomUUID();

interface HistoryEntry {
  tracks: Track[];
  clips: Clip[];
  transitions: Transition[];
  masterVolume: number;
}

interface EditorState {
  project: EditorProject;
  tracks: Track[];
  clips: Clip[];
  playhead: number;
  isPlaying: boolean;
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  activePanel: EditorPanel;
  previewMuted: boolean;
  snapEnabled: boolean;
  masterVolume: number;
  transitions: Transition[];
  dragState: DragState;

  // History
  past: HistoryEntry[];
  future: HistoryEntry[];

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Project
  setProject: (updates: Partial<EditorProject>) => void;

  // Tracks
  addTrack: (type: Track["type"]) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Clips
  addClip: (clipData: Omit<Clip, "id">) => string;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  removeClip: (id: string) => void;
  moveClip: (id: string, newStartTime: number, newTrackId?: string) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  trimClip: (clipId: string, edge: "start" | "end", newStartTime: number, newDuration: number, newTrimStart: number, newTrimEnd: number) => void;
  rippleDeleteClip: (id: string) => void;

  // Effects
  addEffectToClip: (clipId: string, effectType: string) => void;
  removeEffectFromClip: (clipId: string, effectId: string) => void;
  updateEffectParam: (clipId: string, effectId: string, key: string, value: number | string | boolean) => void;
  toggleEffect: (clipId: string, effectId: string) => void;

  // Transitions
  addTransition: (clipInId: string, clipOutId: string, trackId: string, type?: TransitionType, duration?: number) => void;
  removeTransition: (id: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;

  // Audio
  setMasterVolume: (volume: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  addAudioEffectToTrack: (trackId: string, effectType: AudioEffectType) => void;
  removeAudioEffectFromTrack: (trackId: string, effectId: string) => void;
  updateAudioEffectParam: (trackId: string, effectId: string, key: string, value: number) => void;
  toggleAudioEffect: (trackId: string, effectId: string) => void;
  addVolumeKeyframe: (clipId: string, time: number, value: number) => void;
  removeVolumeKeyframe: (clipId: string, keyframeIndex: number) => void;
  updateVolumeKeyframe: (clipId: string, keyframeIndex: number, updates: { time?: number; value?: number }) => void;

  // Playback
  setPlayhead: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;

  // View
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setScrollLeft: (scroll: number) => void;
  setScrollTop: (scroll: number) => void;

  // Selection
  selectClip: (id: string | null) => void;
  selectTrack: (id: string | null) => void;

  // UI
  setActivePanel: (panel: EditorPanel) => void;
  toggleMute: () => void;
  toggleSnap: () => void;

  // Drag
  setDragState: (state: DragState) => void;
  clearDragState: () => void;

  // Export
  showExportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
  exportHistory: ExportHistoryEntry[];
  addExportHistoryEntry: (entry: ExportHistoryEntry) => void;

  // Helpers
  getClip: (id: string) => Clip | undefined;
  getTrack: (id: string) => Track | undefined;
  getTrackClips: (trackId: string) => Clip[];
}

const defaultProject: EditorProject = {
  id: uuid(),
  name: "Untitled Project",
  duration: 60,
  fps: 30,
  width: 1920,
  height: 1080,
};

const defaultTracks: Track[] = [
  { id: uuid(), name: "Video 1", type: "video", index: 0, locked: false, muted: false, solo: false, volume: 1, audioEffects: [], height: 60, color: "#4facfe" },
  { id: uuid(), name: "Audio 1", type: "audio", index: 1, locked: false, muted: false, solo: false, volume: 1, audioEffects: [], height: 50, color: "#00f5d4" },
  { id: uuid(), name: "Text", type: "text", index: 2, locked: false, muted: false, solo: false, volume: 1, audioEffects: [], height: 40, color: "#bf6aff" },
];

export const useEditorStore = create<EditorState>()((set, get) => ({
  project: defaultProject,
  tracks: defaultTracks,
  clips: [],
  playhead: 0,
  isPlaying: false,
  zoom: 100,
  scrollLeft: 0,
  scrollTop: 0,
  selectedClipId: null,
  selectedTrackId: null,
  activePanel: "media",
  previewMuted: false,
  snapEnabled: true,
  masterVolume: 1,
  transitions: [],
  dragState: { type: "none", clipId: null, startX: 0, startTime: 0, originalStartTime: 0, originalDuration: 0 },
  showExportDialog: false,
  exportHistory: [],
  past: [],
  future: [],

  pushHistory: () =>
    set((s) => ({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), { tracks: s.tracks, clips: s.clips, transitions: s.transitions, masterVolume: s.masterVolume }],
      future: [],
    })),

  undo: () => {
    const { past, tracks, clips, transitions, masterVolume } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...past.slice(-1), { tracks, clips, transitions, masterVolume }, ...get().future.slice(-(MAX_HISTORY - 1))],
      tracks: prev.tracks,
      clips: prev.clips,
      transitions: prev.transitions,
      masterVolume: prev.masterVolume,
      selectedClipId: null,
    });
  },

  redo: () => {
    const { future, tracks, clips, transitions, masterVolume } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [...get().past, { tracks, clips, transitions, masterVolume }].slice(-MAX_HISTORY),
      tracks: next.tracks,
      clips: next.clips,
      transitions: next.transitions,
      masterVolume: next.masterVolume,
      selectedClipId: null,
    });
  },

  setProject: (updates) => set((s) => ({ project: { ...s.project, ...updates } })),

  addTrack: (type) =>
    set((s) => {
      const colors: Record<string, string> = { video: "#4facfe", audio: "#00f5d4", text: "#bf6aff", overlay: "#ff006e" };
      const newTrack: Track = {
        id: uuid(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${s.tracks.filter((t) => t.type === type).length + 1}`,
        type,
        index: s.tracks.length,
        locked: false,
        muted: false,
        solo: false,
        volume: 1,
        audioEffects: [],
        height: type === "audio" ? 50 : type === "text" ? 40 : 60,
        color: colors[type] || "#fff",
      };
      get().pushHistory();
      return { tracks: [...s.tracks, newTrack] };
    }),

  removeTrack: (id) => {
    get().pushHistory();
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id), clips: s.clips.filter((c) => c.trackId !== id) }));
  },

  updateTrack: (id, updates) => set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  reorderTracks: (fromIndex, toIndex) =>
    set((s) => {
      const tracks = [...s.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { tracks: tracks.map((t, i) => ({ ...t, index: i })) };
    }),

  addClip: (clipData) => {
    const id = uuid();
    get().pushHistory();
    set((s) => ({ clips: [...s.clips, { id, ...clipData, volumeKeyframes: clipData.volumeKeyframes ?? [] } as Clip] }));
    return id;
  },

  updateClip: (id, updates) => set((s) => ({ clips: s.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),

  removeClip: (id) => {
    get().pushHistory();
    set((s) => ({ clips: s.clips.filter((c) => c.id !== id), selectedClipId: s.selectedClipId === id ? null : s.selectedClipId }));
  },

  moveClip: (id, newStartTime, newTrackId) => set((s) => ({ clips: s.clips.map((c) => (c.id === id ? { ...c, startTime: Math.max(0, newStartTime), trackId: newTrackId || c.trackId } : c)) })),

  splitClip: (clipId, splitTime) => {
    const clip = get().clips.find((c) => c.id === clipId);
    if (!clip) return;
    if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) return;

    get().pushHistory();

    const newDuration = splitTime - clip.startTime;
    const splitDuration = clip.duration - newDuration;

    set((s) => ({
      clips: [
        ...s.clips.map((c) => (c.id === clipId ? { ...c, duration: newDuration } : c)),
        {
          ...clip,
          id: uuid(),
          startTime: splitTime,
          duration: splitDuration,
          trimStart: clip.trimStart + newDuration,
        },
      ],
    }));
  },

  trimClip: (clipId, edge, newStartTime, newDuration, newTrimStart, newTrimEnd) => {
    get().pushHistory();
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              startTime: edge === "start" ? Math.max(0, newStartTime) : c.startTime,
              duration: Math.max(0.1, newDuration),
              trimStart: edge === "start" ? Math.max(0, newTrimStart) : c.trimStart,
              trimEnd: edge === "end" ? Math.max(0, newTrimEnd) : c.trimEnd,
            }
          : c,
      ),
    }));
  },

  // ── Effects ──

  addEffectToClip: (clipId, effectType) => {
    get().pushHistory();
    const effect = createEffect(effectType);
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId ? { ...c, effects: [...c.effects, effect] } : c,
      ),
    }));
  },

  removeEffectFromClip: (clipId, effectId) => {
    get().pushHistory();
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId ? { ...c, effects: c.effects.filter((e) => e.id !== effectId) } : c,
      ),
    }));
  },

  updateEffectParam: (clipId, effectId, key, value) => {
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              effects: c.effects.map((e) =>
                e.id === effectId ? { ...e, params: { ...e.params, [key]: value } } : e,
              ),
            }
          : c,
      ),
    }));
  },

  toggleEffect: (clipId, effectId) => {
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              effects: c.effects.map((e) =>
                e.id === effectId ? { ...e, enabled: !e.enabled } : e,
              ),
            }
          : c,
      ),
    }));
  },

  // ── Transitions ──

  addTransition: (clipInId, clipOutId, trackId, type = "crossfade", duration = 0.5) => {
    get().pushHistory();
    const id = crypto.randomUUID();
    set((s) => ({
      transitions: [
        ...s.transitions,
        { id, type, duration, clipInId, clipOutId, trackId },
      ],
    }));
    return id;
  },

  removeTransition: (id) => {
    get().pushHistory();
    set((s) => ({
      transitions: s.transitions.filter((t) => t.id !== id),
    }));
  },

  updateTransition: (id, updates) => {
    set((s) => ({
      transitions: s.transitions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  rippleDeleteClip: (id) => {
    const clip = get().clips.find((c) => c.id === id);
    if (!clip) return;
    get().pushHistory();
    const deletedEnd = clip.startTime + clip.duration;
    set((s) => ({
      clips: s.clips
        .filter((c) => c.id !== id)
        .map((c) =>
          c.trackId === clip.trackId && c.startTime >= deletedEnd
            ? { ...c, startTime: Math.max(0, c.startTime - clip.duration) }
            : c,
        ),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
    }));
  },

  // ── Audio ──

  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(2, volume)) }),

  setTrackVolume: (trackId, volume) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, volume: Math.max(0, Math.min(2, volume)) } : t)),
  })),

  setTrackSolo: (trackId, solo) => {
    get().pushHistory();
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, solo } : t)),
    }));
  },

  addAudioEffectToTrack: (trackId, effectType) => {
    get().pushHistory();
    const effect = createAudioEffect(effectType);
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, audioEffects: [...t.audioEffects, effect] } : t,
      ),
    }));
  },

  removeAudioEffectFromTrack: (trackId, effectId) => {
    get().pushHistory();
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, audioEffects: t.audioEffects.filter((e) => e.id !== effectId) } : t,
      ),
    }));
  },

  updateAudioEffectParam: (trackId, effectId, key, value) => {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              audioEffects: t.audioEffects.map((e) =>
                e.id === effectId ? { ...e, params: { ...e.params, [key]: value } } : e,
              ),
            }
          : t,
      ),
    }));
  },

  toggleAudioEffect: (trackId, effectId) => {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              audioEffects: t.audioEffects.map((e) =>
                e.id === effectId ? { ...e, enabled: !e.enabled } : e,
              ),
            }
          : t,
      ),
    }));
  },

  addVolumeKeyframe: (clipId, time, value) => {
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              volumeKeyframes: [...(c.volumeKeyframes || []), { time, value }].sort((a, b) => a.time - b.time),
            }
          : c,
      ),
    }));
  },

  removeVolumeKeyframe: (clipId, keyframeIndex) => {
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              volumeKeyframes: (c.volumeKeyframes || []).filter((_, i) => i !== keyframeIndex),
            }
          : c,
      ),
    }));
  },

  updateVolumeKeyframe: (clipId, keyframeIndex, updates) => {
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              volumeKeyframes: (c.volumeKeyframes || []).map((kf, i) =>
                i === keyframeIndex ? { ...kf, ...updates } : kf,
              ),
            }
          : c,
      ),
    }));
  },

  setPlayhead: (time) => set({ playhead: Math.max(0, Math.min(time, get().project.duration)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setZoom: (z) => set({ zoom: clampZoom(z) }),
  zoomIn: () => set((s) => ({ zoom: clampZoom(s.zoom * 1.3) })),
  zoomOut: () => set((s) => ({ zoom: clampZoom(s.zoom / 1.3) })),

  setScrollLeft: (scroll) => set({ scrollLeft: Math.max(0, scroll) }),
  setScrollTop: (scroll) => set({ scrollTop: Math.max(0, scroll) }),

  selectClip: (id) => set({ selectedClipId: id }),
  selectTrack: (id) => set({ selectedTrackId: id }),

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleMute: () => set((s) => ({ previewMuted: !s.previewMuted })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  setDragState: (state) => set({ dragState: state }),
  clearDragState: () => set({ dragState: { type: "none", clipId: null, startX: 0, startTime: 0, originalStartTime: 0, originalDuration: 0 } }),

  setShowExportDialog: (show) => set({ showExportDialog: show }),
  addExportHistoryEntry: (entry) => set((s) => ({ exportHistory: [entry, ...s.exportHistory].slice(0, 50) })),

  getClip: (id) => get().clips.find((c) => c.id === id),
  getTrack: (id) => get().tracks.find((t) => t.id === id),
  getTrackClips: (trackId) => get().clips.filter((c) => c.trackId === trackId),
}));
