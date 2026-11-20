"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
} from "lucide-react";
import MediaPickerModal from "./MediaPickerModal";

interface Props {
  initialHtml: string;
  readOnly?: boolean;
  onChange: (payload: { html: string; json: Record<string, unknown>; text: string }) => void;
}

export default function RichTextEditor({ initialHtml, readOnly = false, onChange }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Mulai menulis liputan atau opini Anda di sini...",
      }),
    ],
    content: initialHtml,
    onUpdate({ editor: ed }) {
      onChange({
        html: ed.getHTML(),
        json: ed.getJSON() as Record<string, unknown>,
        text: ed.getText(),
      });
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div className="min-h-[360px] p-4 rounded border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink-muted)]">
        Menyiapkan editor...
      </div>
    );
  }

  const addLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Masukkan URL tautan (https://...):", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  };

  const btnCls = (active: boolean) =>
    `p-1.5 rounded text-xs transition-colors ${
      active
        ? "bg-[var(--accent)] text-white"
        : "hover:bg-[var(--paper)] text-[var(--ink)]"
    }`;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {!readOnly && (
        <div className="px-2.5 py-2 border-b border-[var(--border)] bg-[var(--paper)] flex flex-wrap items-center gap-1">
          <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))}>
            <Heading2 className="w-4 h-4" />
          </button>
          <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))}>
            <Heading3 className="w-4 h-4" />
          </button>
          <button type="button" title="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={btnCls(editor.isActive("heading", { level: 4 }))}>
            <Heading4 className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button type="button" title="Tebal" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))}>
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" title="Miring" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))}>
            <Italic className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button type="button" title="Daftar butir" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))}>
            <List className="w-4 h-4" />
          </button>
          <button type="button" title="Daftar bernomor" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))}>
            <ListOrdered className="w-4 h-4" />
          </button>
          <button type="button" title="Kutipan" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))}>
            <Quote className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button type="button" title="Tautan" onClick={addLink} className={btnCls(editor.isActive("link"))}>
            <Link2 className="w-4 h-4" />
          </button>
          <button type="button" title="Sisipkan Gambar dari Pustaka" onClick={() => setMediaOpen(true)} className={btnCls(false)}>
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Sisipkan Tabel 3x3"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className={btnCls(editor.isActive("table"))}
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()} className={btnCls(false)}>
            <Undo className="w-4 h-4" />
          </button>
          <button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()} className={btnCls(false)}>
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 article-prose">
        <EditorContent editor={editor} />
      </div>

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(media) => {
          editor
            .chain()
            .focus()
            .setImage({ src: media.file_url, alt: media.alt_text, title: media.caption || media.credit_source })
            .run();
        }}
      />
    </div>
  );
}

