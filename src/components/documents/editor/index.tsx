"use client";

import dynamic from "next/dynamic";
import type { DocumentFormat, VisualDocumentData, VisualEdit } from "@/types/document";

const RichEditor = dynamic(
  () => import("./rich-editor").then((m) => ({ default: m.RichEditor })),
  { ssr: false },
);

const MarkdownEditor = dynamic(
  () => import("./markdown-editor").then((m) => ({ default: m.MarkdownEditor })),
  { ssr: false },
);

const TextEditor = dynamic(
  () => import("./text-editor").then((m) => ({ default: m.TextEditor })),
  { ssr: false },
);

const VisualEditor = dynamic(
  () => import("../visual-editor").then((m) => ({ default: m.VisualEditor })),
  { ssr: false },
);

interface EditorProps {
  documentId: string;
  format: DocumentFormat;
  initialContent?: Record<string, unknown> | string;
  onUpdate?: (content: Record<string, unknown> | string) => void;
  editable?: boolean;
  visualData?: VisualDocumentData;
  onUpdateEdits?: (edits: VisualEdit[]) => void;
  onExportVisual?: (blob: Blob, filename: string) => void;
}

export function Editor({
  documentId,
  format,
  initialContent,
  onUpdate,
  editable = true,
  visualData,
  onUpdateEdits,
  onExportVisual,
}: EditorProps) {
  switch (format) {
    case "visual":
      if (!visualData) return <div className="p-4 text-text-tertiary">No visual data available</div>;
      return (
        <VisualEditor
          documentId={documentId}
          title={visualData.pages[0] ? "Document" : "Document"}
          visualData={visualData}
          onUpdateEdits={onUpdateEdits || (() => {})}
          onExport={onExportVisual}
        />
      );

    case "rich":
      return (
        <RichEditor
          documentId={documentId}
          initialContent={
            typeof initialContent === "object" && initialContent !== null
              ? (initialContent as Record<string, unknown>)
              : undefined
          }
          onUpdate={
            onUpdate as (content: Record<string, unknown>) => void
          }
          editable={editable}
        />
      );

    case "markdown":
      return (
        <MarkdownEditor
          documentId={documentId}
          initialContent={
            typeof initialContent === "string"
              ? initialContent
              : typeof initialContent === "object" && initialContent !== null
                ? JSON.stringify(initialContent, null, 2)
                : ""
          }
          onUpdate={onUpdate as (markdown: string) => void}
          editable={editable}
        />
      );

    case "html":
    case "text":
      return (
        <TextEditor
          documentId={documentId}
          initialContent={
            typeof initialContent === "string"
              ? initialContent
              : typeof initialContent === "object" && initialContent !== null
                ? JSON.stringify(initialContent, null, 2)
                : ""
          }
          onUpdate={onUpdate as (text: string) => void}
          editable={editable}
        />
      );

    default:
      return (
        <RichEditor
          documentId={documentId}
          initialContent={
            typeof initialContent === "object" && initialContent !== null
              ? (initialContent as Record<string, unknown>)
              : undefined
          }
          onUpdate={
            onUpdate as (content: Record<string, unknown>) => void
          }
          editable={editable}
        />
      );
  }
}
