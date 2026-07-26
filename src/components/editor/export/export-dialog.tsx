"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, History, Settings, Play, Square, Check } from "lucide-react";
import { useEditorStore } from "@/lib/editor-store";
import { EXPORT_PRESETS, getPresetsByCategory } from "@/lib/export/presets";
import { ExportEngine } from "@/lib/export/index";
import type { ExportSettings, ExportPresetDefinition, ExportJob, ExportProgress, ExportFormat, ExportResolution, ExportVideoCodec, ExportAudioCodec, ExportFramerate } from "@/types/export";
import { RESOLUTIONS, FORMAT_INFO, defaultExportSettings } from "@/types/export";
import { useExportCredits } from "@/hooks/use-export-credits";
import { CreditSpendDialog } from "@/components/credits/credit-spend-dialog";
import { CreditPurchaseModal } from "@/components/credits/credit-purchase-modal";

type ExportTab = "settings" | "presets" | "history";

const TAB_ICONS: Record<ExportTab, typeof Settings> = {
  settings: Settings,
  presets: Download,
  history: History,
};

const TAB_LABELS: Record<ExportTab, string> = {
  settings: "Settings",
  presets: "Presets",
  history: "History",
};

const QUALITY_LABELS = ["Best (small file)", "High", "Good", "Medium", "Low (large file)"];
const CRF_LABELS = ["Lossless", "High", "Good", "Medium", "Low"];

function QualityBar({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <span className="text-[10px] text-text-tertiary w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 glass rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: "linear-gradient(90deg, #00f5d4, #4facfe)" }} />
      </div>
      <span className="text-[10px] text-text-secondary w-10 text-right font-mono">{Math.round(value)}%</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function StageIndicator({ stage }: { stage: string }) {
  const stages = ["initializing", "loading-ffmpeg", "rendering-frames", "encoding-video", "encoding-audio", "muxing", "finalizing"];
  const idx = stages.indexOf(stage);
  const progress = idx >= 0 ? ((idx + 1) / stages.length) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      {stages.map((s, i) => (
        <div
          key={s}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i <= idx ? "bg-neon-cyan" : "bg-surface-light"
          }`}
        />
      ))}
    </div>
  );
}

export function ExportDialog() {
  const { showExportDialog, setShowExportDialog, exportHistory, addExportHistoryEntry } = useEditorStore();
  const [tab, setTab] = useState<ExportTab>("settings");
  const [settings, setSettings] = useState<ExportSettings>(defaultExportSettings());
  const [activeJob, setActiveJob] = useState<ExportJob | null>(null);
  const engineRef = useRef<ExportEngine | null>(null);
  const credits = useExportCredits();
  const projectDuration = useEditorStore((s) => s.project.duration);

  const estimatedSize = useMemo(() => {
    const { videoBitrate, audioBitrate, format, framerate, resolution } = settings;
    const dur = 30;
    const res = RESOLUTIONS[resolution];
    const pixels = res.width * res.height;
    const vidSize = (videoBitrate * 1000 / 8) * dur;
    const audSize = audioBitrate ? (audioBitrate * 1000 / 8) * dur : 0;
    const total = vidSize + audSize;
    return total;
  }, [settings]);

  const applyPreset = useCallback((preset: ExportPresetDefinition) => {
    setSettings((s) => ({ ...s, ...preset.settings }));
    setTab("settings");
  }, []);

  const startExport = useCallback(async () => {
    const durationMinutes = Math.max(1, Math.ceil(projectDuration / 60));
    const allowed = await credits.checkExportCredits(durationMinutes);
    if (!allowed) return;

    const id = crypto.randomUUID();
    const job: ExportJob = {
      id,
      name: `Export_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}`,
      settings,
      progress: {
        stage: "initializing",
        percent: 0,
        currentFrame: 0,
        totalFrames: 0,
        elapsedMs: 0,
        etaMs: 0,
        speed: "0x",
        fileSize: 0,
        outputUrl: null,
        error: null,
      },
      startedAt: Date.now(),
      completedAt: null,
    };
    setActiveJob(job);

    const videoEl = document.querySelector("video");
    const canvasEl = document.querySelector("canvas");

    const engine = new ExportEngine(settings, {
      onProgress: (progress) => {
        setActiveJob((prev) => prev ? { ...prev, progress } : null);
      },
      onComplete: (url, fileSize) => {
        setActiveJob((prev) => {
          if (!prev) return null;
          const completed = {
            ...prev,
            progress: {
              ...prev.progress,
              stage: "complete" as const,
              percent: 100,
              fileSize,
              outputUrl: url,
            },
            completedAt: Date.now(),
          };
          addExportHistoryEntry({
            id: completed.id,
            name: completed.name,
            format: completed.settings.format,
            resolution: completed.settings.resolution,
            fileSize,
            duration: 30,
            url,
            thumbnailUrl: null,
            createdAt: Date.now(),
          });
          return completed;
        });
      },
      onError: (error) => {
        setActiveJob((prev) => prev ? { ...prev, progress: { ...prev.progress, stage: "error", error } } : null);
      },
    });
    engineRef.current = engine;
    await engine.start(videoEl, canvasEl);
  }, [settings, addExportHistoryEntry, credits, projectDuration]);

  const cancelExport = useCallback(() => {
    engineRef.current?.cancel();
    setActiveJob(null);
  }, []);

  const clearJob = useCallback(() => {
    setActiveJob(null);
  }, []);

  return (
    <AnimatePresence>
      {showExportDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExportDialog(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="glass-xl border border-border-subtle rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl glass flex items-center justify-center">
                  <Download size={16} className="text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Export</h2>
                  <p className="text-[10px] text-text-tertiary">Render and download your project</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportDialog(false)}
                className="size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 pb-1 shrink-0">
              {(["settings", "presets", "history"] as ExportTab[]).map((t) => {
                const Icon = TAB_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      tab === t
                        ? "bg-neon-cyan/15 text-neon-cyan"
                        : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
                    }`}
                  >
                    <Icon size={13} />
                    {TAB_LABELS[t]}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {tab === "settings" && (
                <ExportSettingsPanel settings={settings} onChange={setSettings} estimatedSize={estimatedSize} />
              )}
              {tab === "presets" && (
                <ExportPresetsPanel onApply={applyPreset} />
              )}
              {tab === "history" && (
                <ExportHistoryPanel history={exportHistory} />
              )}
            </div>

            {/* Active job */}
            {activeJob && (
              <div className="px-5 py-3 border-t border-border-subtle bg-glass-medium">
                <ExportProgressCard job={activeJob} onCancel={cancelExport} onClear={clearJob} />
              </div>
            )}

            {/* Footer */}
            {!activeJob && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle shrink-0">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full glass flex items-center justify-center">
                    <span className="text-[9px] text-text-tertiary font-mono">
                      {FORMAT_INFO[settings.format].extension.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-tertiary">
                    ~{formatBytes(estimatedSize)} estimated · {RESOLUTIONS[settings.resolution].label}
                  </span>
                </div>
                <button
                  onClick={startExport}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[11px] font-semibold hover:bg-neon-cyan/30 active:bg-neon-cyan/40 transition-all"
                >
                  <Play size={12} />
                  Start Export
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {credits.showSpendDialog && (
        <CreditSpendDialog
          feature="export"
          featureLabel="Video Export"
          creditsCost={credits.pendingCost}
          onSpend={credits.confirmSpend}
          onCancel={credits.cancelSpend}
          loading={credits.spending}
        />
      )}

      <CreditPurchaseModal
        open={credits.showPurchaseModal}
        onClose={() => credits.setShowPurchaseModal(false)}
      />
    </AnimatePresence>
  );
}

// ── Settings Panel ──

function ExportSettingsPanel({
  settings,
  onChange,
  estimatedSize,
}: {
  settings: ExportSettings;
  onChange: (s: ExportSettings) => void;
  estimatedSize: number;
}) {
  const update = useCallback(<K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    const next = { ...settings, [key]: value };
    // Auto-update width/height on resolution change
    if (key === "resolution") {
      const res = RESOLUTIONS[value as ExportResolution];
      next.width = res.width;
      next.height = res.height;
    }
    // Reset codecs if format changes
    if (key === "format") {
      const fmt = FORMAT_INFO[value as ExportFormat];
      if (!fmt.supportsVideo) {
        next.includeVideo = false;
      }
    }
    onChange(next);
  }, [settings, onChange]);

  const res = RESOLUTIONS[settings.resolution];

  return (
    <div className="space-y-4">
      {/* Format & Quality */}
      <Section label="Format">
        <div className="grid grid-cols-3 gap-1.5">
          {(["mp4", "webm", "mov", "gif"] as ExportFormat[]).map((fmt) => {
            const info = FORMAT_INFO[fmt];
            const isActive = settings.format === fmt;
            return (
              <button
                key={fmt}
                onClick={() => update("format", fmt)}
                className={`px-2.5 py-2 rounded-xl text-center transition-all ${
                  isActive ? "bg-neon-cyan/15 border border-neon-cyan/30" : "glass border border-border-subtle hover:bg-glass-medium"
                }`}
              >
                <div className="text-[11px] font-semibold text-text-primary">{info.label}</div>
                <div className="text-[9px] text-text-tertiary mt-0.5">{info.extension}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Resolution & FPS */}
      <Section label="Resolution">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Resolution</Label>
            <select
              value={settings.resolution}
              onChange={(e) => update("resolution", e.target.value as ExportResolution)}
              className="w-full glass rounded-xl px-3 py-2 text-[11px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
            >
              {Object.entries(RESOLUTIONS).map(([key, r]) => (
                <option key={key} value={key}>{r.label} ({r.width}x{r.height})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Frame Rate</Label>
            <select
              value={settings.framerate}
              onChange={(e) => update("framerate", Number(e.target.value) as ExportFramerate)}
              className="w-full glass rounded-xl px-3 py-2 text-[11px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
            >
              {[24, 25, 30, 48, 50, 60, 120].map((fps) => (
                <option key={fps} value={fps}>{fps} fps</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-[9px] text-text-tertiary mt-1">
          {res.width} × {res.height} · {settings.framerate} fps
        </div>
      </Section>

      {/* Video Codec */}
      {FORMAT_INFO[settings.format].supportsVideo && (
        <Section label="Video Codec">
          <div className="grid grid-cols-5 gap-1.5">
            {(["h264", "h265", "vp9", "vp8", "av1"] as ExportVideoCodec[]).map((codec) => {
              const isActive = settings.videoCodec === codec;
              const supported = FORMAT_INFO[settings.format].supportsVideo;
              return (
                <button
                  key={codec}
                  disabled={!supported}
                  onClick={() => update("videoCodec", codec)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium text-center transition-all ${
                    isActive ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {codec.toUpperCase()}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Audio Codec & Rate */}
      <Section label="Audio">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Codec</Label>
            <select
              value={settings.audioCodec}
              onChange={(e) => update("audioCodec", e.target.value as ExportAudioCodec)}
              className="w-full glass rounded-xl px-3 py-2 text-[11px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
            >
              {(["aac", "mp3", "vorbis", "opus", "flac", "pcm_s16le"] as ExportAudioCodec[]).map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Bitrate</Label>
            <select
              value={settings.audioBitrate}
              onChange={(e) => update("audioBitrate", Number(e.target.value))}
              className="w-full glass rounded-xl px-3 py-2 text-[11px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
            >
              {[64, 96, 128, 192, 256, 320].map((b) => (
                <option key={b} value={b}>{b} kbps</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Label>Sample Rate</Label>
          <select
            value={settings.sampleRate}
            onChange={(e) => update("sampleRate", Number(e.target.value))}
            className="glass rounded-xl px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
          >
            {[8000, 11025, 16000, 22050, 44100, 48000, 96000].map((r) => (
              <option key={r} value={r}>{r < 1000 ? `${r}` : `${r / 1000}kHz`}</option>
            ))}
          </select>
          <select
            value={settings.channels}
            onChange={(e) => update("channels", Number(e.target.value) as 1 | 2 | 6)}
            className="glass rounded-xl px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/40"
          >
            <option value={1}>Mono</option>
            <option value={2}>Stereo</option>
            <option value={6}>5.1 Surround</option>
          </select>
        </div>
      </Section>

      {/* Quality */}
      <Section label="Quality">
        <QualityBar label="Video Bitrate" value={(settings.videoBitrate / 80000) * 100} />
        <QualityBar label="Audio Bitrate" value={(settings.audioBitrate / 320) * 100} />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label>Video Bitrate</Label>
            <input
              type="range"
              min={500}
              max={80000}
              step={500}
              value={settings.videoBitrate}
              onChange={(e) => update("videoBitrate", Number(e.target.value))}
              className="w-full accent-neon-cyan"
            />
            <div className="flex justify-between text-[9px] text-text-tertiary">
              <span>{settings.videoBitrate} kbps</span>
            </div>
          </div>
          <div>
            <Label>Audio Bitrate</Label>
            <input
              type="range"
              min={32}
              max={512}
              step={16}
              value={settings.audioBitrate}
              onChange={(e) => update("audioBitrate", Number(e.target.value))}
              className="w-full accent-neon-cyan"
            />
            <div className="flex justify-between text-[9px] text-text-tertiary">
              <span>{settings.audioBitrate} kbps</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Scope */}
      <Section label="Export Scope">
        <div className="flex gap-1.5">
          {(["entire", "selected", "range"] as ExportSettings["scope"][]).map((scope) => (
            <button
              key={scope}
              onClick={() => update("scope", scope)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                settings.scope === scope ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
              }`}
            >
              {scope === "entire" ? "Entire Project" : scope === "selected" ? "Selected Clips" : "Custom Range"}
            </button>
          ))}
        </div>
      </Section>

      {/* Advanced */}
      <Section label="Advanced">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.fastStart}
              onChange={(e) => update("fastStart", e.target.checked)}
              className="rounded border-border-subtle text-neon-cyan focus:ring-neon-cyan/30"
            />
            <span className="text-[10px] text-text-secondary">Fast Start (streamable)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeVideo}
              onChange={(e) => update("includeVideo", e.target.checked)}
              className="rounded border-border-subtle text-neon-cyan focus:ring-neon-cyan/30"
            />
            <span className="text-[10px] text-text-secondary">Include Video</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeAudio}
              onChange={(e) => update("includeAudio", e.target.checked)}
              className="rounded border-border-subtle text-neon-cyan focus:ring-neon-cyan/30"
            />
            <span className="text-[10px] text-text-secondary">Include Audio</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeSubtitles}
              onChange={(e) => update("includeSubtitles", e.target.checked)}
              className="rounded border-border-subtle text-neon-cyan focus:ring-neon-cyan/30"
            />
            <span className="text-[10px] text-text-secondary">Burn-in Subtitles</span>
          </label>
        </div>
      </Section>

      {/* Estimated */}
      <div className="glass rounded-xl p-3 flex items-center justify-between">
        <span className="text-[10px] text-text-tertiary">Estimated File Size</span>
        <span className="text-sm font-mono font-bold gradient-text">{formatBytes(estimatedSize)}</span>
      </div>
    </div>
  );
}

// ── Presets Panel ──

function ExportPresetsPanel({ onApply }: { onApply: (preset: ExportPresetDefinition) => void }) {
  const [cat, setCat] = useState<"video" | "audio" | "gif">("video");

  const presets = getPresetsByCategory(cat);
  const popular = EXPORT_PRESETS.filter((p) => p.popular);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        {(["video", "audio", "gif"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              cat === c ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
            }`}
          >
            {c === "video" ? "Video" : c === "audio" ? "Audio" : "GIF"}
          </button>
        ))}
      </div>

      {/* Popular presets */}
      <div className="mb-3">
        <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">Popular</div>
        <div className="grid grid-cols-2 gap-1.5">
          {popular.filter((p) => p.category === cat).map((preset) => (
            <PresetCard key={preset.id} preset={preset} onApply={onApply} />
          ))}
        </div>
      </div>

      {/* All presets */}
      <div>
        <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
          All {cat === "video" ? "Video" : cat === "audio" ? "Audio" : "GIF"} Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.filter((p) => !p.popular).map((preset) => (
            <PresetCard key={preset.id} preset={preset} onApply={onApply} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PresetCard({ preset, onApply }: { preset: ExportPresetDefinition; onApply: (p: ExportPresetDefinition) => void }) {
  return (
    <button
      onClick={() => onApply(preset)}
      className="glass border border-border-subtle rounded-xl p-2.5 text-left hover:bg-glass-medium transition-all group"
    >
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0">{preset.icon}</span>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-text-primary group-hover:text-neon-cyan transition-colors truncate">
            {preset.name}
          </div>
          <div className="text-[9px] text-text-tertiary mt-0.5 line-clamp-1">{preset.description}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] px-1 py-0.5 rounded glass text-text-tertiary">{preset.platform}</span>
            {preset.category !== "audio" && preset.settings.resolution && (
              <span className="text-[8px] px-1 py-0.5 rounded glass text-text-tertiary">
                {RESOLUTIONS[preset.settings.resolution as ExportResolution]?.label || preset.settings.resolution}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── History Panel ──

function ExportHistoryPanel({ history }: { history: any[] }) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <div className="size-12 rounded-2xl glass flex items-center justify-center">
          <History size={20} className="text-text-tertiary" />
        </div>
        <p className="text-xs text-text-tertiary">No exports yet</p>
        <p className="text-[10px] text-text-tertiary">Your exported files will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {history.map((entry) => (
        <div key={entry.id} className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="size-10 rounded-xl glass flex items-center justify-center shrink-0">
            <Download size={16} className="text-neon-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-text-primary truncate">{entry.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-text-tertiary">{FORMAT_INFO[entry.format as ExportFormat]?.label || entry.format}</span>
              <span className="text-[9px] text-text-tertiary">·</span>
              <span className="text-[9px] text-text-tertiary">{RESOLUTIONS[entry.resolution as ExportResolution]?.label || entry.resolution}</span>
              <span className="text-[9px] text-text-tertiary">·</span>
              <span className="text-[9px] text-text-tertiary">{formatBytes(entry.fileSize)}</span>
            </div>
          </div>
          <div className="text-[9px] text-text-tertiary">
            {new Date(entry.createdAt).toLocaleDateString()}
          </div>
          {entry.url && (
            <a
              href={entry.url}
              download={entry.name}
              className="size-8 rounded-lg glass flex items-center justify-center text-neon-cyan hover:bg-neon-cyan/15 transition-colors"
            >
              <Download size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Progress Card ──

function ExportProgressCard({ job, onCancel, onClear }: { job: ExportJob; onCancel: () => void; onClear: () => void }) {
  const { progress } = job;
  const isComplete = progress.stage === "complete";
  const isError = progress.stage === "error";
  const isCancelled = progress.stage === "cancelled";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-text-primary">
            {isComplete ? "Export Complete" : isError ? "Export Failed" : isCancelled ? "Export Cancelled" : "Exporting..."}
          </span>
          <span className="text-[9px] text-text-tertiary font-mono">{Math.round(progress.percent)}%</span>
        </div>
        <div className="h-1.5 glass rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isError ? "bg-red-500" : isComplete ? "bg-neon-cyan" : "bg-gradient-to-r from-neon-cyan to-blue-500"
            }`}
            style={{ width: `${isComplete ? 100 : progress.percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary">
            {progress.stage} · {progress.speed}
          </span>
          <span className="text-[9px] text-text-tertiary">
            {formatDuration(progress.elapsedMs)}
            {progress.etaMs > 0 && progress.etaMs < 1e7 && ` / ${formatDuration(progress.etaMs)}`}
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        {isComplete ? (
          <>
            {progress.outputUrl && (
              <a
                href={progress.outputUrl}
                download="export"
                className="px-3 py-1.5 rounded-lg bg-neon-cyan/20 text-neon-cyan text-[10px] font-medium hover:bg-neon-cyan/30 transition-all flex items-center gap-1"
              >
                <Download size={11} /> Download
              </a>
            )}
            <button onClick={onClear} className="px-2.5 py-1.5 rounded-lg glass text-text-tertiary text-[10px] hover:text-text-primary transition-all">
              Dismiss
            </button>
          </>
        ) : isError || isCancelled ? (
          <button onClick={onClear} className="px-2.5 py-1.5 rounded-lg glass text-text-tertiary text-[10px] hover:text-text-primary transition-all">
            Dismiss
          </button>
        ) : (
          <button onClick={onCancel} className="px-2.5 py-1.5 rounded-lg glass text-red-400 text-[10px] hover:bg-red-500/10 transition-all flex items-center gap-1">
            <Square size={10} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] text-text-tertiary mb-1">{children}</div>;
}
