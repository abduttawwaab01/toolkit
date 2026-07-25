"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { createSelectionMask, getPixelColor } from "@/lib/image/editor";
import type { GridType, SelectionState } from "@/types/image-editor";

export function ImageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const isDrawing = useRef(false);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const rafThrottle = useRef<number | null>(null);

  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const drawingCanvas = useImageEditorStore((s) => s.drawingCanvas);
  const renderedCanvas = useImageEditorStore((s) => s.renderedCanvas);
  const zoom = useImageEditorStore((s) => s.zoom);
  const panX = useImageEditorStore((s) => s.panX);
  const panY = useImageEditorStore((s) => s.panY);
  const showBeforeAfter = useImageEditorStore((s) => s.showBeforeAfter);
  const originalCanvas = useImageEditorStore((s) => s.originalCanvas);
  const selection = useImageEditorStore((s) => s.selection);
  const gridType = useImageEditorStore((s) => s.gridType);
  const showImageInfo = useImageEditorStore((s) => s.showImageInfo);
  const originalWidth = useImageEditorStore((s) => s.originalWidth);
  const originalHeight = useImageEditorStore((s) => s.originalHeight);
  const eyedropperActive = useImageEditorStore((s) => s.eyedropperActive);
  const setEyedropperColor = useImageEditorStore((s) => s.setEyedropperColor);
  const setZoom = useImageEditorStore((s) => s.setZoom);
  const setPan = useImageEditorStore((s) => s.setPan);
  const activeTool = useImageEditorStore((s) => s.activeTool);
  const drawTool = useImageEditorStore((s) => s.drawTool);
  const brushSize = useImageEditorStore((s) => s.brushSize);
  const brushColor = useImageEditorStore((s) => s.brushColor);
  const brushOpacity = useImageEditorStore((s) => s.brushOpacity);
  const blendMode = useImageEditorStore((s) => s.blendMode);
  const cloneSampled = useImageEditorStore((s) => s.cloneSampled);
  const cloneSrcX = useImageEditorStore((s) => s.cloneSrcX);
  const cloneSrcY = useImageEditorStore((s) => s.cloneSrcY);
  const setCloneSrc = useImageEditorStore((s) => s.setCloneSrc);
  const [touchZoom, setTouchZoom] = useState(1);

  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !displayCanvas) return;
    const w = displayCanvas.width * zoom;
    const h = displayCanvas.height * zoom;
    overlay.width = w;
    overlay.height = h;
    const ctx = overlay.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);

    // Selection
    if (selection) {
      const mask = createSelectionMask(displayCanvas.width, displayCanvas.height, selection);
      ctx.save();
      ctx.scale(zoom, zoom);
      const imgData = ctx.createImageData(mask.width, mask.height);
      for (let i = 0; i < mask.data.length; i += 4) {
        if (mask.data[i] === 0 && mask.data[i + 3] < 255) {
          imgData.data[i + 3] = 100;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();

      // Selection border
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      const s = selection;
      if (s.type === "rect") {
        ctx.strokeRect(s.x, s.y, s.w, s.h);
      } else {
        ctx.beginPath();
        ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Grid overlay
    if (gridType !== "none") {
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1 / zoom;

      if (gridType === "rule-of-thirds") {
        for (let i = 1; i <= 2; i++) {
          const x = (displayCanvas.width / 3) * i;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, displayCanvas.height); ctx.stroke();
        }
        for (let i = 1; i <= 2; i++) {
          const y = (displayCanvas.height / 3) * i;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(displayCanvas.width, y); ctx.stroke();
        }
      } else if (gridType === "golden-ratio") {
        const phi = 1.618;
        const x1 = displayCanvas.width / phi;
        const y1 = displayCanvas.height / phi;
        ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, displayCanvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(displayCanvas.width, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(displayCanvas.width - x1, 0); ctx.lineTo(displayCanvas.width - x1, displayCanvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, displayCanvas.height - y1); ctx.lineTo(displayCanvas.width, displayCanvas.height - y1); ctx.stroke();
      } else if (gridType === "crosshair") {
        const cx = displayCanvas.width / 2, cy = displayCanvas.height / 2;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, displayCanvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(displayCanvas.width, cy); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(cx, cy) * 0.3, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }, [displayCanvas, zoom, selection, gridType]);

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
      ctx.beginPath(); ctx.rect(midX, 0, w - midX, h); ctx.clip();
      ctx.drawImage(displayCanvas, 0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, h / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
    } else {
      ctx.drawImage(displayCanvas, 0, 0, w, h);
    }

    if (drawingCanvas) ctx.drawImage(drawingCanvas, 0, 0, w, h);

    drawOverlay();
  }, [displayCanvas, drawingCanvas, zoom, showBeforeAfter, originalCanvas, drawOverlay]);

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }, [zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
  }, [zoom, setZoom]);

  const handlePointerDown = useCallback(async (e: React.PointerEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);

    if (eyedropperActive && displayCanvas) {
      const color = getPixelColor(displayCanvas, pos.x, pos.y);
      setEyedropperColor(color);
      return;
    }

    if (activeTool === "draw" && drawingCanvas) {
      e.preventDefault();
      if (drawTool === "clone") {
        if (!cloneSampled) {
          setCloneSrc(pos.x, pos.y);
          return;
        }
        isDrawing.current = true;
        drawPoints.current = [pos];
        return;
      }
      if (drawTool === "text") { shapeStart.current = pos; return; }
      if (["rect", "circle", "line", "arrow"].includes(drawTool)) { shapeStart.current = pos; return; }
      isDrawing.current = true;
      drawPoints.current = [pos];

      if (drawTool === "brush" || drawTool === "eraser") {
        const ctx = drawingCanvas.getContext("2d")!;
        if (drawTool === "eraser") {
          const { drawEraserStroke } = await import("@/lib/image/editor");
          drawEraserStroke(drawingCanvas, [pos, pos], brushSize);
        } else {
          const { drawBrushStroke } = await import("@/lib/image/editor");
          drawBrushStroke(drawingCanvas, [pos, pos], brushSize, brushColor, brushOpacity, blendMode);
        }
      }
      return;
    }

    if (e.button === 1 || e.altKey || e.pointerType === "touch") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  }, [eyedropperActive, displayCanvas, zoom, panX, panY, setEyedropperColor, activeTool, drawingCanvas, drawTool, brushSize, brushColor, brushOpacity, cloneSampled, setCloneSrc, getCanvasPos]);

  const handlePointerMove = useCallback(async (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      return;
    }

    if (activeTool === "draw" && isDrawing.current && drawingCanvas && renderedCanvas) {
      const pos = getCanvasPos(e.clientX, e.clientY);

      if (drawTool === "clone" && cloneSampled) {
        const newPoints = [...drawPoints.current, pos];
        drawPoints.current = newPoints;
        const ctx = drawingCanvas.getContext("2d")!;
        const srcData = renderedCanvas.getContext("2d")!.getImageData(0, 0, renderedCanvas.width, renderedCanvas.height);
        const dstData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const dx = pos.x - drawPoints.current[drawPoints.current.length - 2].x;
        const dy = pos.y - drawPoints.current[drawPoints.current.length - 2].y;
        const { applyCloneStamp } = await import("@/lib/image/editor");
        applyCloneStamp(dstData, renderedCanvas, cloneSrcX + dx, cloneSrcY + dy, pos.x, pos.y, brushSize, brushOpacity);
        ctx.putImageData(dstData, 0, 0);
        return;
      }

      if (drawTool === "brush" || drawTool === "eraser") {
        const newPoints = [...drawPoints.current, pos];
        drawPoints.current = newPoints;
        const lastP = drawPoints.current[drawPoints.current.length - 2];
        if (drawTool === "eraser") {
          const { drawEraserStroke } = await import("@/lib/image/editor");
          drawEraserStroke(drawingCanvas, [lastP, pos], brushSize);
        } else {
          const { drawBrushStroke } = await import("@/lib/image/editor");
          drawBrushStroke(drawingCanvas, [lastP, pos], brushSize, brushColor, brushOpacity, blendMode);
        }
        return;
      }

      if (drawTool === "blur" || drawTool === "sharpen" || drawTool === "redeye") {
        if (rafThrottle.current) return;
        rafThrottle.current = requestAnimationFrame(async () => {
          rafThrottle.current = null;
          const ctx = renderedCanvas.getContext("2d")!;
          const imageData = ctx.getImageData(0, 0, renderedCanvas.width, renderedCanvas.height);
          if (drawTool === "blur") {
            const { applyBlurBrush } = await import("@/lib/image/editor");
            applyBlurBrush(imageData, pos.x, pos.y, brushSize, brushOpacity);
          } else if (drawTool === "sharpen") {
            const { applySharpenBrush } = await import("@/lib/image/editor");
            applySharpenBrush(imageData, pos.x, pos.y, brushSize, brushOpacity);
          } else {
            const { applyRedEye } = await import("@/lib/image/editor");
            applyRedEye(imageData, pos.x, pos.y, brushSize, brushOpacity);
          }
          ctx.putImageData(imageData, 0, 0);
          useImageEditorStore.getState().reRender();
        });
        return;
      }
    }
  }, [isPanning, panStart, setPan, activeTool, drawingCanvas, renderedCanvas, drawTool, brushSize, brushColor, brushOpacity, cloneSampled, cloneSrcX, cloneSrcY, getCanvasPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (activeTool === "draw" && isDrawing.current && drawPoints.current.length > 0) {
      isDrawing.current = false;
      if (drawTool !== "blur" && drawTool !== "sharpen") {
        useImageEditorStore.getState().addDrawingEntry({ id: crypto.randomUUID(), tool: drawTool as any, data: {} });
      }
    }
    drawPoints.current = [];
    shapeStart.current = null;
  }, [isPanning, activeTool, drawTool]);

  // Touch pinch-zoom + pan
  const prevTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      prevTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && activeTool !== "draw") {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
    }
  }, [activeTool, panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        setZoom(zoom * scale);
      }
      lastPinchDist.current = dist;

      // Two-finger pan
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      if (prevTouchCenter.current) {
        setPan(panX + (center.x - prevTouchCenter.current.x), panY + (center.y - prevTouchCenter.current.y));
      }
      prevTouchCenter.current = center;
    } else if (e.touches.length === 1 && isPanning && activeTool !== "draw") {
      setPan(e.touches[0].clientX - panStart.x, e.touches[0].clientY - panStart.y);
    }
  }, [zoom, setZoom, panX, panY, setPan, isPanning, panStart, activeTool]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    prevTouchCenter.current = null;
    lastPinchDist.current = 0;
  }, []);

  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container || !displayCanvas) return;
    const scale = Math.min(container.clientWidth / displayCanvas.width, container.clientHeight / displayCanvas.height, 1);
    setZoom(scale); setPan(0, 0);
  }, [displayCanvas, setZoom, setPan]);

  useEffect(() => { fitToContainer(); window.addEventListener("resize", fitToContainer); return () => window.removeEventListener("resize", fitToContainer); }, [displayCanvas, fitToContainer]);

  if (!displayCanvas) return null;

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden bg-[#0a0a0f] relative select-none touch-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isPanning ? "grabbing" : eyedropperActive ? "crosshair" : activeTool === "draw" ? "crosshair" : "grab" }}
    >
      <div style={{ transform: `translate(${panX}px, ${panY}px)` }} className="relative">
        <canvas ref={canvasRef} className="block" />
        <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
      </div>

      {/* Image info overlay */}
      {showImageInfo && (
        <div className="absolute top-3 left-3 glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-secondary font-mono space-y-0.5">
          <div>{originalWidth} × {originalHeight}px</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
        </div>
      )}

      {/* Eyedropper color display */}
      {eyedropperActive && (
        <div className="absolute top-3 right-3 glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-secondary font-mono flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-border-subtle" style={{ backgroundColor: useImageEditorStore.getState().eyedropperColor?.hex || "#000" }} />
          <span>{useImageEditorStore.getState().eyedropperColor?.hex || "Click to sample"}</span>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 glass px-2 py-1 rounded-lg text-[10px] text-text-tertiary">
        <button onClick={() => setZoom(zoom / 1.2)} className="px-1 hover:text-text-primary">−</button>
        <span className="tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom * 1.2)} className="px-1 hover:text-text-primary">+</button>
        <button onClick={fitToContainer} className="px-1 hover:text-text-primary">Fit</button>
        <button onClick={() => setZoom(1)} className="px-1 hover:text-text-primary">1:1</button>
      </div>
    </div>
  );
}
