import { z } from "zod";

/**
 * Field builders for the site schema.
 *
 * Each helper returns a Zod schema with:
 *  - a `.default()` so older saved versions keep working when new fields are added
 *    (parsing fills the gap — this is how new features become editable "for free"),
 *  - `.meta()` describing how the admin should render it (label, widget, hints).
 * The admin's <SchemaForm> reads this metadata at runtime; the public site never needs it.
 */

export type Widget =
  | "text"
  | "textarea"
  | "rich"
  | "color"
  | "number"
  | "slider"
  | "toggle"
  | "select"
  | "media"
  | "url"
  | "icon"
  | "hidden"
  | "list"
  | "group"
  | "tags"
  | "code"
  | "time";

export type FieldMeta = {
  label?: string;
  help?: string;
  widget?: Widget;
  /** For lists: which item field to show as the row title. */
  itemLabel?: string;
  /** For media fields: accepted kinds. */
  accept?: "image" | "pdf" | "any";
  /** For select widgets: display labels per value. */
  optionLabels?: Record<string, string>;
  /** Collapse this group by default in the admin. */
  collapsed?: boolean;
  step?: number;
  unit?: string;
  placeholder?: string;
};

// Type the `.meta({...})` calls: Zod's global registry accepts our admin hints.
declare module "zod" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface GlobalMeta extends FieldMeta {}
}

export const TODO = "TODO_EHSAN";

export const text = (label: string, def = "", meta: FieldMeta = {}) =>
  z.string().max(2000).default(def).meta({ label, widget: "text", ...meta });

export const longText = (label: string, def = "", meta: FieldMeta = {}) =>
  z.string().max(20000).default(def).meta({ label, widget: "textarea", ...meta });

export const url = (label: string, def = "", meta: FieldMeta = {}) =>
  z
    .string()
    .max(2000)
    .refine((v) => v === "" || v.startsWith(TODO) || /^(https?:\/\/|mailto:|\/|#)/i.test(v), {
      message: "Must start with https://, mailto:, / or #",
    })
    .default(def)
    .meta({ label, widget: "url", ...meta });

export const color = (label: string, def: string, meta: FieldMeta = {}) =>
  z
    .string()
    .regex(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i, "Use a hex colour like #22D3EE")
    .default(def)
    .meta({ label, widget: "color", ...meta });

export const num = (label: string, def: number, min: number, max: number, meta: FieldMeta = {}) =>
  z.number().min(min).max(max).default(def).meta({ label, widget: "slider", ...meta });

export const int = (label: string, def: number, min: number, max: number, meta: FieldMeta = {}) =>
  z.number().int().min(min).max(max).default(def).meta({ label, widget: "number", ...meta });

export const bool = (label: string, def: boolean, meta: FieldMeta = {}) =>
  z.boolean().default(def).meta({ label, widget: "toggle", ...meta });

export const select = <T extends readonly [string, ...string[]]>(
  label: string,
  options: T,
  def: T[number],
  meta: FieldMeta = {},
) => z.enum(options).default(def as never).meta({ label, widget: "select", ...meta });

export const icon = (label: string, def = "✦", meta: FieldMeta = {}) =>
  z.string().max(16).default(def).meta({ label, widget: "icon", ...meta });

export const id = () => z.string().min(1).max(64).meta({ widget: "hidden" });

export const tags = (label: string, def: string[] = [], meta: FieldMeta = {}) =>
  z.array(z.string().max(200)).max(50).default(def).meta({ label, widget: "tags", ...meta });

export const list = <T extends z.ZodType>(label: string, item: T, meta: FieldMeta = {}, max = 200) =>
  z.array(item).max(max).default([]).meta({ label, widget: "list", ...meta });

export const group = <T extends z.ZodRawShape>(label: string, shape: T, meta: FieldMeta = {}) =>
  // Every field inside has a default, so `{}` is a valid input; TS can't see that generically.
  z.object(shape).prefault({} as never).meta({ label, widget: "group", ...meta });

/** Reference to an uploaded file. alt + size are copied in so the public page needs no extra query. */
export const mediaRefSchema = z.object({
  key: z.string().max(128).default(""), // "<hash>.<ext>" → served at /media/<key>; "" = none
  alt: z.string().max(500).default(""),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

export const media = (label: string, accept: FieldMeta["accept"] = "image", meta: FieldMeta = {}) =>
  mediaRefSchema.prefault({}).meta({ label, widget: "media", accept, ...meta });
