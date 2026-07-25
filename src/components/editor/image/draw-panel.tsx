"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useImageEditorStore } from "@/lib/image-editor-store";
import { drawBrushStroke, drawEraserStroke, drawShape, drawTextOnCanvas } from "@/lib/image/editor";

const COLORS = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff6b35", "#4facfe", "#bf6aff", "#ff006e", "#a67c52", "#888888"];

const FONTS = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Impact", "Comic Sans MS"];

export function DrawPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingText, setDrawingText] = useState(false);
  const [textInput, setTextInput] = useState("");

  const displayCanvas = useImageEditorStore((s) => s.displayCanvas);
  const drawTool = useImageEditorStore((s) => s.drawTool);
  const brushSize = useImageEditorStore((s) => s.brushSize);
  const brushColor = useImageEditorStore((s) => s.brushColor);
  const brushOpacity = useImageEditorStore((s) => s.brushOpacity);
  const setDrawTool = useImageEditorStore((s) => s.setDrawTool);
  const setBrushSize = useImageEditorStore((s) => s.setBrushSize);
  const setBrushColor = useImageEditorStore((s) => s.setBrushColor);
  const setBrushOpacity = useImageEditorStore((s) => s.setBrushOpacity);
  const shapeFill = useImageEditorStore((s) => s.shapeFill);
  const shapeStroke = useImageEditorStore((s) => s.shapeStroke);
  const shapeStrokeWidth = useImageEditorStore((s) => s.shapeStrokeWidth);
  const textFont = useImageEditorStore((s) => s.textFont);
  const textSize = useImageEditorStore((s) => s.textSize);
  const drawingCanvas = useImageEditorStore((s) => s.drawingCanvas);
  const zoom = useImageEditorStore((s) => s.zoom);
  const setShapeStrokeWidth = useImageEditorStore((s) => s.setShapeStrokeWidth);
  const setShapeFill = useImageEditorStore((s) => s.setShapeFill);
  const setShapeStroke = useImageEditorStore((s) => s.setShapeStroke);
  const setTextFont = useImageEditorStore((s) => s.setTextFont);
  const setTextSize = useImageEditorStore((s) => s.setTextSize);
  const clearDrawingEntries = useImageEditorStore((s) => s.clearDrawingEntries);

  const getPos = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!drawingCanvas) return;
    const pos = getPos(e);
    if (drawTool === "text") {
      setDrawingText(true);
      setShapeStart(pos);
      return;
    }
    if (["rect", "circle", "line", "arrow"].includes(drawTool)) {
      setShapeStart(pos);
      return;
    }
    setIsDrawing(true);
    setPoints([pos]);
  }, [drawingCanvas, drawTool, getPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawingCanvas) return;
    const pos = getPos(e);
    if (isDrawing && (drawTool === "brush" || drawTool === "eraser")) {
      const newPoints = [...points, pos];
      setPoints(newPoints);
      const ctx = drawingCanvas.getContext("2d")!;
      if (drawTool === "eraser") {
        drawEraserStroke(drawingCanvas, [points[points.length - 1], pos], brushSize * zoom);
      } else {
        drawBrushStroke(drawingCanvas, [points[points.length - 1], pos], brushSize * zoom, brushColor, brushOpacity);
      }
    }
  }, [drawingCanvas, isDrawing, drawTool, points, brushSize, brushColor, brushOpacity, zoom, getPos]);

  const handlePointerUp = useCallback(() => {
    if (drawingCanvas && isDrawing && points.length > 0) {
      const store = useImageEditorStore.getState();
      store.addDrawingEntry({ id: crypto.randomUUID(), tool: drawTool as any, data: {} });
    }
    setIsDrawing(false);
    setPoints([]);
  }, [drawingCanvas, isDrawing, points, drawTool]);

  const commitText = useCallback(() => {
    if (!drawingCanvas || !shapeStart || !textInput) return;
    drawTextOnCanvas(drawingCanvas, textInput, shapeStart.x, shapeStart.y, textFont, textSize * zoom, brushColor, brushOpacity);
    const store = useImageEditorStore.getState();
    store.addDrawingEntry({ id: crypto.randomUUID(), tool: "text", data: { text: textInput, font: textFont, fontSize: textSize } });
    setTextInput("");
    setDrawingText(false);
    setShapeStart(null);
  }, [drawingCanvas, shapeStart, textInput, textFont, textSize, brushColor, brushOpacity, zoom]);

  const clearDrawing = useCallback(() => {
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    clearDrawingEntries();
  }, [drawingCanvas, clearDrawingEntries]);

  useEffect(() => {
    if (!canvasRef.current || !drawingCanvas) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(drawingCanvas, 0, 0);
  }, [drawingCanvas]);

  const tools = [
    { id: "brush", label: "Brush", icon: "✏️" },
    { id: "eraser", label: "Eraser", icon: "🧹" },
    { id: "rect", label: "Rect", icon: "▭" },
    { id: "circle", label: "Circle", icon: "○" },
    { id: "line", label: "Line", icon: "╱" },
    { id: "arrow", label: "Arrow", icon: "→" },
    { id: "text", label: "Text", icon: "T" },
  ] as const;

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Draw</h3>

      <div className="flex gap-1 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setDrawTool(t.id as any)}
            className={`px-2 py-1.5 rounded-lg text-[10px] transition-all flex items-center gap-1 ${
              drawTool === t.id ? "bg-neon-cyan/15 text-neon-cyan" : "glass text-text-tertiary hover:text-text-primary"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {drawTool === "brush" || drawTool === "eraser" ? (
        <>
          <div>
            <label className="text-[10px] text-text-tertiary">Size: {brushSize}px</label>
            <input type="range" min={1} max={100} value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-neon-cyan h-1 mt-1"
            />
          </div>
          {drawTool === "brush" && (
            <>
              <div>
                <label className="text-[10px] text-text-tertiary">Opacity: {Math.round(brushOpacity * 100)}%</label>
                <input type="range" min={0} max={100} value={brushOpacity * 100}
                  onChange={(e) => setBrushOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-neon-cyan h-1 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary mb-1 block">Color</label>
                <div className="flex flex-wrap gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className="w-6 h-6 rounded-full border border-border-subtle transition-transform active:scale-90"
                      style={{ backgroundColor: c, outline: brushColor === c ? "2px solid #4facfe" : undefined, outlineOffset: 2 }}
                    />
                  ))}
                  <input type="color" value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </>
      ) : null}

      {["rect", "circle", "line", "arrow"].includes(drawTool) && (
        <>
          <div>
            <label className="text-[10px] text-text-tertiary">Stroke Width: {shapeStrokeWidth}px</label>
            <input type="range" min={1} max={20} value={shapeStrokeWidth}
              onChange={(e) => setShapeStrokeWidth(Number(e.target.value))}
              className="w-full accent-neon-cyan h-1 mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary mb-1 block">Stroke Color</label>
            <input type="color" value={shapeStroke}
              onChange={(e) => setShapeStroke(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        </>
      )}

      {drawingText && (
        <div className="space-y-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type text..."
            className="w-full glass rounded-lg px-2.5 py-2 text-xs min-h-[60px] focus:outline-none focus:border-neon-cyan/30"
          />
          <div className="flex gap-2">
            <select value={textFont}
              onChange={(e) => setTextFont(e.target.value)}
              className="flex-1 glass rounded-lg px-2 py-1 text-[10px]"
            >
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="number" value={textSize} min={8} max={200}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="w-16 glass rounded-lg px-2 py-1 text-[10px]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={commitText} className="flex-1 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg px-3 py-1.5 text-[10px] font-medium">
              Add Text
            </button>
            <button onClick={() => setDrawingText(false)} className="glass rounded-lg px-3 py-1.5 text-[10px] text-text-tertiary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <button onClick={clearDrawing} className="w-full glass rounded-lg px-3 py-1.5 text-[10px] text-text-tertiary hover:text-neon-pink transition-all">
        Clear Drawing
      </button>
    </div>
  );
}
