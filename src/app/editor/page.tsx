"use client";

import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo2, Redo2, Scissors, Play, Square,
  Music, Type, Image, Wand2, Download, Sparkles,
  Magnet, Plus, Trash2, GripVertical, Keyboard, Settings,
  PanelLeft, PanelRight, ChevronDown, ChevronUp, ArrowLeft, Pencil, Users, Share2,
  Mic, Palette, LayoutTemplate, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast/toast";
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { useAutoSave, SaveIndicator } from "@/components/ui/auto-save";
import { WelcomeTour } from "@/components/ui/tour/welcome-tour";
import { ClientCron } from "@/components/ui/client-cron";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton, TimelineSkeleton, MediaGridSkeleton, EffectsPanelSkeleton, PlayerSkeleton, MixerSkeleton } from "@/components/ui/skeleton/index";

// Lazy-loaded components for code splitting
const Timeline = lazy(() => import("@/components/editor/timeline/timeline").then(m => ({ default: m.Timeline })));
const Player = lazy(() => import("@/components/editor/player/player").then(m => ({ default: m.Player })));
const MobileTimeline = lazy(() => import("@/components/editor/timeline/mobile-timeline").then(m => ({ default: m.MobileTimeline })));
const MobilePlayer = lazy(() => import("@/components/editor/player/mobile-player").then(m => ({ default: m.MobilePlayer })));
const MediaGrid = lazy(() => import("@/components/editor/media/media-grid").then(m => ({ default: m.MediaGrid })));
const EffectsPanel = lazy(() => import("@/components/editor/effects/effects-panel").then(m => ({ default: m.EffectsPanel })));
const AudioMixer = lazy(() => import("@/components/editor/audio/audio-mixer").then(m => ({ default: m.AudioMixer })));
const VolumeKeyframeEditor = lazy(() => import("@/components/editor/audio/volume-keyframes").then(m => ({ default: m.VolumeKeyframeEditor })));
const TextEditor = lazy(() => import("@/components/editor/text/text-editor").then(m => ({ default: m.TextEditor })));
const ExportDialog = lazy(() => import("@/components/editor/export/export-dialog").then(m => ({ default: m.ExportDialog })));
const AIToolsPanel = lazy(() => import("@/components/editor/ai/ai-tools-panel").then(m => ({ default: m.AIToolsPanel })));
const EditorSettings = lazy(() => import("@/components/editor/settings/editor-settings").then(m => ({ default: m.EditorSettings })));
const ElementsPanel = lazy(() => import("@/components/editor/overlay/elements-panel").then(m => ({ default: m.ElementsPanel })));
const VideoEnhancerPanel = lazy(() => import("@/components/editor/video/video-enhancer-panel").then(m => ({ default: m.VideoEnhancerPanel })));
const ImageEditor = lazy(() => import("@/components/editor/image/image-editor").then(m => ({ default: m.ImageEditor })));
const KeyframeAnimationPanel = lazy(() => import("@/components/editor/ai/keyframe-animation-panel").then(m => ({ default: m.KeyframeAnimationPanel })));
const ShareDialog = lazy(() => import("@/components/editor/collaboration/share-dialog").then(m => ({ default: m.ShareDialog })));
const CommentsPanel = lazy(() => import("@/components/editor/collaboration/comments-panel").then(m => ({ default: m.CommentsPanel })));
const ActivityLog = lazy(() => import("@/components/editor/collaboration/activity-log").then(m => ({ default: m.ActivityLog })));
const PresenceAvatars = lazy(() => import("@/components/editor/collaboration/presence-avatars").then(m => ({ default: m.PresenceAvatars })));
const TemplateBrowser = lazy(() => import("@/components/editor/templates/template-browser").then(m => ({ default: m.TemplateBrowser })));
const AutoColorPanel = lazy(() => import("@/components/editor/effects/auto-color-panel").then(m => ({ default: m.AutoColorPanel })));
const VoiceLabPanel = lazy(() => import("@/components/editor/ai/voice-lab-panel").then(m => ({ default: m.VoiceLabPanel })));
const ProceduralMusicPanel = lazy(() => import("@/components/editor/audio/procedural-music-panel").then(m => ({ default: m.ProceduralMusicPanel })));
const CollaboratorPresence = lazy(() => import("@/components/editor/collaboration/collaborator-presence").then(m => ({ default: m.CollaboratorPresence })));

function PanelFallback({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 rounded-xl glass animate-pulse" />
        <p className="text-[10px] text-text-tertiary animate-pulse">Loading {label}...</p>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const { data: session } = useSession();
  const {
    isPlaying, togglePlay, undo, redo, selectedClipId, snapEnabled, toggleSnap,
    activePanel, setActivePanel, project, setProject, tracks, selectedTrackId, selectTrack,
    addTrack, removeTrack, clips, removeClip, setShowExportDialog,
  } = useEditorStore();

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<{ open: boolean; panel: string }>({ open: false, panel: "" });
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);

  const userId = (session?.user as any)?.id as string | undefined;
  const isGuest = !userId;
  const userRole = (session?.user as any)?.role as string | undefined;

  const { open: shortcutsOpen, setOpen: setShortcutsOpen } = useKeyboardShortcuts();
  const { status: saveStatus } = useAutoSave(30000);

  // Keyboard shortcut: toggle panels
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable) return;
      if (e.key === "\\" && (e.ctrlKey || e.metaKey)) {
        setShowLeftPanel((p) => !p);
        setShowRightPanel((p) => !p);
      }
      if (e.key === "F" && !e.ctrlKey && !e.metaKey) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
      if (e.key === "Escape") {
        setShowSettings(false);
        setMobileSheet({ open: false, panel: "" });
        setShowMobileTimeline(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const openMobilePanel = useCallback((panel: string) => {
    setActivePanel(panel as any);
    setMobileSheet({ open: true, panel });
  }, [setActivePanel]);

  const leftPanelContent = useMemo(() => {
    switch (activePanel) {
      case "media":
        return (
          <ErrorBoundary key="media">
            <Suspense fallback={<MediaGridSkeleton />}>
              <MediaGrid
                userId={userId}
                isGuest={isGuest}
                onEditImage={(url) => useImageEditorStore.getState().openEditor(url)}
                onAddToTimeline={(item) => {
                  const store = useEditorStore.getState();
                  if (store.tracks.length > 0) {
                    const targetTrack = store.tracks.find(
                      (t) => (item.type === "audio" ? t.type === "audio" : t.type === "video"),
                    ) || store.tracks[0];
                    store.addClip({
                      trackId: targetTrack.id,
                      type: item.type === "audio" ? "audio" : "video",
                      name: item.name, src: item.url,
                      thumbnail: item.thumbnailUrl,
                      startTime: store.playhead, duration: item.duration || 5,
                      trimStart: 0, trimEnd: 0, speed: 1, volume: 1,
                      volumeKeyframes: [], effects: [],
                      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
                    });
                  }
                }}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case "effects":
        return (
          <ErrorBoundary key="effects">
            <Suspense fallback={<EffectsPanelSkeleton />}><EffectsPanel /></Suspense>
          </ErrorBoundary>
        );
      case "audio":
        return (
          <ErrorBoundary key="audio">
            <Suspense fallback={<MixerSkeleton />}><AudioMixer /></Suspense>
          </ErrorBoundary>
        );
      case "text":
        return (
          <ErrorBoundary key="text">
            <Suspense fallback={<PanelFallback label="text editor" />}><TextEditor /></Suspense>
          </ErrorBoundary>
        );
      case "ai":
        return (
          <ErrorBoundary key="ai">
            <Suspense fallback={<PanelFallback label="AI tools" />}><AIToolsPanel /></Suspense>
          </ErrorBoundary>
        );
      case "settings":
        return (
          <ErrorBoundary key="settings">
            <Suspense fallback={<PanelFallback label="settings" />}><EditorSettings /></Suspense>
          </ErrorBoundary>
        );
      case "elements":
        return (
          <ErrorBoundary key="elements">
            <Suspense fallback={<PanelFallback label="elements" />}><ElementsPanel /></Suspense>
          </ErrorBoundary>
        );
      case "video":
        return (
          <ErrorBoundary key="video">
            <Suspense fallback={<PanelFallback label="video tools" />}><VideoEnhancerPanel /></Suspense>
          </ErrorBoundary>
        );
      case "templates":
        return (
          <ErrorBoundary key="templates">
            <Suspense fallback={<PanelFallback label="templates" />}><TemplateBrowser /></Suspense>
          </ErrorBoundary>
        );
      case "color":
        return (
          <ErrorBoundary key="color">
            <Suspense fallback={<PanelFallback label="color tools" />}><AutoColorPanel /></Suspense>
          </ErrorBoundary>
        );
      case "voice":
        return (
          <ErrorBoundary key="voice">
            <Suspense fallback={<PanelFallback label="voice lab" />}><VoiceLabPanel /></Suspense>
          </ErrorBoundary>
        );
      case "music":
        return (
          <ErrorBoundary key="music">
            <Suspense fallback={<PanelFallback label="music generator" />}><ProceduralMusicPanel /></Suspense>
          </ErrorBoundary>
        );
      case "collaborate":
        return (
          <ErrorBoundary key="collaborate">
            <Suspense fallback={<PanelFallback label="collaboration" />}>
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  <div className="px-3 pt-2 pb-1">
                    <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Comments</h3>
                  </div>
                  <CommentsPanel />
                </div>
                <div className="px-3 pb-2 border-t border-border-subtle pt-2">
                  <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Activity</h3>
                  <div className="max-h-32 overflow-y-auto">
                    <ActivityLog />
                  </div>
                </div>
              </div>
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return <ClipsList clips={clips} selectedClipId={selectedClipId} tracks={tracks} />;
    }
  }, [activePanel, clips, selectedClipId, tracks]);

  return (
    <ToastProvider>
      <div className="h-dvh flex flex-col bg-surface overflow-hidden" data-player-container>
        {/* ─── Top Toolbar ─── */}
        <header className="glass border-b border-border-subtle px-3 h-12 flex items-center justify-between shrink-0 gap-2 z-30">
          <div className="flex items-center gap-2">
            <a href="/" className="size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors" title="Back to Home">
              <ArrowLeft size={14} />
            </a>
            <span className="font-display font-bold gradient-text text-sm mr-2">ToolKit</span>
            <ProjectNameEditor name={project.name} onUpdate={(name) => setProject({ name })} />
            <SaveIndicator status={saveStatus} />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <ToolbarButton onClick={() => undo()} icon={<Undo2 size={14} />} tooltip="Undo (Ctrl+Z)" ariaLabel="Undo" />
            <ToolbarButton onClick={() => redo()} icon={<Redo2 size={14} />} tooltip="Redo (Ctrl+Shift+Z)" ariaLabel="Redo" />
            <div className="w-px h-5 bg-border-subtle mx-1" />
            <ToolbarButton onClick={togglePlay} icon={isPlaying ? <Square size={14} /> : <Play size={14} />} tooltip="Play/Stop (Space)" ariaLabel={isPlaying ? "Stop" : "Play"} />
            <ToolbarButton
              onClick={() => {
                if (selectedClipId) {
                  const clip = clips.find((c) => c.id === selectedClipId);
                  const store = useEditorStore.getState();
                  if (clip && store.playhead > clip.startTime && store.playhead < clip.startTime + clip.duration) {
                    store.splitClip(selectedClipId, store.playhead);
                  }
                }
              }}
              icon={<Scissors size={14} />}
              tooltip="Split (S)"
              active={!!selectedClipId}
              ariaLabel="Split clip"
            />
            <ToolbarButton onClick={toggleSnap} icon={<Magnet size={14} />} tooltip="Snap (N)" active={snapEnabled} ariaLabel="Toggle snap" />
          </div>

          <div className="flex items-center gap-1.5">
            <ToolbarButton
              onClick={() => setShortcutsOpen(true)}
              icon={<Keyboard size={14} />}
              tooltip="Shortcuts (?)"
              ariaLabel="Keyboard shortcuts"
            />
            <ToolbarButton
              onClick={() => { setActivePanel("settings"); setShowLeftPanel(true); }}
              icon={<Settings size={14} />}
              tooltip="Settings"
              ariaLabel="Settings"
            />
            <div className="w-px h-5 bg-border-subtle mx-1 hidden sm:block" />
            <Suspense fallback={null}>
              <PresenceAvatars />
            </Suspense>
            <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => setShowShareDialog(true)}>
              <Share2 size={14} /> Share
            </Button>
            <Button variant="neon" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => setShowExportDialog(true)}>
              <Download size={14} /> Export
            </Button>
            {/* Mobile export button */}
            <button
              onClick={() => setShowExportDialog(true)}
              className="sm:hidden size-8 rounded-xl glass flex items-center justify-center text-neon-cyan"
              aria-label="Export"
            >
              <Download size={15} />
            </button>
          </div>
        </header>

        {/* ─── Main Body ─── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel (desktop) */}
          <AnimatePresence>
            {showLeftPanel && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass border-r border-border-subtle overflow-y-auto shrink-0 hidden md:flex flex-col"
              >
                <div className="p-3 space-y-1 shrink-0">
                  <PanelTab icon={<Image size={14} />} label="Media" active={activePanel === "media"} onClick={() => setActivePanel("media")} />
                  <PanelTab icon={<Music size={14} />} label="Audio" active={activePanel === "audio"} onClick={() => setActivePanel("audio")} />
                  <PanelTab icon={<Type size={14} />} label="Text" active={activePanel === "text"} onClick={() => setActivePanel("text")} />
                  <PanelTab icon={<Wand2 size={14} />} label="Effects" active={activePanel === "effects"} onClick={() => setActivePanel("effects")} />
                  <PanelTab icon={<Sparkles size={14} />} label="AI Tools" active={activePanel === "ai"} onClick={() => setActivePanel("ai")} />
                  <PanelTab icon={<LayoutTemplate size={14} />} label="Templates" active={activePanel === "templates"} onClick={() => setActivePanel("templates")} />
                  <PanelTab icon={<Image size={14} />} label="Elements" active={activePanel === "elements"} onClick={() => setActivePanel("elements")} />
                  <PanelTab icon={<Palette size={14} />} label="Color" active={activePanel === "color"} onClick={() => setActivePanel("color")} />
                  <PanelTab icon={<Wand2 size={14} />} label="Video" active={activePanel === "video"} onClick={() => setActivePanel("video")} />
                  <PanelTab icon={<Mic size={14} />} label="Voice" active={activePanel === "voice"} onClick={() => setActivePanel("voice")} />
                  <PanelTab icon={<Radio size={14} />} label="Music" active={activePanel === "music"} onClick={() => setActivePanel("music")} />
                  <PanelTab icon={<Users size={14} />} label="Collaborate" active={activePanel === "collaborate"} onClick={() => setActivePanel("collaborate")} />
                </div>
                <div className="flex-1 min-h-0">{leftPanelContent}</div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Center: Player + Timeline */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Preview Player */}
            <div className="hidden md:block">
              <ErrorBoundary>
                <Suspense fallback={<PlayerSkeleton />}>
                  <Player />
                </Suspense>
              </ErrorBoundary>
            </div>
            <div className="md:hidden">
              <ErrorBoundary>
                <Suspense fallback={<PlayerSkeleton />}>
                  <MobilePlayer />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Playhead time indicator + panel toggle */}
            <div className="flex items-center justify-between px-3 py-1 text-[10px] text-text-tertiary shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLeftPanel((p) => !p)}
                  className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded glass text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Toggle left panel"
                >
                  <PanelLeft size={11} />
                </button>
                <span className="font-mono">{tracks.length} tracks · {project.fps} fps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono hidden sm:inline">{project.width}×{project.height}</span>
                <button
                  onClick={() => setShowRightPanel((p) => !p)}
                  className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded glass text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Toggle right panel"
                >
                  <PanelRight size={11} />
                </button>
              </div>
            </div>

            {/* Mobile: bottom sheet for panels */}
            <div className="md:hidden px-2 pb-1 flex gap-1 overflow-x-auto shrink-0">
              <MobileChip icon={<Image size={12} />} label="Media" active={activePanel === "media"} onClick={() => openMobilePanel("media")} />
              <MobileChip icon={<Music size={12} />} label="Audio" active={activePanel === "audio"} onClick={() => openMobilePanel("audio")} />
              <MobileChip icon={<Type size={12} />} label="Text" active={activePanel === "text"} onClick={() => openMobilePanel("text")} />
              <MobileChip icon={<Wand2 size={12} />} label="Effects" active={activePanel === "effects"} onClick={() => openMobilePanel("effects")} />
              <MobileChip icon={<Sparkles size={12} />} label="AI" active={activePanel === "ai"} onClick={() => openMobilePanel("ai")} />
              <MobileChip icon={<LayoutTemplate size={12} />} label="Templates" active={activePanel === "templates"} onClick={() => openMobilePanel("templates")} />
              <MobileChip icon={<Image size={12} />} label="Elements" active={activePanel === "elements"} onClick={() => openMobilePanel("elements")} />
              <MobileChip icon={<Palette size={12} />} label="Color" active={activePanel === "color"} onClick={() => openMobilePanel("color")} />
              <MobileChip icon={<Wand2 size={12} />} label="Video" active={activePanel === "video"} onClick={() => openMobilePanel("video")} />
              <MobileChip icon={<Mic size={12} />} label="Voice" active={activePanel === "voice"} onClick={() => openMobilePanel("voice")} />
              <MobileChip icon={<Radio size={12} />} label="Music" active={activePanel === "music"} onClick={() => openMobilePanel("music")} />
              <MobileChip icon={<Users size={12} />} label="Team" active={activePanel === "collaborate"} onClick={() => openMobilePanel("collaborate")} />
              <MobileChip icon={<Settings size={12} />} label="Settings" active={activePanel === "settings"} onClick={() => openMobilePanel("settings")} />
              <button
                onClick={() => setShowMobileTimeline((p) => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-text-tertiary"
              >
                {showMobileTimeline ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                Timeline
              </button>
            </div>

            {/* Timeline (desktop) */}
            <div className="hidden md:block h-[200px] lg:h-[260px] shrink-0 px-2 pb-2">
              <ErrorBoundary>
                <Suspense fallback={<TimelineSkeleton />}>
                  <Timeline />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Timeline (mobile) */}
            {showMobileTimeline && (
              <div className="md:hidden shrink-0 border-t border-border-subtle max-h-[200px] overflow-y-auto">
                <ErrorBoundary>
                  <Suspense fallback={<TimelineSkeleton />}>
                    <MobileTimeline />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
          </div>

          {/* Right Panel (desktop) */}
          <AnimatePresence>
            {showRightPanel && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass border-l border-border-subtle overflow-y-auto shrink-0 hidden lg:flex flex-col"
              >
                <div className="p-3 border-b border-border-subtle space-y-3">
                  <Suspense fallback={null}><CollaboratorPresence projectId={project.id} currentUserId={userId || ""} /></Suspense>
                  <div>
                    <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Properties</h3>
                    {selectedClipId ? (
                      <ErrorBoundary>
                        <Suspense fallback={<div className="animate-pulse h-20 rounded-lg glass" />}>
                          <ClipProperties />
                        </Suspense>
                      </ErrorBoundary>
                    ) : (
                      <p className="text-[11px] text-text-tertiary">Select a clip to edit</p>
                    )}
                  </div>
                  </div>
                  <div className="p-3 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Tracks</h3>
                    <button onClick={() => addTrack("video")} className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors" title="Add track" aria-label="Add track">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => selectTrack(track.id)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors group ${
                          selectedTrackId === track.id ? "bg-neon-cyan/10" : "hover:bg-glass-medium"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                        <span className="flex-1 truncate text-text-secondary">{track.name}</span>
                        <span className="text-[10px] text-text-tertiary uppercase">{track.type}</span>
                        <button onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }} className="p-0.5 rounded text-text-tertiary hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete ${track.name}`}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile bottom bar */}
        <div className="md:hidden glass border-t border-border-subtle px-3 py-2 flex items-center justify-around shrink-0 z-30">
          <MobileButton onClick={() => openMobilePanel("media")} icon={<Image size={18} />} label="Media" active={activePanel === "media"} />
          <MobileButton onClick={togglePlay} icon={isPlaying ? <Square size={18} /> : <Play size={18} />} label={isPlaying ? "Stop" : "Play"} active={isPlaying} />
          <MobileButton onClick={() => undo()} icon={<Undo2 size={18} />} label="Undo" />
          <MobileButton onClick={() => redo()} icon={<Redo2 size={18} />} label="Redo" />
          <MobileButton onClick={() => setShowExportDialog(true)} icon={<Download size={18} />} label="Export" />
        </div>

        {/* Modals / Sheets */}
        <Suspense fallback={null}><ExportDialog /></Suspense>
        <Suspense fallback={null}><ImageEditor /></Suspense>
        {showShareDialog && (
          <Suspense fallback={null}>
            <ShareDialog onClose={() => setShowShareDialog(false)} />
          </Suspense>
        )}
        <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <WelcomeTour />
        <ClientCron />

        {/* Mobile bottom sheet for panels */}
        <BottomSheet open={mobileSheet.open} onClose={() => setMobileSheet({ open: false, panel: "" })} title={mobileSheet.panel.charAt(0).toUpperCase() + mobileSheet.panel.slice(1)}>
          {leftPanelContent}
        </BottomSheet>
      </div>
    </ToastProvider>
  );
}

// ─── Sub-components ───

function ToolbarButton({ icon, onClick, tooltip, active, ariaLabel }: {
  icon: React.ReactNode; onClick?: () => void; tooltip?: string; active?: boolean; ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      aria-label={ariaLabel || tooltip}
      className={`p-1.5 rounded-lg transition-all active:scale-90 ${
        active ? "bg-neon-cyan/10 text-neon-cyan" : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
      }`}
    >
      {icon}
    </button>
  );
}

function PanelTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] ${
        active ? "bg-neon-cyan/10 text-neon-cyan" : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all active:scale-90 ${
        active ? "text-neon-cyan" : "text-text-tertiary"
      }`}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function MobileChip({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${
        active ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ClipsList({ clips, selectedClipId, tracks }: { clips: any[]; selectedClipId: string | null; tracks: any[] }) {
  if (clips.length === 0) {
    return (
      <div className="flex-1 px-3 pb-3 flex items-center justify-center">
        <div className="text-center">
          <div className="size-10 mx-auto mb-2 glass rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-text-tertiary" />
          </div>
          <p className="text-xs text-text-tertiary">No clips yet</p>
          <p className="text-[10px] text-text-tertiary mt-1">Upload media or drag to timeline</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 px-3 pb-3 overflow-y-auto space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Clips ({clips.length})</span>
        <span className="text-[10px] text-text-tertiary">{tracks.length} tracks</span>
      </div>
      {clips.map((clip) => (
        <button
          key={clip.id}
          onClick={() => useEditorStore.getState().selectClip(clip.id)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all active:scale-[0.98] ${
            selectedClipId === clip.id
              ? "bg-neon-cyan/10 text-neon-cyan"
              : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          <GripVertical size={10} className="text-text-tertiary shrink-0" />
          <div className="flex-1 text-left truncate">{clip.name}</div>
          <span className="text-[10px] text-text-tertiary tabular-nums">{clip.duration.toFixed(1)}s</span>
        </button>
      ))}
    </div>
  );
}

function ProjectNameEditor({ name, onUpdate }: { name: string; onUpdate: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      onUpdate(trimmed);
    } else {
      setValue(name);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") { setValue(name); setEditing(false); } }}
        className="text-xs text-text-primary px-2 py-0.5 glass rounded-md max-w-[140px] hidden sm:block border border-neon-cyan/40 outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-text-tertiary px-2 py-0.5 glass rounded-md max-w-[140px] truncate hidden sm:block hover:text-text-primary hover:border-neon-cyan/20 transition-colors group"
      title="Click to rename project"
    >
      <span className="truncate">{name}</span>
      <Pencil size={10} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary" />
    </button>
  );
}

function ClipProperties() {
  const { selectedClipId, clips, updateClip } = useEditorStore();
  const clip = clips.find((c) => c.id === selectedClipId);
  if (!clip) return null;

  return (
    <div className="space-y-2.5">
      {clip.type === "audio" && (
        <div className="mb-3">
          <Suspense fallback={<div className="animate-pulse h-16 rounded-lg glass" />}>
            <VolumeKeyframeEditor />
          </Suspense>
        </div>
      )}
      <div>
        <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Name</label>
        <input
          value={clip.name}
          onChange={(e) => updateClip(clip.id, { name: e.target.value })}
          className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 focus:outline-none focus:border-neon-cyan/30 transition-all"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Start</label>
          <input type="number" step={0.01} value={Number(clip.startTime.toFixed(2))}
            onChange={(e) => updateClip(clip.id, { startTime: Number(e.target.value) })}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-neon-cyan/30" />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Duration</label>
          <input type="number" step={0.01} value={Number(clip.duration.toFixed(2))}
            onChange={(e) => updateClip(clip.id, { duration: Number(e.target.value) })}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-neon-cyan/30" />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-text-tertiary uppercase tracking-wider">
          Volume <span className="text-text-primary">{Math.round(clip.volume * 100)}%</span>
        </label>
        <input type="range" min={0} max={100} value={clip.volume * 100}
          onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) / 100 })}
          className="w-full mt-1 accent-neon-cyan h-1.5" />
      </div>
      <div>
        <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Speed</label>
        <select value={clip.speed}
          onChange={(e) => updateClip(clip.id, { speed: Number(e.target.value) })}
          className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 focus:outline-none focus:border-neon-cyan/30">
          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Fade In</label>
          <input type="number" min={0} max={5} step={0.1} value={clip.fadeIn || 0}
            onChange={(e) => updateClip(clip.id, { fadeIn: Number(e.target.value) })}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 focus:outline-none focus:border-neon-cyan/30" />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Fade Out</label>
          <input type="number" min={0} max={5} step={0.1} value={clip.fadeOut || 0}
            onChange={(e) => updateClip(clip.id, { fadeOut: Number(e.target.value) })}
            className="w-full glass rounded-lg px-2.5 py-1.5 text-xs mt-1 focus:outline-none focus:border-neon-cyan/30" />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-text-tertiary uppercase tracking-wider">
          Opacity <span className="text-text-primary">{Math.round(clip.opacity * 100)}%</span>
        </label>
        <input type="range" min={0} max={100} value={clip.opacity * 100}
          onChange={(e) => updateClip(clip.id, { opacity: Number(e.target.value) / 100 })}
          className="w-full mt-1 accent-neon-cyan h-1.5" />
      </div>
      <div className="pt-2 border-t border-border-subtle">
        <Suspense fallback={<div className="animate-pulse h-32 rounded-lg glass" />}>
          <KeyframeAnimationPanel />
        </Suspense>
      </div>
    </div>
  );
}
