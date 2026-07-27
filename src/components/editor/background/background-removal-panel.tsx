"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { BACKGROUND_TEMPLATES, chromaKeyRemove, replaceBackground, renderBackgroundOnCanvas, type BackgroundTemplate } from "@/lib/background/index";
import { removeBackgroundAI } from "@/lib/ai/background-removal";
import { Image, Upload, Pipette, Sparkles } from "lucide-react";

export function BackgroundRemovalPanel() {
  const toast = useToast();
  const [tab, setTab] = useState<"ai" | "chroma" | "replace">("ai");
  const [keyColor, setKeyColor] = useState("#00ff00");
  const [similarity, setSimilarity] = useState(30);
  const [smoothness, setSmoothness] = useState(10);
  const [spillReduction, setSpillReduction] = useState(30);
  const [selectedTemplate, setSelectedTemplate] = useState<BackgroundTemplate | null>(null);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const aiFileRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const handleAIRemove = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please select an image file");
      return;
    }

    setProcessing(true);
    setAiProgress(0);
    setAiResult(null);

    try {
      const result = await removeBackgroundAI(file, {
        onProgress: setAiProgress,
      });
      setAiResult(result.image);
      toast.success("Background removed", "AI successfully removed the background");
    } catch (error: any) {
      toast.error("Removal failed", error.message || "Could not remove background");
    } finally {
      setProcessing(false);
      setAiProgress(0);
      if (aiFileRef.current) aiFileRef.current.value = "";
    }
  }, [toast]);

  const handleApplyAIRemove = useCallback(() => {
    if (!aiResult) return;

    const state = useEditorStore.getState();
    const clip = state.clips.find((c) => c.id === state.selectedClipId);
    if (!clip) {
      toast.error("No clip", "Select a clip first");
      return;
    }

    state.updateClip(clip.id, { src: aiResult });
    toast.success("Applied", "Background removed image applied to clip");
  }, [aiResult, toast]);

  const handleApplyChromaKey = useCallback(async () => {
    const state = useEditorStore.getState();
    const clip = state.clips.find((c) => c.id === state.selectedClipId);
    if (!clip) { toast.error("No clip", "Select a clip first"); return; }
    if (processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);
    toast.info("Processing", "Applying chroma key...");

    try {
      if (!clip.src) { toast.error("No clip", "Clip has no source"); return; }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = clip.src!;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const resultCanvas = chromaKeyRemove(canvas, {
        color: hexToRgb(keyColor),
        similarity,
        smoothness,
        spillReduction,
      });

      const resultUrl = resultCanvas.toDataURL("image/png");
      state.updateClip(clip.id, { src: resultUrl });
      toast.success("Chroma key applied", "Background removed from clip");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to apply chroma key");
    }

    setProcessing(false);
    processingRef.current = false;
  }, [keyColor, similarity, smoothness, spillReduction, toast]);

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
        <button onClick={() => setTab("ai")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${tab === "ai" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Sparkles size={10} className="inline mr-1" />AI Remove
        </button>
        <button onClick={() => setTab("chroma")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${tab === "chroma" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Pipette size={10} className="inline mr-1" />Chroma Key
        </button>
        <button onClick={() => setTab("replace")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${tab === "replace" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Image size={10} className="inline mr-1" />Background
        </button>
      </div>

      {tab === "ai" && (
        <div className="glass rounded-xl p-3 space-y-2">
          <p className="text-[8px] text-text-tertiary leading-relaxed">
            Uses RMBG-2.0 AI model to automatically detect and remove backgrounds from images. Works on any image without needing a green screen.
          </p>

          <input
            ref={aiFileRef}
            type="file"
            accept="image/*"
            onChange={handleAIRemove}
            className="hidden"
          />

          <button
            onClick={() => aiFileRef.current?.click()}
            disabled={processing}
            className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50"
          >
            {processing ? (
              <>
                <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
                <span className="text-[10px] text-neon-cyan">Removing... {aiProgress}%</span>
              </>
            ) : (
              <>
                <Upload size={12} className="text-text-secondary" />
                <span className="text-[10px] text-text-secondary">Select Image</span>
              </>
            )}
          </button>

          {processing && (
            <div className="glass rounded-lg h-1.5 overflow-hidden">
              <div
                className="h-full bg-neon-cyan transition-all duration-300"
                style={{ width: `${aiProgress}%` }}
              />
            </div>
          )}

          {aiResult && (
            <div className="space-y-2">
              <div className="glass rounded-lg p-2 flex items-center gap-2">
                <div
                  className="w-16 h-16 rounded-lg bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${aiResult})`,
                    backgroundColor: "#1a1a2e",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-primary font-medium">Background Removed</p>
                  <p className="text-[8px] text-text-tertiary">Ready to apply</p>
                </div>
              </div>

              <button
                onClick={handleApplyAIRemove}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all active:scale-[0.98]"
              >
                <Sparkles size={11} /> Apply to Clip
              </button>
            </div>
          )}
        </div>
      )}

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

          <button
            onClick={() => {
              if (!selectedTemplate) return;
              const state = useEditorStore.getState();
              const clip = state.clips.find((c) => c.id === state.selectedClipId);
              if (!clip) { toast.error("No clip", "Select a clip first"); return; }
              if (!clip.src) { toast.error("No clip", "Clip has no source"); return; }

              try {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  const ctx = canvas.getContext("2d")!;
                  renderBackgroundOnCanvas(ctx, selectedTemplate, canvas.width, canvas.height, img);
                  const fgImg = new window.Image();
                  fgImg.crossOrigin = "anonymous";
                  fgImg.onload = () => {
                    ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);
                    state.updateClip(clip.id, { src: canvas.toDataURL("image/png") });
                    toast.success("Applied", "Background replaced on clip");
                  };
                  fgImg.onerror = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    state.updateClip(clip.id, { src: canvas.toDataURL("image/png") });
                    toast.success("Applied", "Background replaced on clip");
                  };
                  fgImg.src = clip.src!;
                };
                img.onerror = () => toast.error("Error", "Failed to load background");
                img.src = selectedTemplate.data;
              } catch (err: any) {
                toast.error("Error", err.message || "Failed to apply background");
              }
            }}
            disabled={processing || !selectedTemplate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            <Image size={11} /> Apply Background
          </button>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 255, 0];
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
