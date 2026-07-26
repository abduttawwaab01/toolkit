"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PdfPage } from "./pdf-page";
import { DocxPage } from "./docx-page";
import { VisualToolbar } from "./visual-toolbar";
import { renderPageThumbnail, exportVisualAsPdf } from "@/lib/pdf-service";
import type { VisualDocumentData, VisualEdit } from "@/types/document";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface VisualEditorProps {
  documentId: string;
  title: string;
  visualData: VisualDocumentData;
  onUpdateEdits: (edits: VisualEdit[]) => void;
  onExport?: (blob: Blob, filename: string) => void;
}

export function VisualEditor({ documentId, title, visualData, onUpdateEdits, onExport }: VisualEditorProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState<VisualEdit[]>(visualData.edits || []);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const scale = zoom / 100;
  const totalPages = visualData.pageCount;
  const isPdf = visualData.sourceType === "pdf";
  const isDocx = visualData.sourceType === "docx";

  const pdfBytesRef = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    if (isPdf && visualData.originalBase64) {
      try {
        const clean = visualData.originalBase64.includes(",")
          ? visualData.originalBase64.split(",")[1]
          : visualData.originalBase64;
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        pdfBytesRef.current = bytes.buffer;
      } catch {
        console.error("Failed to decode PDF bytes");
      }
    }
  }, [isPdf, visualData.originalBase64]);

  useEffect(() => {
    if (!isPdf || !pdfBytesRef.current) return;

    let cancelled = false;
    async function loadThumbnails() {
      const thumbs = new Map<number, string>();
      for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        if (cancelled) break;
        try {
          const thumb = await renderPageThumbnail(pdfBytesRef.current!, i, 120);
          thumbs.set(i, thumb);
        } catch {
          // skip failed thumbnails
        }
      }
      if (!cancelled) setThumbnails(thumbs);
    }
    loadThumbnails();
    return () => { cancelled = true; };
  }, [isPdf, totalPages]);

  const handleEdit = useCallback(
    (edit: VisualEdit) => {
      setEdits((prev) => {
        const existing = prev.findIndex((e) => e.itemId === edit.itemId && e.pageNumber === edit.pageNumber);
        const next = [...prev];
        if (existing >= 0) {
          next[existing] = edit;
        } else {
          next.push(edit);
        }
        onUpdateEdits(next);
        return next;
      });
    },
    [onUpdateEdits],
  );

  const handleExport = useCallback(async () => {
    if (!isPdf) return;

    try {
      const blob = await exportVisualAsPdf(visualData.originalBase64, edits);
      const filename = `${title.replace(/\.[^.]+$/, "")}_edited.pdf`;
      if (onExport) {
        onExport(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [isPdf, visualData.originalBase64, edits, title, onExport]);

  const scrollToPage = useCallback(
    (pageNum: number) => {
      const el = document.getElementById(`visual-page-${pageNum}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      scrollToPage(page);
    },
    [scrollToPage],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const children = container.querySelectorAll("[data-page-number]");
      const containerRect = container.getBoundingClientRect();
      const center = containerRect.top + containerRect.height / 2;

      let closest = 1;
      let minDist = Infinity;
      children.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - center);
        if (dist < minDist) {
          minDist = dist;
          closest = parseInt(el.getAttribute("data-page-number") || "1", 10);
        }
      });
      setCurrentPage(closest);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <VisualToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        editMode={editMode}
        onPageChange={handlePageChange}
        onZoomChange={setZoom}
        onToggleEditMode={() => setEditMode((p) => !p)}
        onExport={isPdf ? handleExport : undefined as any}
        editCount={edits.length}
      />

      <div className="flex flex-1 min-h-0">
        {/* Thumbnail sidebar */}
        {totalPages > 1 && (
          <div className="w-[100px] border-r border-border-subtle overflow-y-auto py-2 px-2 space-y-2 shrink-0 hidden md:block">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`block w-full rounded-md overflow-hidden border-2 transition-all ${
                  currentPage === pageNum
                    ? "border-neon-cyan shadow-[0_0_8px_rgba(0,245,212,0.3)]"
                    : "border-border-subtle hover:border-text-tertiary"
                }`}
              >
                {thumbnails.has(pageNum) ? (
                  <img
                    src={thumbnails.get(pageNum)}
                    alt={`Page ${pageNum}`}
                    className="w-full h-auto block"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-surface-elevated flex items-center justify-center">
                    <span className="text-[9px] text-text-tertiary">{pageNum}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main content area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto bg-[#e8e8e8] p-6"
        >
          <div className="flex flex-col items-center gap-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                id={`visual-page-${pageNum}`}
                data-page-number={pageNum}
              >
                {isPdf && pdfBytesRef.current ? (
                  <PdfPage
                    pdfBytes={pdfBytesRef.current}
                    pageNumber={pageNum}
                    scale={scale}
                    editMode={editMode}
                    edits={edits.filter((e) => e.pageNumber === pageNum)}
                    onEdit={handleEdit}
                  />
                ) : isDocx && visualData.pages[pageNum - 1] ? (
                  <DocxPage
                    page={visualData.pages[pageNum - 1]}
                    pageNumber={pageNum}
                    scale={scale}
                    editMode={editMode}
                    edits={edits.filter((e) => e.pageNumber === pageNum)}
                    onEdit={handleEdit}
                  />
                ) : (
                  <div className="w-[595px] h-[842px] bg-white shadow-lg flex items-center justify-center">
                    <span className="text-sm text-text-tertiary">Loading page {pageNum}...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
