"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { Save, Monitor, Zap, Eye, RefreshCw } from "lucide-react";

interface EditorPreferences {
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showWaveform: boolean;
  showThumbnails: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  reduceMotion: boolean;
  highContrast: boolean;
  snapToEdges: boolean;
  snapToPlayhead: boolean;
  scrollWheelZoom: boolean;
  timelineHeight: "compact" | "normal" | "comfortable";
  theme: "dark" | "system";
}

const DEFAULT_PREFS: EditorPreferences = {
  showLeftPanel: true,
  showRightPanel: true,
  showWaveform: true,
  showThumbnails: true,
  autoSave: true,
  autoSaveInterval: 30,
  reduceMotion: false,
  highContrast: false,
  snapToEdges: true,
  snapToPlayhead: true,
  scrollWheelZoom: true,
  timelineHeight: "normal",
  theme: "dark",
};

const PREF_STORAGE_KEY = "toolkit_preferences";

function loadPreferences(): EditorPreferences {
  try {
    const stored = localStorage.getItem(PREF_STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

function savePreferences(prefs: EditorPreferences) {
  localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs));
}

const TIMELINE_HEIGHTS = [
  { value: "compact" as const, label: "Compact", description: "Smaller tracks (32px)" },
  { value: "normal" as const, label: "Normal", description: "Default track size (48px)" },
  { value: "comfortable" as const, label: "Comfortable", description: "Larger tracks (64px)" },
];

export function EditorSettings() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<EditorPreferences>(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const update = (key: keyof EditorPreferences, value: any) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePreferences(next);
    setSaved(true);

    if (key === "reduceMotion") {
      document.documentElement.classList.toggle("reduce-motion", value);
    }
    if (key === "highContrast") {
      document.documentElement.classList.toggle("high-contrast", value);
    }
    if (key === "snapToEdges" || key === "snapToPlayhead") {
      useEditorStore.getState().toggleSnap();
    }
  };

  const resetDefaults = () => {
    setPrefs(DEFAULT_PREFS);
    savePreferences(DEFAULT_PREFS);
    toast.success("Settings reset", "All preferences restored to defaults");
    setSaved(true);
  };

  const Section = ({ label, icon: Icon, children }: { label: string; icon: typeof Save; children: React.ReactNode }) => (
    <div className="glass rounded-xl p-3 space-y-2.5">
      <h3 className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </h3>
      {children}
    </div>
  );

  const Toggle = ({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <span className="text-[11px] text-text-primary group-hover:text-neon-cyan transition-colors">{label}</span>
        {description && <p className="text-[9px] text-text-tertiary">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-all shrink-0 ${
          value ? "bg-neon-cyan/30" : "bg-surface-light/50"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            value ? "left-[18px] bg-neon-cyan" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className="space-y-3">
      <Section label="Display" icon={Monitor}>
        <Toggle label="Show waveform" value={prefs.showWaveform} onChange={(v) => update("showWaveform", v)} />
        <Toggle label="Show clip thumbnails" value={prefs.showThumbnails} onChange={(v) => update("showThumbnails", v)} />
        <Toggle
          label="Reduce motion"
          description="Disable animations for accessibility"
          value={prefs.reduceMotion}
          onChange={(v) => update("reduceMotion", v)}
        />
        <Toggle
          label="High contrast"
          description="Increase visual contrast"
          value={prefs.highContrast}
          onChange={(v) => update("highContrast", v)}
        />
      </Section>

      <Section label="Editing" icon={Zap}>
        <Toggle label="Snap to clip edges" value={prefs.snapToEdges} onChange={(v) => update("snapToEdges", v)} />
        <Toggle label="Snap to playhead" value={prefs.snapToPlayhead} onChange={(v) => update("snapToPlayhead", v)} />
        <Toggle label="Scroll wheel zoom" value={prefs.scrollWheelZoom} onChange={(v) => update("scrollWheelZoom", v)} />
        <div>
          <span className="text-[11px] text-text-primary">Timeline height</span>
          <div className="flex gap-1 mt-1">
            {TIMELINE_HEIGHTS.map((h) => (
              <button
                key={h.value}
                onClick={() => update("timelineHeight", h.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                  prefs.timelineHeight === h.value
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "glass border border-border-subtle text-text-tertiary hover:text-text-primary"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section label="Project" icon={Save}>
        <Toggle label="Auto-save" value={prefs.autoSave} onChange={(v) => update("autoSave", v)} />
        {prefs.autoSave && (
          <div>
            <span className="text-[11px] text-text-primary">Auto-save interval</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min={10}
                max={120}
                step={10}
                value={prefs.autoSaveInterval}
                onChange={(e) => update("autoSaveInterval", Number(e.target.value))}
                className="flex-1 accent-neon-cyan h-1"
              />
              <span className="text-[10px] text-text-secondary font-mono min-w-[40px]">{prefs.autoSaveInterval}s</span>
            </div>
          </div>
        )}
      </Section>

      <div className="flex gap-2">
        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-text-secondary text-[10px] font-medium hover:bg-glass-medium transition-all"
        >
          <RefreshCw size={12} /> Reset to defaults
        </button>
        {saved && (
          <span className="text-[10px] text-neon-cyan flex items-center gap-1">
            <Save size={10} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

export function getPreference<K extends keyof EditorPreferences>(key: K): EditorPreferences[K] {
  return loadPreferences()[key];
}
