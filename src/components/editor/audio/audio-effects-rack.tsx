"use client";

import { useState, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { decodeAudioFile, audioBufferToWav, createVoiceChainer, createToneEnhancer, createNoiseRemover, createBgMusicRemover } from "@/lib/audio-engine/index";
import { Mic, Music, Volume2, Waves, Radio, Sparkles, Play, Square, RotateCcw, Upload, Download } from "lucide-react";

type EffectCategory = "voice" | "tone" | "noise" | "bgm";

interface EffectPreset {
  id: string;
  name: string;
  category: EffectCategory;
  icon: string;
  params: Record<string, number>;
  description: string;
}

const EFFECT_PRESETS: EffectPreset[] = [
  // Voice Changer
  { id: "chipmunk", name: "Chipmunk", category: "voice", icon: "🐿", params: { pitch: 8, formant: 3, distortion: 0, chorus: 0, robot: 0 }, description: "High-pitched cartoon voice" },
  { id: "deep", name: "Deep Voice", category: "voice", icon: "👹", params: { pitch: -6, formant: -3, distortion: 0.2, chorus: 0.1, robot: 0 }, description: "Booming deep voice" },
  { id: "robot", name: "Robot", category: "voice", icon: "🤖", params: { pitch: 0, formant: 2, distortion: 0.6, chorus: 0.3, robot: 0.8 }, description: "Metallic robotic voice" },
  { id: "chorus", name: "Chorus", category: "voice", icon: "🎤", params: { pitch: 0, formant: 0, distortion: 0, chorus: 0.7, robot: 0 }, description: "Rich layered chorus effect" },
  { id: "alien", name: "Alien", category: "voice", icon: "👽", params: { pitch: 4, formant: 5, distortion: 0.4, chorus: 0.5, robot: 0.3 }, description: "Extraterrestrial warble" },
  { id: "monster", name: "Monster", category: "voice", icon: "👾", params: { pitch: -8, formant: -4, distortion: 0.8, chorus: 0.2, robot: 0.5 }, description: "Guttural monster growl" },
  { id: "helium", name: "Helium", category: "voice", icon: "🎈", params: { pitch: 12, formant: 4, distortion: 0, chorus: 0, robot: 0 }, description: "Squeaky helium voice" },
  { id: "underwater", name: "Underwater", category: "voice", icon: "🌊", params: { pitch: -4, formant: -2, distortion: 0.3, chorus: 0.6, robot: 0, }, description: "Muffled underwater effect" },
  // Tone Enhancer
  { id: "warm-vocal", name: "Warm Vocal", category: "tone", icon: "🔥", params: { bass: 3, mid: 2, treble: 1, presence: 1.5, warmth: 0.6, compressor: 0.4 }, description: "Rich warm vocals" },
  { id: "bright", name: "Bright", category: "tone", icon: "☀", params: { bass: -1, mid: 1, treble: 5, presence: 4, warmth: 0, compressor: 0.3 }, description: "Crisp, bright presence" },
  { id: "bass-boost", name: "Bass Boost", category: "tone", icon: "🔊", params: { bass: 8, mid: 0, treble: 0, presence: 0, warmth: 0.3, compressor: 0.5 }, description: "Deep bass enhancement" },
  { id: "podcast", name: "Podcast", category: "tone", icon: "🎙", params: { bass: 2, mid: 3, treble: 2, presence: 2, warmth: 0.4, compressor: 0.6 }, description: "Professional podcast sound" },
  { id: "radio", name: "Radio", category: "tone", icon: "📻", params: { bass: -2, mid: 4, treble: -1, presence: 0, warmth: 0, compressor: 0.7 }, description: "Vintage AM radio" },
  { id: "telephone", name: "Telephone", category: "tone", icon: "☎", params: { bass: -8, mid: 0, treble: -5, presence: 0, warmth: 0, compressor: 0 }, description: "Old telephone line" },
  // Noise Removal
  { id: "gentle-gate", name: "Gentle Gate", category: "noise", icon: "🚪", params: { gateThreshold: -50, gateAttack: 0.01, gateRelease: 0.3, hissReduction: 0.3, humRemoval: 0.2 }, description: "Subtle background noise reduction" },
  { id: "studio-clean", name: "Studio Clean", category: "noise", icon: "✨", params: { gateThreshold: -60, gateAttack: 0.005, gateRelease: 0.2, hissReduction: 0.6, humRemoval: 0.5 }, description: "Professional noise cleaning" },
  { id: "hiss-removal", name: "Hiss Removal", category: "noise", icon: "🐍", params: { gateThreshold: -40, gateAttack: 0.01, gateRelease: 0.5, hissReduction: 0.9, humRemoval: 0.3 }, description: "Aggressive tape hiss removal" },
  { id: "hum-filter", name: "Hum Filter", category: "noise", icon: "〰", params: { gateThreshold: -35, gateAttack: 0.02, gateRelease: 0.4, hissReduction: 0.2, humRemoval: 0.9 }, description: "Removes 50/60Hz electrical hum" },
  // Background Music Removal
  { id: "karaoke", name: "Karaoke", category: "bgm", icon: "🎤", params: { strength: 0.8, lowCut: 0.5, centerWidth: 0.7, preserveVocals: 0.3 }, description: "Center channel cancel for vocals" },
  { id: "instrumental", name: "Instrumental", category: "bgm", icon: "🎸", params: { strength: 0.5, lowCut: 0.3, centerWidth: 0.5, preserveVocals: 0 }, description: "Reduce vocals, keep instruments" },
  { id: "vocal-isolate", name: "Vocal Isolate", category: "bgm", icon: "🗣", params: { strength: 0.9, lowCut: 0.7, centerWidth: 0.9, preserveVocals: 0.8 }, description: "Isolate vocal center channel" },
];

export function AudioEffectsRack() {
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<EffectCategory>("voice");
  const [selectedPreset, setSelectedPreset] = useState<EffectPreset | null>(null);
  const [customParams, setCustomParams] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [bypass, setBypass] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories: { id: EffectCategory; label: string; icon: typeof Mic }[] = [
    { id: "voice", label: "Voice Changer", icon: Mic },
    { id: "tone", label: "Tone Enhancer", icon: Volume2 },
    { id: "noise", label: "Noise Removal", icon: Waves },
    { id: "bgm", label: "BG Music", icon: Radio },
  ];

  const filteredPresets = EFFECT_PRESETS.filter((p) => p.category === activeCategory);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSourceFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSelectedPreset(null);
    setCustomParams({});
  };

  const applyPreset = (preset: EffectPreset) => {
    setSelectedPreset(preset);
    setCustomParams({ ...preset.params });
    setBypass(false);
    toast.success(`Applied: ${preset.name}`, preset.description);
  };

  const updateParam = (key: string, value: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }));
  };

  const resetParams = () => {
    if (selectedPreset) {
      setCustomParams({ ...selectedPreset.params });
      toast.info("Reset", "Parameters restored to preset defaults");
    }
  };

  const processAudio = useCallback(async () => {
    if (!sourceFile) { toast.error("No file", "Select an audio file first"); return; }

    setIsProcessing(true);
    toast.info("Processing...", "Applying audio effect");

    try {
      const audioBuffer = await decodeAudioFile(sourceFile);
      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const totalSamples = audioBuffer.length;

      // Create offline context for rendering
      const offlineCtx = new OfflineAudioContext(numChannels, totalSamples, sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      let chain: AudioNode = source;

      if (!bypass) {
        if (activeCategory === "voice") {
          const vc = createVoiceChainer(offlineCtx as unknown as AudioContext, {
            pitch: customParams.pitch ?? 0,
            formant: customParams.formant ?? 0,
            distortion: customParams.distortion ?? 0,
            chorus: customParams.chorus ?? 0,
            robot: customParams.robot ?? 0,
          });
          chain.connect(vc.input);
          chain = vc.output;
        } else if (activeCategory === "tone") {
          const te = createToneEnhancer(offlineCtx as unknown as AudioContext, {
            bass: customParams.bass ?? 0,
            mid: customParams.mid ?? 0,
            treble: customParams.treble ?? 0,
            presence: customParams.presence ?? 0,
            warmth: customParams.warmth ?? 0,
            compressor: customParams.compressor ?? 0,
          });
          chain.connect(te.input);
          chain = te.output;
        } else if (activeCategory === "noise") {
          const nr = createNoiseRemover(offlineCtx as unknown as AudioContext, {
            gateThreshold: customParams.gateThreshold ?? -60,
            gateAttack: customParams.gateAttack ?? 0.01,
            gateRelease: customParams.gateRelease ?? 0.3,
            hissReduction: customParams.hissReduction ?? 0,
            humRemoval: customParams.humRemoval ?? 0,
          });
          chain.connect(nr.input);
          chain = nr.output;
        } else if (activeCategory === "bgm") {
          const bgm = createBgMusicRemover(offlineCtx as unknown as AudioContext, {
            strength: customParams.strength ?? 0.5,
            lowCut: customParams.lowCut ?? 0,
            centerWidth: customParams.centerWidth ?? 0.5,
            preserveVocals: customParams.preserveVocals ?? 0,
          });
          chain.connect(bgm.input);
          chain = bgm.output;
        }
      }

      chain.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      // Convert to WAV blob
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setPreviewUrl(url);

      toast.success("Processing complete", "Preview ready for playback");
    } catch (err: any) {
      toast.error("Processing failed", err.message);
    }

    setIsProcessing(false);
  }, [sourceFile, activeCategory, customParams, bypass, toast]);

  const addToTimeline = () => {
    if (!previewUrl || !sourceFile) return;
    const track = useEditorStore.getState().tracks.find((t) => t.type === "audio");
    if (!track) { toast.error("No audio track", "Add an audio track first"); return; }

    useEditorStore.getState().addClip({
      trackId: track.id,
      type: "audio",
      name: `${sourceFile.name.replace(/\.[^.]+$/, "")} (processed)`,
      src: previewUrl,
      thumbnail: null,
      startTime: 0,
      duration: 10,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [], effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });
    toast.success("Added to timeline", "Processed audio clip created");
  };

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedPreset(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                  : "glass border border-border-subtle text-text-tertiary hover:text-text-primary"
              }`}
            >
              <Icon size={11} /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-1">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={`px-2 py-1.5 rounded-lg text-[9px] text-left transition-all active:scale-[0.97] ${
              selectedPreset?.id === preset.id
                ? "bg-neon-cyan/15 border border-neon-cyan/30"
                : "glass border border-border-subtle hover:bg-glass-medium"
            }`}
          >
            <div className="flex items-center gap-1">
              <span>{preset.icon}</span>
              <span className="font-medium text-text-primary text-[10px]">{preset.name}</span>
            </div>
            <p className="text-[8px] text-text-tertiary mt-0.5">{preset.description}</p>
          </button>
        ))}
      </div>

      {/* File input */}
      <div
        onClick={() => fileRef.current?.click()}
        className="glass rounded-xl p-3 border-2 border-dashed border-border-subtle hover:border-neon-cyan/30 cursor-pointer text-center transition-all"
      >
        <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
        <div className="flex items-center justify-center gap-2">
          <Upload size={14} className="text-neon-cyan" />
          <span className="text-[10px] text-text-primary">{sourceFile ? sourceFile.name : "Select audio file..."}</span>
        </div>
      </div>

      {/* Preview player */}
      {previewUrl && (
        <div className="glass rounded-xl p-2">
          <audio src={previewUrl} controls className="w-full h-8" />
        </div>
      )}

      {/* Parameters */}
      {selectedPreset && (
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">
              {selectedPreset.name} Parameters
            </h4>
            <div className="flex gap-1">
              <button onClick={resetParams} className="size-6 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary" title="Reset"><RotateCcw size={10} /></button>
              <button onClick={() => setBypass((p) => !p)} className={`px-1.5 py-0.5 rounded-lg text-[8px] font-medium transition-all ${bypass ? "glass text-text-tertiary" : "bg-neon-cyan/20 text-neon-cyan"}`}>FX</button>
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(customParams).map(([key, value]) => {
              const param = selectedPreset.params[key];
              if (param === undefined) return null;
              const min = key.includes("pitch") || key.includes("formant") ? -12 : key.includes("gateThreshold") ? -80 : key.includes("gateAttack") ? 0 : key.includes("gateRelease") ? 0 : key.includes("bass") || key.includes("mid") || key.includes("treble") || key.includes("presence") ? -12 : 0;
              const max = key.includes("pitch") ? 12 : key.includes("formant") ? 5 : key.includes("gateThreshold") ? -20 : key.includes("gateAttack") ? 0.1 : key.includes("gateRelease") ? 1 : key.includes("bass") || key.includes("mid") || key.includes("treble") || key.includes("presence") ? 12 : key.includes("compressor") || key.includes("warmth") || key.includes("strength") || key.includes("centerWidth") || key.includes("preserveVocals") || key.includes("hissReduction") || key.includes("humRemoval") || key.includes("distortion") || key.includes("chorus") || key.includes("robot") || key.includes("lowCut") ? 1 : 10;
              const step = key.includes("gateThreshold") ? 1 : 0.01;

              return (
                <div key={key}>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="text-text-primary font-mono">{typeof value === "number" ? value.toFixed(2) : value}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={(e) => updateParam(key, Number(e.target.value))}
                    className="w-full accent-neon-cyan h-1" />
                </div>
              );
            })}
          </div>

          <button
            onClick={processAudio}
            disabled={isProcessing || !sourceFile}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neon-cyan/20 text-neon-cyan text-[10px] font-semibold hover:bg-neon-cyan/30 transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {isProcessing ? (
              <><span className="size-3 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" /> Processing...</>
            ) : (
              <><Play size={11} /> Apply Effect</>
            )}
          </button>
        </div>
      )}

      {/* Add to timeline */}
      {previewUrl && selectedPreset && (
        <button
          onClick={addToTimeline}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass text-text-primary text-[10px] font-medium hover:bg-glass-medium transition-all active:scale-[0.98]"
        >
          <Download size={11} /> Add Processed Audio to Timeline
        </button>
      )}
    </div>
  );
}
