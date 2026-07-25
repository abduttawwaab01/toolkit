"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { FONTS, ANIMATIONS, defaultTextStyle, defaultTextAnimation, getTextStyleCss } from "@/lib/text/index";
import { TEXT_PRESETS } from "@/lib/text/presets";
import { SubtitleEditor } from "./subtitle-editor";
import { AutoCaptions } from "./auto-captions";
import type { TextStyle, TextAnimationType } from "@/types/editor";

type EditorTab = "editor" | "presets" | "subtitles";

const TEXT_COLORS = [
  "#ffffff", "#000000", "#ff4d4d", "#ff6b6b", "#ff9ff3", "#f368e0",
  "#4facfe", "#00d2d3", "#00f5d4", "#1dd1a1", "#feca57", "#ff9f43",
  "#ff6348", "#a29bfe", "#6c5ce7", "#fd79a8", "#e17055", "#00cec9",
  "#0984e3", "#636e72", "#b2bec3", "#dfe6e9",
];

const STROKE_COLORS = [
  "", "#000000", "#ffffff", "#333333", "#4facfe", "#ff4d4d", "#00f5d4",
];

export function TextEditor() {
  const { selectedClipId, clips, updateClip } = useEditorStore();
  const [tab, setTab] = useState<EditorTab>("editor");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearch, setFontSearch] = useState("");

  const clip = clips.find((c) => c.id === selectedClipId);
  const style = clip?.textStyle ?? defaultTextStyle();
  const anim = clip?.textAnimation ?? defaultTextAnimation();
  const isTextClip = clip?.type === "text";

  if (!clip) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-text-tertiary">Select a text clip to edit</p>
        <p className="text-[10px] text-text-tertiary mt-1">or add a text track to create one</p>
      </div>
    );
  }

  const updateStyle = (updates: Partial<TextStyle>) => {
    updateClip(clip.id, { textStyle: { ...style, ...updates }, type: "text" });
  };

  const updateAnim = (updates: { type?: TextAnimationType; duration?: number; delay?: number; stagger?: number }) => {
    updateClip(clip.id, { textAnimation: { ...anim, ...updates } });
  };

  const applyPreset = (presetId: string) => {
    const preset = TEXT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateClip(clip.id, {
      textStyle: preset.style,
      textAnimation: preset.animation,
      textContent: clip.textContent || preset.preview,
      type: "text",
    });
  };

  const filteredFonts = fontSearch
    ? FONTS.filter((f) => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
    : FONTS;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
        <button
          onClick={() => setTab("editor")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "editor" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setTab("presets")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "presets" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setTab("subtitles")}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            tab === "subtitles" ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
          }`}
        >
          Subtitles
        </button>
      </div>

      {/* ── Text Editor Tab ── */}
      {tab === "editor" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {/* Live preview */}
          <div className="glass rounded-xl p-4 min-h-[60px] flex items-center justify-center overflow-hidden" style={getTextStyleCss(style)}>
            <span>{clip.textContent || "Your Text Here"}</span>
          </div>

          {/* Text content */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Content</label>
            <textarea
              value={clip.textContent || ""}
              onChange={(e) => updateClip(clip.id, { textContent: e.target.value })}
              placeholder="Enter your text..."
              rows={3}
              className="w-full glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-neon-cyan/30 resize-none"
            />
          </div>

          {/* Font */}
          <div className="relative">
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Font Family</label>
            <button
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="w-full glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary text-left flex items-center justify-between"
            >
              <span style={{ fontFamily: style.fontFamily }}>
                {FONTS.find((f) => f.family === style.fontFamily)?.name || "Custom"}
              </span>
              <span className="text-text-tertiary">{showFontPicker ? "▲" : "▼"}</span>
            </button>
            {showFontPicker && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 glass rounded-xl border border-border-subtle max-h-40 overflow-y-auto shadow-2xl">
                <input
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full glass rounded-t-xl px-2.5 py-1.5 text-[11px] text-text-primary border-b border-border-subtle focus:outline-none sticky top-0"
                  autoFocus
                />
                {filteredFonts.map((f) => (
                  <button
                    key={f.family}
                    onClick={() => { updateStyle({ fontFamily: f.family }); setShowFontPicker(false); setFontSearch(""); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors ${
                      style.fontFamily === f.family ? "bg-neon-cyan/10 text-neon-cyan" : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
                    }`}
                    style={{ fontFamily: f.family }}
                  >
                    {f.name}
                    <span className="text-[9px] text-text-tertiary ml-2">({f.category})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font size + alignment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Size</label>
              <input
                type="number"
                min={8}
                max={300}
                value={style.fontSize}
                onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-neon-cyan/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Alignment</label>
              <div className="flex gap-1">
                {(["left", "center", "right", "justify"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => updateStyle({ alignment: a })}
                    className={`flex-1 px-1.5 py-1 rounded-lg text-[9px] uppercase transition-colors ${
                      style.alignment === a ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
                    }`}
                  >
                    {a === "left" ? "◀" : a === "center" ? "⟷" : a === "right" ? "▶" : "⟺"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bold / Italic / Underline / Uppercase */}
          <div className="flex gap-1">
            {[
              { key: "bold" as const, label: "B", active: style.bold },
              { key: "italic" as const, label: "I", active: style.italic },
              { key: "underline" as const, label: "U", active: style.underline },
              { key: "uppercase" as const, label: "AA", active: style.uppercase },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => updateStyle({ [btn.key]: !btn.active })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  btn.active ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary hover:bg-glass-medium"
                }`}
                style={{ fontStyle: btn.key === "italic" && btn.active ? "italic" : "normal",
                        textDecoration: btn.key === "underline" && btn.active ? "underline" : "none" }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Line height + letter spacing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
                Line Height <span className="text-text-primary">{style.lineHeight}</span>
              </label>
              <input
                type="range" min={0.5} max={3} step={0.1} value={style.lineHeight}
                onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) })}
                className="w-full h-1 accent-neon-cyan"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
                Letter Spacing <span className="text-text-primary">{style.letterSpacing}px</span>
              </label>
              <input
                type="range" min={-5} max={20} step={0.5} value={style.letterSpacing}
                onChange={(e) => updateStyle({ letterSpacing: Number(e.target.value) })}
                className="w-full h-1 accent-neon-cyan"
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Text Color</label>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateStyle({ color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    style.color === c ? "border-neon-cyan scale-110" : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-6 h-6 rounded-full cursor-pointer border-0 p-0"
              />
            </div>
          </div>

          {/* Background */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.background || "#000000"}
                onChange={(e) => updateStyle({ background: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-border-subtle"
              />
              <input
                type="range" min={0} max={100} value={Math.round(style.backgroundOpacity * 100)}
                onChange={(e) => updateStyle({ backgroundOpacity: Number(e.target.value) / 100 })}
                className="flex-1 h-1 accent-neon-cyan"
              />
              <span className="text-[10px] text-text-tertiary w-8 text-right">{Math.round(style.backgroundOpacity * 100)}%</span>
              <button
                onClick={() => updateStyle({ background: style.background ? "" : "#000000" })}
                className={`text-[9px] px-1.5 py-0.5 rounded ${style.background ? "bg-neon-cyan/10 text-neon-cyan" : "text-text-tertiary"}`}
              >
                {style.background ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Stroke/Outline */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
              Stroke <span className="text-text-primary">{style.strokeWidth}px</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={10} step={0.5} value={style.strokeWidth}
                onChange={(e) => updateStyle({ strokeWidth: Number(e.target.value) })}
                className="flex-1 h-1 accent-neon-cyan"
              />
              <div className="flex gap-1">
                {STROKE_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => updateStyle({ strokeColor: c || "#000000" })}
                    className={`w-4 h-4 rounded-full border ${c ? "" : "border-dashed border-text-tertiary"} ${style.strokeColor === (c || "#000000") ? "ring-1 ring-neon-cyan" : ""}`}
                    style={{ backgroundColor: c || "transparent" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Shadow */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Shadow</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] text-text-tertiary">Blur</label>
                <input type="range" min={0} max={30} step={1} value={style.shadowBlur}
                  onChange={(e) => updateStyle({ shadowBlur: Number(e.target.value) })}
                  className="w-full h-1 accent-neon-cyan" />
              </div>
              <div>
                <label className="text-[8px] text-text-tertiary">X</label>
                <input type="range" min={-20} max={20} step={1} value={style.shadowOffsetX}
                  onChange={(e) => updateStyle({ shadowOffsetX: Number(e.target.value) })}
                  className="w-full h-1 accent-neon-cyan" />
              </div>
              <div>
                <label className="text-[8px] text-text-tertiary">Y</label>
                <input type="range" min={-20} max={20} step={1} value={style.shadowOffsetY}
                  onChange={(e) => updateStyle({ shadowOffsetY: Number(e.target.value) })}
                  className="w-full h-1 accent-neon-cyan" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={style.shadowColor || "#000000"}
                onChange={(e) => updateStyle({ shadowColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-border-subtle" />
              <button
                onClick={() => updateStyle({ shadowColor: style.shadowColor ? "" : "#000000" })}
                className={`text-[9px] px-1.5 py-0.5 rounded ${style.shadowColor ? "bg-neon-cyan/10 text-neon-cyan" : "text-text-tertiary"}`}
              >
                {style.shadowColor ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Border radius + padding */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Radius</label>
              <input type="number" min={0} max={50} value={style.borderRadius}
                onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs font-mono text-text-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Pad X</label>
              <input type="number" min={0} max={80} value={style.paddingX}
                onChange={(e) => updateStyle({ paddingX: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs font-mono text-text-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Pad Y</label>
              <input type="number" min={0} max={40} value={style.paddingY}
                onChange={(e) => updateStyle({ paddingY: Number(e.target.value) })}
                className="w-full glass rounded-lg px-2 py-1 text-xs font-mono text-text-primary focus:outline-none" />
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-2">Animation</label>
            <div className="grid grid-cols-4 gap-1">
              {ANIMATIONS.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => updateAnim({ type: a.id as TextAnimationType })}
                  className={`glass rounded-lg px-1 py-1 text-[9px] text-center transition-colors ${
                    anim.type === a.id ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-border-subtle text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {ANIMATIONS.slice(8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => updateAnim({ type: a.id as TextAnimationType })}
                  className={`glass rounded-lg px-1 py-1 text-[9px] text-center transition-colors ${
                    anim.type === a.id ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan" : "border-border-subtle text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <label className="text-[8px] text-text-tertiary">Duration</label>
                <input type="number" min={0.1} max={5} step={0.1} value={anim.duration}
                  onChange={(e) => updateAnim({ duration: Number(e.target.value) })}
                  className="w-full glass rounded px-2 py-0.5 text-[10px] font-mono text-text-primary" />
              </div>
              <div>
                <label className="text-[8px] text-text-tertiary">Delay</label>
                <input type="number" min={0} max={5} step={0.1} value={anim.delay}
                  onChange={(e) => updateAnim({ delay: Number(e.target.value) })}
                  className="w-full glass rounded px-2 py-0.5 text-[10px] font-mono text-text-primary" />
              </div>
              <div>
                <label className="text-[8px] text-text-tertiary">Stagger</label>
                <input type="number" min={0} max={1} step={0.01} value={anim.stagger}
                  onChange={(e) => updateAnim({ stagger: Number(e.target.value) })}
                  className="w-full glass rounded px-2 py-0.5 text-[10px] font-mono text-text-primary" />
              </div>
            </div>
          </div>

          {/* Position + Scale */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Position X</label>
              <input type="range" min={-500} max={500} step={1}
                value={clip.positionX}
                onChange={(e) => updateClip(clip.id, { positionX: Number(e.target.value) })}
                className="w-full h-1 accent-neon-cyan" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Position Y</label>
              <input type="range" min={-500} max={500} step={1}
                value={clip.positionY}
                onChange={(e) => updateClip(clip.id, { positionY: Number(e.target.value) })}
                className="w-full h-1 accent-neon-cyan" />
            </div>
          </div>

          {/* Opacity + Scale */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
                Opacity <span className="text-text-primary">{Math.round(clip.opacity * 100)}%</span>
              </label>
              <input type="range" min={0} max={100} value={clip.opacity * 100}
                onChange={(e) => updateClip(clip.id, { opacity: Number(e.target.value) / 100 })}
                className="w-full h-1 accent-neon-cyan" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
                Scale <span className="text-text-primary">{clip.scale.toFixed(2)}x</span>
              </label>
              <input type="range" min={0.1} max={3} step={0.05} value={clip.scale}
                onChange={(e) => updateClip(clip.id, { scale: Number(e.target.value) })}
                className="w-full h-1 accent-neon-cyan" />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">
              Rotation <span className="text-text-primary">{clip.rotation}°</span>
            </label>
            <input type="range" min={-180} max={180} step={1} value={clip.rotation}
              onChange={(e) => updateClip(clip.id, { rotation: Number(e.target.value) })}
              className="w-full h-1 accent-neon-cyan" />
          </div>
        </div>
      )}

      {/* ── Presets Tab ── */}
      {tab === "presets" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-3">
            {["title", "lower-third", "subtitle", "callout", "credit", "lyric"].map((cat) => {
              const presets = TEXT_PRESETS.filter((p) => p.category === cat);
              if (presets.length === 0) return null;
              return (
                <div key={cat}>
                  <h4 className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}s
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className="glass rounded-xl p-2.5 text-left hover:bg-glass-medium transition-all border border-border-subtle hover:border-neon-cyan/20"
                      >
                        <div className="text-[10px] font-medium text-text-primary truncate">{p.name}</div>
                        <div className="text-[8px] text-text-tertiary mt-0.5 leading-tight line-clamp-2">{p.description}</div>
                        <div className="mt-1 text-[9px] text-neon-cyan/60 font-medium" style={{ fontFamily: p.style.fontFamily }}>
                          {p.preview.length > 20 ? p.preview.slice(0, 20) + "…" : p.preview}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subtitles Tab ── */}
      {tab === "subtitles" && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          <AutoCaptions clipId={clip.id} />
          <SubtitleEditor clipId={clip.id} />
        </div>
      )}
    </div>
  );
}
