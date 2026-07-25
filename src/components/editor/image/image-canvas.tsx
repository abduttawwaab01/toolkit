"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";

export function ImageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const drawingCanvas = useImageEditorStore((s) => s.drawingCanvas);
  const zoom = useImageEditorStore((s) => s.zoom);
  const panX = useImageEditorStore((s) => s.panX);
  const panY = useImageEditorStore((s) => s.panY);
  const showBeforeAfter = useImageEditorStore((s) => s.showBeforeAfter);
  const originalCanvas = useImageEditorStore((s) => s.originalCanvas);
  const setZoom = useImageEditorStore((s) => s.setZoom);
  const setPan = useImageEditorStore((s) => s.setPan);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayCanvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = displayCanvas.width * zoom;
    const h = displayCanvas.height * zoom;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    if (showBeforeAfter && originalCanvas) {
      const midX = w / 2;
      ctx.drawImage(originalCanvas, 0, 0, w, h);
      ctx.beginPath();
      ctx.rect(midX, 0, w - midX, h);
      ctx.clip();
      ctx.drawImage(displayCanvas, 0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(midX, h / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    } else {
      ctx.drawImage(displayCanvas, 0, 0, w, h);
    }

    if (drawingCanvas) {
      ctx.drawImage(drawingCanvas, 0, 0, w, h);
    }
  }, [displayCanvas, drawingCanvas, zoom, showBeforeAfter, originalCanvas]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  }, [zoom, setZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan(e.clientX - dragStart.x, e.clientY - dragStart.y);
    }
  }, [isDragging, dragStart, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container || !displayCanvas) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / displayCanvas.width, ch / displayCanvas.height, 1);
    setZoom(scale);
    setPan(0, 0);
  }, [displayCanvas, setZoom, setPan]);

  useEffect(() => {
    fitToContainer();
    window.addEventListener("resize", fitToContainer);
    return () => window.removeEventListener("resize", fitToContainer);
  }, [displayCanvas, fitToContainer]);

  if (!displayCanvas) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden bg-[#0a0a0f] relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{
          transform: `translate(${panX}px, ${panY}px)`,
          imageRendering: "auto",
        }}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 glass px-2 py-1 rounded-lg text-[10px] text-text-tertiary">
        <button onClick={() => setZoom(zoom / 1.2)} className="px-1 hover:text-text-primary">−</button>
        <span className="tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom * 1.2)} className="px-1 hover:text-text-primary">+</button>
        <button onClick={fitToContainer} className="px-1 hover:text-text-primary">Fit</button>
      </div>
    </div>
  );
}
