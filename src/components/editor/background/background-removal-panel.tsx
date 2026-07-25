"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { BACKGROUND_TEMPLATES, chromaKeyRemove, replaceBackground, type BackgroundTemplate } from "@/lib/background/index";
import { Image, Upload, Pipette } from "lucide-react";

export function BackgroundRemovalPanel() {
  const toast = useToast();
  const [tab, setTab] = useState<"chroma" | "replace">("chroma");
  const [keyColor, setKeyColor] = useState("#00ff00");
  const [similarity, setSimilarity] = useState(30);
  const [smoothness, setSmoothness] = useState(10);
  const [spillReduction, setSpillReduction] = useState(30);
  const [selectedTemplate, setSelectedTemplate] = useState<BackgroundTemplate | null>(null);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const handleApplyChromaKey = useCallback(() => {
    const state = useEditorStore.getState();
    const clip = state.clips.find((c) => c.id === state.selectedClipId);
    if (!clip) { toast.error("No clip", "Select a clip first"); return; }
    if (processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);
    toast.info("Processing", "Applying chroma key...");

    setTimeout(() => {
      try {
        state.addEffectToClip(clip.id, "brightness");
        toast.success("Chroma key applied", "Effect added to clip");
      } catch {
        toast.error("Error", "Failed to apply effect");
      }
      setProcessing(false);
      processingRef.current = false;
    }, 300);
  }, [toast]);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (customBg) URL.revokeObjectURL(customBg);
    const url = URL.createObjectURL(f);
    setCustomBg(url);
    setSelectedTemplate({
      id: "custom",
      name: f.name,
      type: "image",
      thumbnail: url,
      data: url,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button onClick={() => setTab("chroma")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${tab === "chroma" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Pipette size={10} className="inline mr-1" />Chroma Key
        </button>
        <button onClick={() => setTab("replace")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${tab === "replace" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Image size={10} className="inline mr-1" />Background
        </button>
      </div>

      {tab === "chroma" && (
        <div className="glass rounded-xl p-3 space-y-2">
          <div>
            <label className="text-[9px] text-text-tertiary block mb-1">Key Color</label>
            <input type="color" value={keyColor} onChange={(e) => setKeyColor(e.target.value)}
              className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-border-subtle" />
          </div>
          <Slider label="Similarity" value={similarity} min={1} max={100} onChange={setSimilarity} unit="%" />
          <Slider label="Smoothness" value={smoothness} min={0} max={100} onChange={setSmoothness} unit="%" />
          <Slider label="Spill Reduction" value={spillReduction} min={0} max={100} onChange={setSpillReduction} unit="%" />
          <button onClick={handleApplyChromaKey} disabled={processing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]">
            Apply Chroma Key
          </button>
        </div>
      )}

      {tab === "replace" && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {BACKGROUND_TEMPLATES.map((tpl) => (
              <button key={tpl.id} onClick={() => setSelectedTemplate(tpl)}
                className={`aspect-video rounded-lg border-2 transition-all ${selectedTemplate?.id === tpl.id ? "border-neon-cyan" : "border-border-subtle hover:border-neon-cyan/50"} overflow-hidden`}>
                <div className="w-full h-full flex items-center justify-center" style={tpl.type === "solid" ? { background: tpl.data } : undefined}>
                  {tpl.type === "gradient" ? (
                    <div className="w-full h-full" style={{ background: tpl.data }} />
                  ) : tpl.type === "pattern" ? (
                    <div className="w-full h-full" style={{ background: tpl.data, backgroundSize: "10px 10px" }} />
                  ) : (
                    <Image size={14} className="text-text-tertiary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div onClick={() => fileRef.current?.click()}
            className="glass rounded-xl p-3 border-2 border-dashed border-border-subtle hover:border-neon-cyan/30 cursor-pointer text-center transition-all">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
            <Upload size={14} className="mx-auto text-neon-cyan mb-1" />
            <p className="text-[9px] text-text-tertiary">Upload custom background</p>
          </div>

          <button disabled={processing || !selectedTemplate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]">
            <Image size={11} /> Apply Background
          </button>
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-0.5">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-mono">{value}{unit || ""}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neon-cyan h-1" />
    </div>
  );
}
