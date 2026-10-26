"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { RichDoc } from "@/schema/rich";

/**
 * TipTap editor limited to what the public renderer supports: paragraphs, bold, italic,
 * links, bullet + numbered lists. Everything else in StarterKit is switched off, and the
 * server re-validates the JSON anyway.
 */
export default function RichEditor({ value, onChange }: { value: RichDoc; onChange: (v: RichDoc) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, protocols: ["http", "https", "mailto"], autolink: true },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  });

  const btn = (label: string, active: boolean, run: () => void, title: string) => (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      className={`a-btn a-btn-icon !min-h-7 text-xs ${active ? "!border-cyan !text-cyan" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  if (!editor) return <div className="a-input min-h-[120px] animate-pulse" />;
  return (
    <div className="a-rich rounded-[9px] border border-white/10 bg-[#070914] focus-within:border-cyan">
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-1.5">
        {btn("B", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold")}
        {btn("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic")}
        {btn("🔗", editor.isActive("link"), () => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const href = window.prompt("Link URL (https://… or mailto:…). Empty to remove.", prev ?? "https://");
          if (href === null) return;
          if (!href) editor.chain().focus().unsetLink().run();
          else if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          else window.alert("Links must start with https://, mailto:, / or #");
        }, "Link")}
        {btn("• List", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet list")}
        {btn("1. List", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list")}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
