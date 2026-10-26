import { z } from "zod";

/**
 * Rich text is stored as a *whitelisted* TipTap/ProseMirror JSON tree — never as HTML.
 * Zod strips unknown keys and rejects unknown node/mark types, and links must use a safe
 * protocol. The public site renders this tree with our own tiny renderer (components/ui/RichText),
 * so there is no HTML string anywhere that could carry a <script>. That is our sanitiser.
 */
export const RICH_NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "hardBreak",
] as const;
export const RICH_MARK_TYPES = ["bold", "italic", "link"] as const;

const SAFE_HREF = /^(https?:\/\/|mailto:|\/|#)/i;

const markSchema = z.object({
  type: z.enum(RICH_MARK_TYPES),
  attrs: z
    .object({ href: z.string().max(2000).regex(SAFE_HREF, "Unsafe link") })
    .optional(),
});

export type RichMark = z.infer<typeof markSchema>;
export type RichNode = {
  type: (typeof RICH_NODE_TYPES)[number];
  text?: string;
  marks?: RichMark[];
  content?: RichNode[];
};

export const richNodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z.object({
    type: z.enum(RICH_NODE_TYPES),
    text: z.string().max(20000).optional(),
    marks: z.array(markSchema).max(10).optional(),
    content: z.array(richNodeSchema).max(500).optional(),
  }),
);

export const richDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(richNodeSchema).max(500).default([]),
});
export type RichDoc = z.infer<typeof richDocSchema>;

/** Build a doc from plain paragraphs (used by the seed and by importers). */
export function richFromText(...paragraphs: string[]): RichDoc {
  return {
    type: "doc",
    content: paragraphs.map((p) => ({ type: "paragraph", content: p ? [{ type: "text", text: p }] : [] })),
  };
}

/** Flatten a doc to plain text (meta descriptions, terminal `about`, TODO scan). */
export function richToText(doc: RichDoc | RichNode | undefined): string {
  if (!doc) return "";
  if ("text" in doc && doc.text) return doc.text;
  const parts = (doc.content ?? []).map((n) => richToText(n));
  const block = doc.type === "doc" || doc.type === "bulletList" || doc.type === "orderedList";
  return parts.join(block ? "\n" : "");
}

export const rich = (label: string, def: RichDoc = { type: "doc", content: [] }) =>
  richDocSchema.default(def).meta({ label, widget: "rich" });
