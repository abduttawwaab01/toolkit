"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/toast/toast";
import { removeObjectAI, maskCanvasToBlob } from "@/lib/ai/object-removal";
import { Eraser, Undo2, Redo2, ZoomIn, ZoomOut, Brush, Upload, Download } from "lucide-react";

interface ObjectRemovalPanelProps {
  imageUrl?: string;
  onApply?: (resultUrl: string) => void;
}

export function ObjectRemovalPanel({ imageUrl: initialImageUrl, onApply }: ObjectRemovalPanelProps) {
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image onto canvas
  const loadImage = useCallback((url: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;

      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !maskCanvas || !overlay) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      maskCanvas.width = img.naturalWidth;
      maskCanvas.height = img.naturalHeight;
      overlay.width = img.naturalWidth;
      overlay.height = img.naturalHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.fillStyle = "#000";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Save initial state
      const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      setHistory([imageData]);
      setHistoryIndex(0);
      setResultUrl(null);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    if (initialImageUrl) loadImage(initialImageUrl);
  }, [initialImageUrl, loadImage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please select an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    loadImage(url);
  }, [loadImage, toast]);

  // Drawing
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawMask = useCallback((x: number, y: number) => {
    const maskCanvas = maskCanvasRef.current;
    const overlay = overlayRef.current;
    if (!maskCanvas || !overlay) return;

    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.globalCompositeOperation = "source-over";
    maskCtx.fillStyle = "#fff";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();

    // Draw overlay visualization
    const overlayCtx = overlay.getContext("2d")!;
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    overlayCtx.fillStyle = "rgba(255, 0, 100, 0.4)";
    overlayCtx.beginPath();
    overlayCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    overlayCtx.fill();
  }, [brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    drawMask(x, y);
  }, [getCanvasCoords, drawMask]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    drawMask(x, y);
  }, [isDrawing, getCanvasCoords, drawMask]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save to history
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext("2d")!;
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Clear overlay
    const overlay = overlayRef.current;
    if (overlay) {
      const overlayCtx = overlay.getContext("2d")!;
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }, [isDrawing, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "#000";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    const overlay = overlayRef.current;
    if (overlay) {
      const overlayCtx = overlay.getContext("2d")!;
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }, [history, historyIndex]);

  const handleRemove = useCallback(async () => {
    if (!imageUrl || !maskCanvasRef.current) return;

    const fileInput = fileInputRef.current;
    const maskCanvas = maskCanvasRef.current;

    // Check if mask has any white pixels
    const maskCtx = maskCanvas.getContext("2d")!;
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const hasMask = maskData.data.some((v, i) => i % 4 === 0 && v > 0);
    if (!hasMask) {
      toast.error("No mask", "Draw on the image to mark areas for removal");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      // Convert image URL to File
      const imgResponse = await fetch(imageUrl);
      const imgBlob = await imgResponse.blob();
      const imgFile = new File([imgBlob], "image.png", { type: "image/png" });

      const maskBlob = await maskCanvasToBlob(maskCanvas);

      const result = await removeObjectAI(imgFile, maskBlob, {
        onProgress: setProgress,
      });

      setResultUrl(result.image);
      toast.success("Objects removed", "AI successfully removed marked objects");
    } catch (error: any) {
      toast.error("Removal failed", error.message || "Could not remove objects");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [imageUrl, toast]);

  const handleApply = useCallback(() => {
    if (resultUrl && onApply) {
      onApply(resultUrl);
    }
  }, [resultUrl, onApply]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "object-removed.png";
    a.click();
  }, [resultUrl]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Eraser size={12} className="text-neon-cyan" />
          <span className="text-[10px] font-medium text-text-primary">AI Object Removal</span>
        </div>
        <div className="flex gap-1">
          <button onClick={undo} disabled={historyIndex <= 0}
            className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all disabled:opacity-30">
            <Undo2 size={10} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}
            className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all disabled:opacity-30">
            <Redo2 size={10} />
          </button>
          <button onClick={clearMask}
            className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
            <span className="text-[8px]">CLR</span>
          </button>
        </div>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        Paint over objects you want to remove. The AI (LaMa inpainting) will intelligently fill in the area.
      </p>

      {/* Brush size */}
      <div>
        <div className="flex justify-between text-[9px] mb-0.5">
          <span className="text-text-secondary flex items-center gap-1"><Brush size={8} /> Brush Size</span>
          <span className="text-text-primary font-mono">{brushSize}px</span>
        </div>
        <input type="range" min={2} max={100} value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full accent-neon-cyan h-1" />
      </div>

      {/* Zoom */}
      <div className="flex gap-1">
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary">
          <ZoomOut size={10} />
        </button>
        <span className="text-[9px] text-text-tertiary self-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="size-6 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary">
          <ZoomIn size={10} />
        </button>
      </div>

      {/* Canvas area */}
      <div className="glass rounded-xl overflow-hidden relative" style={{ maxHeight: 300 }}>
        <div className="overflow-auto" style={{ maxHeight: 300 }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block" }}>
            <canvas ref={canvasRef} className="block" style={{ imageRendering: "auto" }} />
            <canvas ref={maskCanvasRef} className="hidden" />
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {processing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <span className="size-6 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin mb-2" />
            <span className="text-[10px] text-neon-cyan">Removing objects... {progress}%</span>
          </div>
        )}
      </div>

      {/* Result preview */}
      {resultUrl && (
        <div className="space-y-2">
          <div className="glass rounded-lg p-2 flex items-center gap-2">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/30">
              <img src={resultUrl} alt="Result" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-primary font-medium">Objects Removed</p>
              <p className="text-[8px] text-text-tertiary">Ready to apply or download</p>
            </div>
          </div>

          <div className="flex gap-1">
            <button onClick={handleApply}
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

      {/* File input (hidden) */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {!imageUrl && (
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all">
          <Upload size={12} className="text-text-secondary" />
          <span className="text-[10px] text-text-secondary">Select Image</span>
        </button>
      )}
    </div>
  );
}
