"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { buildEffectChain } from "@/lib/audio-engine/player-processor";

interface PlayerWaveformProps {
  isPlaying: boolean;
}

export function PlayerWaveform({ isPlaying }: PlayerWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const chainRef = useRef<{ cleanup: () => void } | null>(null);
  const lastEffectsRef = useRef<string>("");
  const coreConnected = useRef(false);

  const effectRevision = useEditorStore((s) => {
    const clip = s.clips.find((c) => c.id === s.selectedClipId);
    const track = clip ? s.tracks.find((t) => t.id === clip.trackId) : null;
    return track?.audioEffects.map((e) => `${e.type}:${e.enabled}:${JSON.stringify(e.params)}`).join("|") ?? "";
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const video = canvas.closest("[data-player-container]")?.querySelector("video") as HTMLVideoElement | null;
    if (!video) return;

    // Mute the video's native audio so it only plays through the Web Audio graph
    video.muted = true;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    if (!audioCtxRef.current) {
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        sourceRef.current = audioCtx.createMediaElementSource(video);
        gainRef.current = audioCtx.createGain();
        analyserRef.current = audioCtx.createAnalyser();
        analyserRef.current.fftSize = 256;
        coreConnected.current = false;
      } catch {
        return;
      }
    }

    const buildChain = () => {
      const state = useEditorStore.getState();
      const clip = state.clips.find((c) => c.id === state.selectedClipId);
      const track = clip ? state.tracks.find((t) => t.id === clip.trackId) : null;
      const effects = track?.audioEffects ?? [];

      const effectsJson = JSON.stringify(effects.map((e) => ({ type: e.type, enabled: e.enabled, params: e.params })));
      if (effectsJson === lastEffectsRef.current && chainRef.current && coreConnected.current) return;
      lastEffectsRef.current = effectsJson;

      chainRef.current?.cleanup();
      chainRef.current = null;

      const source = sourceRef.current;
      const gain = gainRef.current;
      const analyser = analyserRef.current;
      if (!source || !gain || !analyser || !audioCtxRef.current) return;

      // Disconnect core nodes before reconnecting to avoid duplicates
      if (coreConnected.current) {
        try { gain.disconnect(); } catch {}
        try { analyser.disconnect(); } catch {}
      }

      const chain = buildEffectChain(audioCtxRef.current, source, effects);
      chain.output.connect(gain);
      gain.connect(analyser);
      analyser.connect(audioCtxRef.current.destination);
      chainRef.current = chain;
      coreConnected.current = true;
    };

    buildChain();

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const state = useEditorStore.getState();
      if (gainRef.current) {
        gainRef.current.gain.value = state.masterVolume;
      }

      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0, 245, 212, 0.6)";
        ctx.beginPath();

        const sliceWidth = w / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0, 245, 212, 0.3)";
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (isPlaying) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isPlaying, effectRevision]);

  // Resume AudioContext on user interaction (autoplay policy)
  useEffect(() => {
    const handler = () => {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("click", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
  }, []);

  // Ensure AudioContext is running when playback starts
  useEffect(() => {
    if (isPlaying && audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      chainRef.current?.cleanup();
      chainRef.current = null;
      coreConnected.current = false;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-14 left-3 right-3 h-12 pointer-events-none z-10 opacity-50"
    />
  );
}
