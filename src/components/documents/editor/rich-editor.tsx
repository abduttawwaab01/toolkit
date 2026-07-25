"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { CodeBlock } from "@tiptap/extension-code-block";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
  Highlighter,
  Palette,
} from "lucide-react";
import { useDocumentStore } from "@/lib/document-store";
import { cn } from "@/lib/utils";

interface RichEditorProps {
  documentId: string;
  initialContent?: Record<string, unknown>;
  onUpdate?: (content: Record<string, unknown>) => void;
  editable?: boolean;
}

function ToolbarBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50",
        "disabled:pointer-events-none disabled:opacity-30",
        active
          ? "bg-neon-cyan/15 text-neon-cyan shadow-[0_0_12px_rgba(0,245,212,0.15)]"
          : "text-text-secondary hover:text-text-primary hover:bg-white/5",
      )}
    >
      <Icon className="size-4" />
    </motion.button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-white/10 mx-1.5" />;
}

export function RichEditor({
  documentId,
  initialContent,
  onUpdate,
  editable = true,
}: RichEditorProps) {
  const {
    setEditorContent,
    setRawContent,
    setIsDirty,
    setWordCount,
    setCharCount,
    isSaving,
    lastSaved,
  } = useDocumentStore();

  const wordCountRef = useRef(0);
  const charCountRef = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TextStyle,
      Color,
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-neon-cyan underline" },
      }),
      CodeBlock,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-full px-8 py-6",
      },
    },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
      const text = e.getText();
      const words = text
        .split(/\s+/)
        .filter((w: string) => w.length > 0).length;
      const chars = text.length;

      wordCountRef.current = words;
      charCountRef.current = chars;

      setEditorContent(json as Record<string, unknown>);
      setRawContent(text);
      setIsDirty(true);
      setWordCount(words);
      setCharCount(chars);
      onUpdate?.(json as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent as Parameters<typeof editor.commands.setContent>[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL", "https://");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const groups = [
    [
      {
        icon: Undo2,
        label: "Undo",
        onClick: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
      },
      {
        icon: Redo2,
        label: "Redo",
        onClick: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
      },
    ],
    [
      {
        icon: Bold,
        label: "Bold",
        onClick: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
      },
      {
        icon: Italic,
        label: "Italic",
        onClick: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
      },
      {
        icon: UnderlineIcon,
        label: "Underline",
        onClick: () => editor.chain().focus().toggleUnderline().run(),
        active: editor.isActive("underline"),
      },
      {
        icon: Strikethrough,
        label: "Strikethrough",
        onClick: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive("strike"),
      },
      {
        icon: Code,
        label: "Inline Code",
        onClick: () => editor.chain().focus().toggleCode().run(),
        active: editor.isActive("code"),
      },
      {
        icon: Highlighter,
        label: "Highlight",
        onClick: () => editor.chain().focus().toggleHighlight().run(),
        active: editor.isActive("highlight"),
      },
      {
        icon: Palette,
        label: "Text Color",
        onClick: () => {
          const color = window.prompt("Color (hex)", "#00f5d4");
          if (color) editor.chain().focus().setColor(color).run();
        },
        active: editor.isActive("textStyle"),
      },
    ],
    [
      {
        icon: Heading1,
        label: "Heading 1",
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
      },
      {
        icon: Heading2,
        label: "Heading 2",
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
      },
      {
        icon: Heading3,
        label: "Heading 3",
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: List,
        label: "Bullet List",
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      },
      {
        icon: ListOrdered,
        label: "Ordered List",
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      },
      {
        icon: CheckSquare,
        label: "Task List",
        onClick: () => editor.chain().focus().toggleTaskList().run(),
        active: editor.isActive("taskList"),
      },
      {
        icon: Quote,
        label: "Blockquote",
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
      },
      {
        icon: Code2,
        label: "Code Block",
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
      },
    ],
    [
      {
        icon: AlignLeft,
        label: "Align Left",
        onClick: () =>
          editor.chain().focus().setTextAlign("left").run(),
        active: editor.isActive({ textAlign: "left" }),
      },
      {
        icon: AlignCenter,
        label: "Align Center",
        onClick: () =>
          editor.chain().focus().setTextAlign("center").run(),
        active: editor.isActive({ textAlign: "center" }),
      },
      {
        icon: AlignRight,
        label: "Align Right",
        onClick: () =>
          editor.chain().focus().setTextAlign("right").run(),
        active: editor.isActive({ textAlign: "right" }),
      },
    ],
    [
      {
        icon: LinkIcon,
        label: "Link",
        onClick: setLink,
        active: editor.isActive("link"),
      },
      {
        icon: ImageIcon,
        label: "Image",
        onClick: addImage,
      },
    ],
  ];

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex flex-wrap items-center gap-0.5 px-3 py-2",
          "bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06]",
          "sticky top-0 z-10",
        )}
      >
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <Separator />}
            {group.map((btn) => (
              <ToolbarBtn key={btn.label} {...btn} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} className="rich-editor-content" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-t border-white/[0.06] text-xs text-text-tertiary">
        <div className="flex items-center gap-4">
          <span>{wordCountRef.current} words</span>
          <span>{charCountRef.current} chars</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-neon-cyan animate-pulse">Saving...</span>
          ) : lastSaved ? (
            <span>
              Saved{" "}
              {new Date(lastSaved).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .rich-editor-content .ProseMirror {
          min-height: calc(100vh - 280px);
          padding: 2rem 2.5rem;
          outline: none;
          color: var(--color-text-primary);
        }

        .rich-editor-content .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        .rich-editor-content .ProseMirror h1 {
          font-family: var(--font-display);
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 1.5em;
        }

        .rich-editor-content .ProseMirror h2 {
          font-family: var(--font-display);
          font-size: 1.65rem;
          font-weight: 700;
          line-height: 1.3;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 1.25em;
        }

        .rich-editor-content .ProseMirror h3 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 600;
          line-height: 1.4;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 1em;
        }

        .rich-editor-content .ProseMirror p {
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.75;
          color: var(--color-text-primary);
        }

        .rich-editor-content .ProseMirror a {
          color: var(--color-neon-cyan);
          text-decoration: underline;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .rich-editor-content .ProseMirror a:hover {
          opacity: 0.8;
        }

        .rich-editor-content .ProseMirror mark {
          background-color: rgba(255, 213, 0, 0.3);
          border-radius: 2px;
          padding: 0.1em 0.2em;
        }

        .rich-editor-content .ProseMirror pre {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          line-height: 1.6;
          overflow-x: auto;
          color: #e2e8f0;
        }

        .rich-editor-content .ProseMirror pre code {
          background: none;
          padding: 0;
          border: none;
          font-size: inherit;
          color: inherit;
        }

        .rich-editor-content .ProseMirror :not(pre) > code {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 0.15em 0.4em;
          font-family: var(--font-mono);
          font-size: 0.85em;
          color: var(--color-neon-cyan);
        }

        .rich-editor-content .ProseMirror blockquote {
          border-left: 3px solid var(--color-neon-cyan);
          padding-left: 1rem;
          margin-left: 0;
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.5em;
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25em;
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          appearance: none;
          width: 1rem;
          height: 1rem;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
          background: var(--color-neon-cyan);
          border-color: var(--color-neon-cyan);
        }

        .rich-editor-content .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div > p {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .rich-editor-content .ProseMirror ul,
        .rich-editor-content .ProseMirror ol {
          padding-left: 1.5rem;
        }

        .rich-editor-content .ProseMirror ul {
          list-style-type: disc;
        }

        .rich-editor-content .ProseMirror ol {
          list-style-type: decimal;
        }

        .rich-editor-content .ProseMirror ul li,
        .rich-editor-content .ProseMirror ol li {
          margin-top: 0.25em;
        }

        .rich-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1rem 0;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .rich-editor-content .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          margin: 1rem 0;
        }

        .rich-editor-content .ProseMirror th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 600;
          text-align: left;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .rich-editor-content .ProseMirror td {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .rich-editor-content .ProseMirror hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 1.5rem 0;
        }

        .rich-editor-content .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-text-tertiary);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
