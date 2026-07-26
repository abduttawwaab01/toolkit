"use client";

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Edit3, Eye, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisualToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  editMode: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onToggleEditMode: () => void;
  onExport: () => void;
  editCount: number;
}

export function VisualToolbar({
  currentPage,
  totalPages,
  zoom,
  editMode,
  onPageChange,
  onZoomChange,
  onToggleEditMode,
  onExport,
  editCount,
}: VisualToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 glass border-b border-border-subtle">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-[11px] font-mono text-text-secondary tabular-nums min-w-[60px] text-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={14} />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onZoomChange(Math.max(25, zoom - 25))}
          disabled={zoom <= 25}
        >
          <ZoomOut size={14} />
        </Button>
        <button
          onClick={() => onZoomChange(100)}
          className="text-[10px] font-mono text-text-tertiary hover:text-text-primary px-1.5 py-0.5 rounded transition-colors"
        >
          {zoom}%
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onZoomChange(Math.min(400, zoom + 25))}
          disabled={zoom >= 400}
        >
          <ZoomIn size={14} />
        </Button>
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onZoomChange(100)}
          title="Reset zoom"
        >
          <Maximize2 size={14} />
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        {editCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan font-medium">
            {editCount} edit{editCount !== 1 ? "s" : ""}
          </span>
        )}
        <Button
          variant={editMode ? "neon" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-[10px]"
          onClick={onToggleEditMode}
        >
          {editMode ? <Edit3 size={12} /> : <Eye size={12} />}
          {editMode ? "Editing" : "View"}
        </Button>
        <Button variant="neon" size="sm" className="h-7 gap-1 text-[10px]" onClick={onExport}>
          <Download size={12} />
          Export
        </Button>
      </div>
    </div>
  );
}
