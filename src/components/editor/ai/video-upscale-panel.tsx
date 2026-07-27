"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { upscaleVideoAI } from "@/lib/ai/video-upscale";
import { ArrowUpCircle, Upload, Download } from "lucide-react";

export function VideoUpscalePanel() {
  const toast = useToast();
  const [scale, setScale] = useState<2 | 4>(4);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpscale = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Invalid file", "Please select a video file");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResultUrl(null);

    try {
      const result = await upscaleVideoAI(file, {
        scale,
        onProgress: setProgress,
      });
      setResultUrl(result.video);
      toast.success("Upscaled", `Video upscaled ${scale}x using AI`);
    } catch (error: any) {
      toast.error("Upscaling failed", error.message || "Could not upscale video");
    } finally {
      setProcessing(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [scale, toast]);

  const handleApplyToClip = useCallback(() => {
    if (!resultUrl) return;
    const store = useEditorStore.getState();
    const clip = store.clips.find((c) => c.id === store.selectedClipId);
    if (!clip) {
      toast.error("No clip", "Select a clip first");
      return;
    }
    store.updateClip(clip.id, { src: resultUrl, name: `${clip.name.replace(/\.[^.]+$/, "")}_upscaled.mp4` });
    toast.success("Applied", "Upscaled video applied to clip");
  }, [resultUrl, toast]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `upscaled-${scale}x-${Date.now()}.mp4`;
    a.click();
  }, [resultUrl, scale]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <ArrowUpCircle size={12} className="text-neon-cyan" />
        <span className="text-[10px] font-medium text-text-primary">AI Video Upscaling</span>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        Upscale video resolution using Real-ESRGAN AI. Best for enhancing low-resolution footage.
      </p>

      {/* Scale Selection */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Upscale Factor</label>
        <div className="flex gap-1">
          <button onClick={() => setScale(2)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
              scale === 2 ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}>
            2x (Faster)
          </button>
          <button onClick={() => setScale(4)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
              scale === 4 ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary border border-border-subtle"
            }`}>
            4x (Best Quality)
          </button>
        </div>
      </div>

      {/* Upload Button */}
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpscale} className="hidden" />

      <button onClick={() => fileInputRef.current?.click()} disabled={processing}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50">
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-cyan">Upscaling... {progress}%</span>
          </>
        ) : (
          <>
            <Upload size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary">Select Video File</span>
          </>
        )}
      </button>

      {processing && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div className="h-full bg-neon-cyan transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Result */}
      {resultUrl && (
        <div className="space-y-2">
          <div className="glass rounded-xl overflow-hidden">
            <video src={resultUrl} controls className="w-full max-h-40 object-contain" />
          </div>

          <div className="flex gap-1">
            <button onClick={handleApplyToClip}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all active:scale-[0.98]">
              Apply to Clip
            </button>
            <button onClick={handleDownload}
              className="size-8 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <Download size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
