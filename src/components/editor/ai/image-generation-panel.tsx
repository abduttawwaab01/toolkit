"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { generateImage, IMAGE_STYLE_PRESETS, type ImageGenerationResult } from "@/lib/ai/image-generation";
import { ImagePlus, Wand2, Download, Plus, RefreshCw } from "lucide-react";

export function ImageGenerationPanel() {
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(4);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [history, setHistory] = useState<ImageGenerationResult[]>([]);

  const stylePreset = IMAGE_STYLE_PRESETS.find((s) => s.id === selectedStyle);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Empty prompt", "Enter a description for the image");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResult(null);

    const fullPrompt = stylePreset
      ? `${prompt.trim()}, ${stylePreset.prompt}`
      : prompt.trim();

    try {
      const imageResult = await generateImage({
        prompt: fullPrompt,
        negativePrompt: stylePreset?.negative || negativePrompt,
        width,
        height,
        guidanceScale,
        steps,
        seed,
        onProgress: setProgress,
      });

      setResult(imageResult);
      setHistory((prev) => [imageResult, ...prev].slice(0, 20));
      toast.success("Image generated", "AI created your image");
    } catch (error: any) {
      toast.error("Generation failed", error.message || "Could not generate image");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [prompt, negativePrompt, selectedStyle, width, height, guidanceScale, steps, seed, stylePreset, toast]);

  const handleAddToTimeline = useCallback((imageUrl: string) => {
    const store = useEditorStore.getState();
    const imageTrack = store.tracks.find((t) => t.type === "overlay") || store.tracks.find((t) => t.type === "video");
    if (!imageTrack) {
      toast.error("No track", "Add a video or overlay track first");
      return;
    }

    store.addClip({
      trackId: imageTrack.id,
      type: "overlay",
      name: "AI Generated",
      src: imageUrl,
      thumbnail: null,
      startTime: store.playhead,
      duration: 5,
      trimStart: 0,
      trimEnd: 0,
      speed: 1,
      volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1,
      scale: 1,
      rotation: 0,
      positionX: 0,
      positionY: 0,
    });

    toast.success("Added", "AI image added to timeline");
  }, [toast]);

  const handleDownload = useCallback((imageUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `ai-image-${Date.now()}-${index}.png`;
    a.click();
  }, []);

  const handleRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 999999999));
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <ImagePlus size={12} className="text-neon-purple" />
        <span className="text-[10px] font-medium text-text-primary">AI Image Generator</span>
      </div>

      {/* Prompt */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A serene landscape at sunset with mountains..."
          className="w-full glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary placeholder:text-text-tertiary/50 resize-none h-16 border border-border-subtle focus:border-neon-purple/50 focus:outline-none"
        />
      </div>

      {/* Negative Prompt */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Negative Prompt</label>
        <input
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Things to avoid..."
          className="w-full glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary placeholder:text-text-tertiary/50 border border-border-subtle focus:border-neon-purple/50 focus:outline-none"
        />
      </div>

      {/* Style Presets */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Style Preset</label>
        <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
          {IMAGE_STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`px-1.5 py-1 rounded-lg text-[8px] font-medium transition-all text-center ${
                selectedStyle === style.id
                  ? "bg-neon-purple/15 text-neon-purple border border-neon-purple/30"
                  : "glass text-text-tertiary border border-border-subtle hover:text-text-primary"
              }`}
            >
              {style.id.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-text-tertiary block mb-1">Size</label>
          <select
            value={`${width}x${height}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split("x").map(Number);
              setWidth(w);
              setHeight(h);
            }}
            className="w-full glass rounded-lg px-2 py-1 text-[9px] text-text-primary border border-border-subtle"
          >
            <option value="1024x1024">1024x1024 (Square)</option>
            <option value="1152x896">1152x896 (Landscape)</option>
            <option value="896x1152">896x1152 (Portrait)</option>
            <option value="1344x768">1344x768 (Wide)</option>
            <option value="768x1344">768x1344 (Tall)</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-text-tertiary block mb-1">Steps: {steps}</label>
          <input
            type="range" min={1} max={8} value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full accent-neon-purple h-1 mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-text-tertiary block mb-1">Guidance: {guidanceScale}</label>
          <input
            type="range" min={1} max={20} step={0.5} value={guidanceScale}
            onChange={(e) => setGuidanceScale(Number(e.target.value))}
            className="w-full accent-neon-purple h-1"
          />
        </div>
        <div className="flex items-end gap-1">
          <div className="flex-1">
            <label className="text-[9px] text-text-tertiary block mb-1">Seed</label>
            <input
              type="number"
              value={seed ?? ""}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Random"
              className="w-full glass rounded-lg px-2 py-1 text-[9px] text-text-primary border border-border-subtle"
            />
          </div>
          <button onClick={handleRandomSeed}
            className="size-7 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-neon-purple transition-all border border-border-subtle mb-px">
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={processing || !prompt.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-purple/20 text-neon-purple text-[10px] font-semibold hover:bg-neon-purple/30 transition-all disabled:opacity-30 active:scale-[0.98]">
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
            Generating... {progress}%
          </>
        ) : (
          <>
            <Wand2 size={11} /> Generate Image
          </>
        )}
      </button>

      {processing && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div className="h-full bg-neon-purple transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-2">
          <p className="text-[9px] text-text-tertiary uppercase tracking-wider">Generated</p>
          <div className="glass rounded-xl overflow-hidden relative group">
            <img src={result.image} alt="Generated" className="w-full object-contain max-h-48" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => handleAddToTimeline(result.image)}
                className="size-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-neon-cyan hover:bg-neon-cyan/30 transition-all">
                <Plus size={14} />
              </button>
              <button onClick={() => handleDownload(result.image, 0)}
                className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[9px] text-text-tertiary uppercase tracking-wider">Recent</p>
          <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
            {history.slice(1, 9).map((item, i) => (
              <div key={i} className="glass rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-neon-purple/50 transition-all relative group"
                onClick={() => setResult(item)}>
                <img src={item.image} alt="" className="w-full aspect-square object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
