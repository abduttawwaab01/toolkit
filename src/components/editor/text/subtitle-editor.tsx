"use client";

import { useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { parseSrt, generateSrt, formatTime } from "@/lib/text/srt";
import type { Subtitle } from "@/types/editor";

interface SubtitleEditorProps {
  clipId: string;
}

export function SubtitleEditor({ clipId }: SubtitleEditorProps) {
  const { clips, updateClip, playhead, setPlayhead } = useEditorStore();
  const clip = clips.find((c) => c.id === clipId);
  const fileRef = useRef<HTMLInputElement>(null);

  const subs = clip?.subtitles || [];
  const style = clip?.textStyle;

  if (!clip) return null;

  const updateSubs = (newSubs: Subtitle[]) => {
    updateClip(clipId, { subtitles: newSubs, type: "text" });
  };

  const addSubtitle = () => {
    const newSub: Subtitle = {
      id: crypto.randomUUID(),
      index: subs.length + 1,
      start: playhead - clip.startTime,
      end: playhead - clip.startTime + 2,
      text: "",
    };
    updateSubs([...subs, newSub].sort((a, b) => a.start - b.start));
  };

  const updateSub = (id: string, updates: Partial<Subtitle>) => {
    updateSubs(subs.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSub = (id: string) => {
    updateSubs(subs.filter((s) => s.id !== id));
  };

  const handleSrtImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const parsed = parseSrt(content);
        updateSubs(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSrtExport = () => {
    if (subs.length === 0) return;
    const content = generateSrt(subs);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.srt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSubtitle = subs.find(
    (s) => playhead >= clip.startTime + s.start && playhead <= clip.startTime + s.end,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
          Subtitles ({subs.length})
        </h4>
        <div className="flex gap-1">
          <button
            onClick={addSubtitle}
            className="text-[9px] px-2 py-0.5 rounded glass text-text-secondary hover:text-text-primary"
          >
            + Add
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[9px] px-2 py-0.5 rounded glass text-text-secondary hover:text-text-primary"
          >
            Import SRT
          </button>
          <button
            onClick={handleSrtExport}
            className="text-[9px] px-2 py-0.5 rounded glass text-text-secondary hover:text-text-primary"
            disabled={subs.length === 0}
          >
            Export SRT
          </button>
          <input ref={fileRef} type="file" accept=".srt,.vtt" className="hidden" onChange={handleSrtImport} />
        </div>
      </div>

      {/* Current subtitle indicator */}
      {currentSubtitle && (
        <div className="glass rounded-lg px-2.5 py-1.5 border border-neon-cyan/20">
          <span className="text-[10px] text-neon-cyan font-medium">Now Playing</span>
          <p className="text-xs text-text-primary mt-0.5">{currentSubtitle.text}</p>
        </div>
      )}

      {/* Subtitle list */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {subs.map((sub, i) => {
          const isActive = currentSubtitle?.id === sub.id;
          return (
            <div
              key={sub.id}
              className={`glass rounded-lg p-2 transition-all ${
                isActive ? "ring-1 ring-neon-cyan border-neon-cyan/30" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] text-text-tertiary font-mono w-5">{i + 1}</span>
                <button
                  onClick={() => setPlayhead(clip.startTime + sub.start)}
                  className="text-[9px] text-neon-cyan hover:underline"
                >
                  ▶
                </button>
                <div className="flex-1 grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[7px] text-text-tertiary">Start</label>
                    <input
                      type="text"
                      value={formatTime(sub.start)}
                      onChange={(e) => {
                        const parts = e.target.value.split(":");
                        if (parts.length === 2) {
                          const secs = Number(parts[0]) * 60 + Number(parts[1]);
                          if (!isNaN(secs)) updateSub(sub.id, { start: secs });
                        }
                      }}
                      className="w-full glass rounded px-1 py-0.5 text-[9px] font-mono text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] text-text-tertiary">End</label>
                    <input
                      type="text"
                      value={formatTime(sub.end)}
                      onChange={(e) => {
                        const parts = e.target.value.split(":");
                        if (parts.length === 2) {
                          const secs = Number(parts[0]) * 60 + Number(parts[1]);
                          if (!isNaN(secs)) updateSub(sub.id, { end: secs });
                        }
                      }}
                      className="w-full glass rounded px-1 py-0.5 text-[9px] font-mono text-text-primary"
                    />
                  </div>
                </div>
                <button onClick={() => removeSub(sub.id)} className="text-text-tertiary hover:text-neon-pink text-[9px]">✕</button>
              </div>
              <textarea
                value={sub.text}
                onChange={(e) => updateSub(sub.id, { text: e.target.value })}
                placeholder="Subtitle text..."
                rows={1}
                className="w-full glass rounded px-2 py-0.5 text-[10px] text-text-primary placeholder:text-text-tertiary/50 focus:outline-none resize-none"
              />
            </div>
          );
        })}
        {subs.length === 0 && (
          <p className="text-[10px] text-text-tertiary text-center py-4">
            No subtitles. Click + Add or import an SRT file.
          </p>
        )}
      </div>
    </div>
  );
}
