"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { QUALITY_PRESETS, COMPRESSION_PRESETS, enhanceVideoFrame, compressVideo } from "@/lib/video/enhancer";
import { Sparkles, Scissors, Download } from "lucide-react";

export function VideoEnhancerPanel() {
  const toast = useToast();
  const [tab, setTab] = useState<"enhance" | "compress">("enhance");
  const [targetQuality, setTargetQuality] = useState(QUALITY_PRESETS[1]);
  const [sharpen, setSharpen] = useState(30);
  const [contrast, setContrast] = useState(10);
  const [saturation, setSaturation] = useState(5);
  const [denoise, setDenoise] = useState(10);
  const [compressPreset, setCompressPreset] = useState(COMPRESSION_PRESETS[2]);
  const [compressQuality, setCompressQuality] = useState(QUALITY_PRESETS[1]);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  const handleEnhance = async () => {
    const state = useEditorStore.getState();
    const clip = state.clips.find((c) => c.id === state.selectedClipId);
    if (!clip || !clip.src) { toast.error("No clip", "Select a clip first"); return; }
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    toast.info("Enhancing", "Processing video quality...");

    try {
      const video = document.createElement("video");
      video.src = clip.src;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Video load timeout")), 10000);
        video.addEventListener("loadedmetadata", () => { clearTimeout(timeout); resolve(); });
        video.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("Video load failed")); });
        video.load();
      });

      const outW = targetQuality.width;
      const outH = targetQuality.height;
      const compositeCanvas = document.createElement("canvas");
      compositeCanvas.width = outW;
      compositeCanvas.height = outH;
      const compCtx = compositeCanvas.getContext("2d")!;

      const stream = compositeCanvas.captureStream(30);
      const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      let recorder: MediaRecorder | null = null;
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) { recorder = new MediaRecorder(stream, { mimeType: m, videoBitsPerSecond: targetQuality.bitrate }); break; }
      }
      if (!recorder) recorder = new MediaRecorder(stream, { videoBitsPerSecond: targetQuality.bitrate });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      video.currentTime = 0;
      await new Promise<void>((resolve) => { video.addEventListener("seeked", () => resolve(), { once: true }); });

      const totalDuration = video.duration || 10;
      const fps = 30;
      const frameInterval = 1000 / fps;
      let currentFrame = 0;

      const processFrame = (time: number) => {
        if (time >= totalDuration || processingRef.current === false) {
          if (recorder?.state === "recording") recorder.stop();
          return;
        }

        video.currentTime = time;
        compCtx.drawImage(video, 0, 0, outW, outH);

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = outW;
        frameCanvas.height = outH;
        frameCanvas.getContext("2d")!.drawImage(compositeCanvas, 0, 0);

        const enhanced = enhanceVideoFrame(frameCanvas, {
          targetWidth: outW, targetHeight: outH,
          sharpening: sharpen, contrast, saturation, denoise,
        });
        compCtx.clearRect(0, 0, outW, outH);
        compCtx.drawImage(enhanced, 0, 0);

        currentFrame++;
        setTimeout(() => processFrame(time + 1 / fps), frameInterval);
      };

      return new Promise<void>((resolve, reject) => {
        recorder!.onstop = () => {
          const blob = new Blob(chunks, { type: recorder!.mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${clip!.name.replace(/\.[^.]+$/, "")}_enhanced.webm`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          toast.success("Enhancement complete", `Upscaled to ${targetQuality.label}`);
          setProcessing(false);
          processingRef.current = false;
          resolve();
        };
        recorder!.onerror = () => { reject(new Error("Recording failed")); };
        recorder!.start(100);
        processFrame(0);
      });
    } catch (err: any) {
      toast.error("Enhancement failed", err?.message || "Unknown error");
      setProcessing(false);
      processingRef.current = false;
    }
  };

  const handleCompress = async () => {
    const state = useEditorStore.getState();
    const clip = state.clips.find((c) => c.id === state.selectedClipId);
    if (!clip || !clip.src) { toast.error("No clip", "Select a clip first"); return; }
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    toast.info("Compressing", "Compressing video...");

    try {
      const bitrate = compressPreset.bitrate > 0 ? compressPreset.bitrate : Math.floor(compressQuality.bitrate * compressPreset.quality);
      const blob = await compressVideo(clip.src, {
        targetBitrate: bitrate,
        targetWidth: compressQuality.width,
        targetHeight: compressQuality.height,
        quality: compressPreset.quality,
        codec: "video/webm;codecs=vp9",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.name.replace(/\.[^.]+$/, "")}_compressed.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      toast.success("Compression complete", `Video compressed to ${compressQuality.label}`);
    } catch (err: any) {
      toast.error("Compression failed", err?.message || "Unknown error");
    }
    setProcessing(false);
    processingRef.current = false;
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button onClick={() => setTab("enhance")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${tab === "enhance" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Sparkles size={10} /> Enhance
        </button>
        <button onClick={() => setTab("compress")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${tab === "compress" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"}`}>
          <Scissors size={10} /> Compress
        </button>
      </div>

      {tab === "enhance" && (
        <div className="glass rounded-xl p-3 space-y-2">
          <label className="text-[9px] text-text-tertiary block">Target Resolution</label>
          <div className="grid grid-cols-1 gap-1">
            {QUALITY_PRESETS.map((preset) => (
              <button key={preset.label} onClick={() => setTargetQuality(preset)}
                className={`px-2 py-1 rounded-lg text-[9px] text-left transition-all ${
                  targetQuality.label === preset.label
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "glass text-text-secondary border border-border-subtle hover:text-text-primary"
                }`}>
                {preset.label}
              </button>
            ))}
          </div>

          <Slider label="Sharpening" value={sharpen} min={0} max={100} onChange={setSharpen} unit="%" />
          <Slider label="Contrast" value={contrast} min={-50} max={50} onChange={setContrast} unit="%" />
          <Slider label="Saturation" value={saturation} min={-50} max={50} onChange={setSaturation} unit="%" />
          <Slider label="Denoise" value={denoise} min={0} max={100} onChange={setDenoise} unit="%" />

          <button onClick={handleEnhance} disabled={processing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]">
            {processing ? (
              <><span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" /> Enhancing...</>
            ) : (
              <><Sparkles size={11} /> Enhance &amp; Export WebM</>
            )}
          </button>
        </div>
      )}

      {tab === "compress" && (
        <div className="glass rounded-xl p-3 space-y-2">
          <label className="text-[9px] text-text-tertiary block">Output Resolution</label>
          <div className="grid grid-cols-1 gap-1">
            {QUALITY_PRESETS.slice(0, 3).map((preset) => (
              <button key={preset.label} onClick={() => setCompressQuality(preset)}
                className={`px-2 py-1 rounded-lg text-[9px] text-left transition-all ${
                  compressQuality.label === preset.label
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "glass text-text-secondary border border-border-subtle hover:text-text-primary"
                }`}>
                {preset.label}
              </button>
            ))}
          </div>

          <label className="text-[9px] text-text-tertiary block mt-2">Compression Level</label>
          <div className="grid grid-cols-1 gap-1">
            {COMPRESSION_PRESETS.map((preset) => (
              <button key={preset.label} onClick={() => setCompressPreset(preset)}
                className={`px-2 py-1 rounded-lg text-[9px] text-left transition-all ${
                  compressPreset.label === preset.label
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "glass text-text-secondary border border-border-subtle hover:text-text-primary"
                }`}>
                {preset.label}
              </button>
            ))}
          </div>

          <button onClick={handleCompress} disabled={processing}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]">
            {processing ? (
              <><span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" /> Compressing...</>
            ) : (
              <><Download size={11} /> Compress &amp; Download WebM</>
            )}
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
