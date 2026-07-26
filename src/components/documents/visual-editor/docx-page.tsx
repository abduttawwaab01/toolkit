"use client";

import { useCallback, useRef, useState } from "react";
import type { VisualPage, VisualEdit } from "@/types/document";

interface DocxPageProps {
  page: VisualPage;
  pageNumber: number;
  scale: number;
  editMode: boolean;
  edits: VisualEdit[];
  onEdit: (edit: VisualEdit) => void;
}

export function DocxPage({ page, pageNumber, scale, editMode, edits, onEdit }: DocxPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const getPageEdit = useCallback(
    (itemId: string) => edits.find((e) => e.itemId === itemId && e.pageNumber === pageNumber),
    [edits, pageNumber],
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (!editMode) return;
      const container = containerRef.current;
      if (!container) return;

      const editableElements = container.querySelectorAll("[data-visual-item]");
      editableElements.forEach((el) => {
        const itemId = el.getAttribute("data-visual-item");
        if (!itemId) return;

        const originalItem = page.textItems.find((t) => t.id === itemId);
        if (!originalItem) return;

        const currentText = el.textContent || "";
        const existing = getPageEdit(itemId);

        if (currentText !== originalItem.text) {
          onEdit({
            id: existing?.id || `edit_${Date.now()}_${itemId}`,
            pageNumber,
            itemId,
            originalText: originalItem.text,
            newText: currentText,
            timestamp: new Date().toISOString(),
          });
        }
      });
    },
    [editMode, page.textItems, pageNumber, onEdit, getPageEdit],
  );

  const htmlContent = page.htmlContent || "";

  return (
    <div
      className="relative inline-block shadow-lg rounded-sm overflow-hidden bg-white"
      style={{
        width: page.width * scale,
        minHeight: page.height * scale,
      }}
    >
      <div
        ref={containerRef}
        className="p-8 text-sm text-gray-900 leading-relaxed"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          minHeight: page.height,
        }}
        contentEditable={editMode}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {editMode && (
        <div className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">
          Click text to edit
        </div>
      )}
    </div>
  );
}
