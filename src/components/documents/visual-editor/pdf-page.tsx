"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { renderPageToCanvas, extractTextItems } from "@/lib/pdf-service";
import { TextLayer } from "./text-layer";
import type { VisualTextItem, VisualEdit } from "@/types/document";

interface PdfPageProps {
  pdfBytes: ArrayBuffer;
  pageNumber: number;
  scale: number;
  editMode: boolean;
  edits: VisualEdit[];
  onEdit: (edit: VisualEdit) => void;
}

export function PdfPage({ pdfBytes, pageNumber, scale, editMode, edits, onEdit }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textItems, setTextItems] = useState<VisualTextItem[]>([]);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setRendering(true);
      try {
        const canvas = await renderPageToCanvas(pdfBytes, pageNumber, scale, canvasRef.current || undefined);
        if (cancelled) return;
        canvasRef.current = canvas;

        const { items, width, height } = await extractTextItems(pdfBytes, pageNumber);
        if (cancelled) return;
        setTextItems(items);
        setPageDimensions({ width, height });
      } catch (err) {
        console.error("Failed to render PDF page:", err);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [pdfBytes, pageNumber, scale]);

  return (
    <div
      className="relative inline-block shadow-lg rounded-sm overflow-hidden"
      style={{
        width: pageDimensions.width * scale || "auto",
        height: pageDimensions.height * scale || "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: pageDimensions.width * scale || undefined,
          height: pageDimensions.height * scale || undefined,
        }}
      />
      {!rendering && pageDimensions.width > 0 && (
        <TextLayer
          items={textItems}
          pageNumber={pageNumber}
          pageWidth={pageDimensions.width}
          pageHeight={pageDimensions.height}
          scale={scale}
          editMode={editMode}
          edits={edits}
          onEdit={onEdit}
        />
      )}
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-xs text-text-tertiary animate-pulse">Rendering page {pageNumber}...</div>
        </div>
      )}
    </div>
  );
}
