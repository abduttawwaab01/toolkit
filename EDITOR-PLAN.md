# ToolKit Editor — The Complete Build Plan

## Philosophy

The editor must feel like a native desktop app in the browser.
It must be fast, fluid, and beautiful at every interaction.

**Mobile-first**: The timeline works with touch. Panels become bottom sheets.
**Desktop-power**: Multi-track, keyboard shortcuts, precision controls.
**AI-native**: Every action has an AI shortcut. The AI co-pilot is always accessible.

---

## Editor Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        App Shell                              │
│  Top Bar: Logo | Project Name | Undo/Redo | Share | Export    │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌─────────────────────────┐ ┌──────────────────┐│
│ │ Left     │ │     Preview / Canvas    │ │ Right            ││
│ │ Sidebar  │ │                         │ │ Sidebar          ││
│ │          │ │  Video preview with     │ │                  ││
│ │ - Media  │ │  overlay controls       │ │ - Properties     ││
│ │ - Text   │ │                         │ │ - Effects        ││
│ │ - Audio  │ │  Audio waveform viz     │ │ - Transitions    ││
│ │ - Stock  │ │                         │ │ - Adjustments    ││
│ │ - AI     │ │                         │ │ - AI Co-Pilot    ││
│ └──────────┘ └─────────────────────────┘ └──────────────────┘│
├──────────────────────────────────────────────────────────────┤
│                        Timeline                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Track 1: Video ──── [Clip A]────[Clip B]────[Clip C]    │ │
│  │ Track 2: Overlay ── [Picture-in-Picture]                │ │
│  │ Track 3: Text ───── [Title]─────[Subtitle]              │ │
│  │ Track 4: Audio ──── [Music]─────────────────[Voiceover] │ │
│  │ Track 5: Audio ──── [Sound FX]──────────────────────────│ │
│  └──────────────────────────────────────────────────────────┘ │
│  Timeline controls: zoom | snap | time ruler | playhead       │
└──────────────────────────────────────────────────────────────┘
```

## Core State (Zustand Store)

```typescript
interface EditorState {
  // Project
  project: { id: string; name: string; duration: number; fps: number; width: number; height: number };
  
  // Tracks
  tracks: Track[];
  // Track = { id; name; type: 'video'|'audio'|'text'|'overlay'; locked: boolean; muted: boolean; clips: Clip[] }
  
  // Clips
  clips: Clip[];
  // Clip = { id; trackId; type; startTime; endTime; duration; src; name; thumbnail; effects: Effect[]; ... }
  
  // Playback
  playhead: number;     // current time in seconds
  isPlaying: boolean;
  zoom: number;          // pixels per second
  scrollX: number;
  scrollY: number;
  
  // Selection
  selectedClipId: string | null;
  selectedTrackId: string | null;
  
  // History (undo/redo)
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  
  // UI state
  activePanel: 'media' | 'effects' | 'text' | 'properties';
  previewMuted: boolean;
  snapEnabled: boolean;
}
```

---

## Phase 1: Core Timeline Engine

**Goal**: A working multi-track timeline with drag, drop, zoom, snap, and playhead.

### Components

```
components/editor/
├── timeline/
│   ├── timeline.tsx            ← Main container, handles zoom/scroll
│   ├── timeline-ruler.tsx     ← Time ruler with markers
│   ├── timeline-playhead.tsx  ← Draggable playhead
│   ├── timeline-track.tsx     ← Single track row
│   ├── timeline-clip.tsx      ← A clip block on a track (draggable, trimmable)
│   ├── timeline-context-menu.tsx
│   └── hooks/
│       ├── use-timeline-drag.ts    ← Drag & drop logic
│       ├── use-timeline-zoom.ts    ← Pinch + scroll zoom
│       ├── use-timeline-snap.ts    ← Snap to markers/clips
│       └── use-timeline-keyboard.ts ← Keyboard shortcuts
├── store/
│   ├── editor-store.ts        ← Zustand store
│   ├── timeline-store.ts      ← Timeline-specific state
│   └── history-store.ts       ← Undo/redo stack
└── lib/
    ├── timeline-utils.ts      ← Time/pixel conversions, validation
    └── clip-factory.ts        ← Create default clips
```

### Track Types
| Type | Behavior |
|------|----------|
| **video** | Main video track. Can have at most 1 visible at any time. |
| **overlay** | Picture-in-picture, logos, overlays. Composited on top of video. |
| **audio** | Background music, voiceovers. Waveform visible. |
| **text** | Titles, lower thirds, subtitles. Rendered as HTML overlays. |

### Interactions
| Gesture | Action |
|---------|--------|
| Click clip | Select it, show properties |
| Drag clip horizontally | Move in time (snap to grid/other clips) |
| Drag clip vertically | Move to different track |
| Drag clip edges | Trim in/out points |
| Pinch on timeline | Zoom in/out (time scale) |
| Scroll wheel | Horizontal scroll (shift + scroll = zoom) |
| Double-click clip | Open in preview / split |
| Right-click clip | Context menu (cut, copy, delete, effects) |

### Data Flow
```
User drags clip → useTimelineDrag → update store → TimelineClip re-renders
                                   → snap calculation
                                   → history checkpoint
                                   → auto-save
```

### Critical Performance Rules
- Virtualize tracks (only render visible portion)
- Clip positions are cached as CSS transforms (GPU accelerated)
- Thumbnails are generated lazily via offscreen canvas
- No re-render while dragging — use refs + RAF

---

## Phase 2: Preview Player

### Components
```
components/editor/player/
├── player.tsx              ← Main player with controls
├── player-controls.tsx      ← Play/pause, seekbar, volume, fullscreen
├── player-canvas.tsx        ← Video element + canvas for effects overlay
├── player-seekbar.tsx       ← Clickable/draggable seekbar
└── player-waveform.tsx      ← Audio waveform visualization
```

### Technical Approach
- Native `<video>` element for playback (hardware accelerated)
- Canvas overlay for real-time effects (filters, text, overlays)
- Audio waveform rendered via OffscreenCanvas (Web Worker)
- Frame-accurate seeking via requestVideoFrameCallback
- Synced playback across preview and timeline playhead

---

## Phase 3: Media Library

```
components/editor/media/
├── media-library.tsx        ← File browser with folders
├── media-upload.tsx         ← Drag-drop zone + upload progress
├── media-item.tsx           ← Thumbnail + name + duration
└── media-search.tsx         ← Search/filter
```

### Flow
1. User drops file → R2 upload via signed URL
2. Metadata saved to Neon via API
3. Thumbnail generated client-side via FFmpeg WASM
4. File appears in media library
5. User drags from library to timeline → clip created

---

## Phase 4: Trimming & Cutting

### Edge Trimming
- Drag left/right edges of clip on timeline
- Real-time preview of trim point
- Snap to playhead, other clip edges, markers
- Keyboard: `I` = set in point, `O` = set out point

### Splitting
- Position playhead on clip
- Right-click → "Split" or keyboard shortcut `S`
- Clip splits into two adjacent clips
- Undo/redo supported

---

## Phase 5: Effects & Transitions

### Effects Pipeline
```
Raw Frame → Color Grading → Filters → Overlays → Text → Output
```

### Built-in Effects
- Color: brightness, contrast, saturation, hue, exposure, temperature
- Blur: gaussian, motion, radial
- Filters: grayscale, sepia, invert, vintage, cinematic
- Transform: crop, rotate, scale, position
- Speed: slow motion, fast forward, reverse
- Audio: volume envelope, fade in/out, equalizer

### Transitions
- Crossfade, fade to black, fade to white
- Slide, wipe, zoom
- Custom duration (default 0.5s)
- Drag transition between clips on timeline

---

## Phase 6: Audio Mixer

```
components/editor/audio/
├── audio-mixer.tsx          ← Volume faders per track
├── audio-waveform.tsx       ← Canvas-rendered waveform
├── audio-equalizer.tsx      ← Graphic EQ
└── audio-effects.tsx        ← Noise gate, compressor, reverb
```

### Features
- Per-track volume + mute/solo
- Master volume
- Keyframe-based volume envelopes
- Audio waveform rendered via Web Audio API + OffscreenCanvas
- Real-time audio effects via AudioContext

---

## Phase 7: Text & Subtitles

```
components/editor/text/
├── text-editor.tsx          ← Rich text editor for titles
├── text-presets.tsx         ← Title templates
├── subtitle-track.tsx       ← SRT-style subtitle editor
└── subtitle-preview.tsx     ← Live preview on canvas
```

### Features
- Rich text: font, size, color, bold, italic, alignment
- Preset animations: fade, slide, typewriter, scale
- Position anywhere on canvas (drag to place)
- Duration control on timeline
- SRT import/export
- AI subtitle generation (wired to Whisper)

---

## Phase 8: FFmpeg WASM Export

```
components/editor/export/
├── export-modal.tsx         ← Format selection + quality settings
├── export-progress.tsx      ← Progress bar with ETA
└── export-presets.tsx       ← YouTube, TikTok, Instagram presets
```

### Technical Approach
- Use `@ffmpeg/ffmpeg` WASM in the browser (no server cost)
- For complex exports, use Inngest to orchestrate
- Track-by-track compositing via canvas capture
- Audio mixing via Web Audio API → MediaRecorder

### Export Formats
- Video: MP4 (H.264), WebM (VP9), MOV, GIF
- Audio: MP3, WAV, AAC, FLAC, OGG
- Custom: resolution, bitrate, framerate, codec
- Presets: YouTube 1080p, TikTok 1080x1920, Instagram Reel

### Optimization
- Export is non-blocking (runs in Web Worker)
- Progress reported back to UI via postMessage
- Cancelable export
- Resume from last keyframe on failure

---

## Phase 9: AI Feature Integration

Wires the existing `ai-router.ts` abstraction into the editor UI.

| AI Feature | UI Entry Point |
|------------|---------------|
| Smart Cut | Right-click clip → "Remove Silence" |
| Auto Subtitles | Tools menu → "Generate Subtitles" |
| Background Removal | Right-click clip → "Remove Background" |
| Voice Cloning | Audio track → "Clone Voice" |
| Text to Speech | Right-click → "Generate Voiceover" |
| AI Co-Pilot | Floating chat button → type prompts |
| Auto Color | Right-click → "Auto Color Grade" |
| Noise Cancellation | Audio clip → "Clean Audio" |

### AI Co-Pilot Chat
```
┌─────────────────────────────────┐
│ 🤖 AI Co-Pilot         [Close] │
│                                 │
│ "Make this clip 30% slower     │
│  and add cinematic color"      │
│                                 │
│ [Execute] [Refine] [Undo]      │
└─────────────────────────────────┘
```
- Natural language → editor actions
- Context-aware (knows selected clip, playhead position)
- One-click execution with preview before applying

---

## Phase 10: Mobile & Polish

### Mobile Adaptations
| Desktop | Mobile |
|---------|--------|
| Sidebar panels | Bottom sheet (swipe up) |
| Timeline drag | Long-press + drag |
| Zoom with scroll | Pinch gesture |
| Right-click | Long-press context menu |
| Keyboard shortcuts | Floating action buttons |
| Multi-track view | Single track focus mode |
| Properties panel | Slide-up inspector |

### Performance Targets
- Timeline scroll: 60fps
- Preview playback: no dropped frames at 1080p
- Export: 2x realtime for 1080p
- Bundle size: < 500KB (editor only)
- First paint: < 1s
- Time to interactive: < 3s

### Animation Targets
- Track expand/collapse: 200ms ease
- Clip selection glow: 150ms
- Panel slide: 300ms spring
- Export progress: radial pulse
- Playhead: 60fps smooth

---

## Implementation Order

| Phase | Week | Deliverable |
|-------|------|-------------|
| **1** | 1-2 | Working timeline: tracks, clips, drag, zoom, snap, playhead, undo/redo |
| **2** | 2-3 | Preview player: video playback, seekbar, waveform, synced to timeline |
| **3** | 3 | Media library: upload to R2, thumbnails, drag to timeline |
| **4** | 3-4 | Trim + split: edge drag, split at playhead, ripple delete |
| **5** | 4-5 | Effects: color, filters, transforms. Transitions between clips |
| **6** | 5 | Audio mixer: volume, mute, waveform, fade in/out |
| **7** | 5-6 | Text: rich text editor, presets, subtitle track, SRT import/export |
| **8** | 6-7 | Export: FFmpeg WASM pipeline, format selection, progress, presets |
| **9** | 7-8 | AI integration: wire AI features to UI, co-pilot chat |
| **10** | 8-9 | Mobile: touch gestures, bottom sheets, responsive layout |

**Total: ~9 weeks for a single developer building full-time.**
