"use client";

import { useCallback, useRef, useState } from "react";
import type { VisualTextItem, VisualEdit } from "@/types/document";

interface TextLayerProps {
  items: VisualTextItem[];
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  editMode: boolean;
  edits: VisualEdit[];
  onEdit: (edit: VisualEdit) => void;
}

export function TextLayer({
  items,
  pageNumber,
  pageWidth,
  pageHeight,
  scale,
  editMode,
  edits,
  onEdit,
}: TextLayerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const getEditForItem = useCallback(
    (itemId: string) => edits.find((e) => e.itemId === itemId && e.pageNumber === pageNumber),
    [edits, pageNumber],
  );

  const handleBlur = useCallback(
    (item: VisualTextItem, el: HTMLSpanElement) => {
      const newText = el.textContent || "";
      setEditingId(null);

      if (newText !== item.text) {
        const existing = getEditForItem(item.id);
        onEdit({
          id: existing?.id || `edit_${Date.now()}_${item.id}`,
          pageNumber,
          itemId: item.id,
          originalText: item.text,
          newText,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [pageNumber, onEdit, getEditForItem],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Escape") {
        e.currentTarget.blur();
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        pointerEvents: editMode ? "auto" : "none",
      }}
    >
      {items.map((item) => {
        const edit = getEditForItem(item.id);
        const displayText = edit ? edit.newText : item.text;
        const isEditing = editingId === item.id;

        const left = (item.x / pageWidth) * 100;
        const top = (item.y / pageHeight) * 100;
        const width = (item.width / pageWidth) * 100;
        const height = (item.height / pageHeight) * 100;

        return (
          <span
            key={item.id}
            contentEditable={editMode}
            suppressContentEditableWarning
            className={`absolute whitespace-pre overflow-hidden text-transparent selection:bg-neon-cyan/20 ${
              editMode ? "cursor-text hover:bg-yellow-400/10 rounded-sm" : ""
            } ${isEditing ? "bg-yellow-400/10 ring-1 ring-neon-cyan/30" : ""} ${
              edit && !isEditing ? "bg-neon-cyan/5 border-b border-dashed border-neon-cyan/40" : ""
            }`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              fontSize: `${item.fontSize * scale}px`,
              fontFamily: item.fontName || "sans-serif",
              fontWeight: item.fontWeight || "normal",
              fontStyle: item.fontStyle || "normal",
              lineHeight: 1,
              transformOrigin: "left top",
            }}
            onFocus={() => setEditingId(item.id)}
            onBlur={(e) => handleBlur(item, e.currentTarget)}
            onKeyDown={handleKeyDown}
          >
            {displayText}
          </span>
        );
      })}
    </div>
  );
}
