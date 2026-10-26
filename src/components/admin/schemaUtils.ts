import type { z } from "zod";
import type { FieldMeta } from "@/schema/fields";

/*
 * Helpers to *read* a Zod schema at runtime. This is what makes the admin "schema-driven":
 * instead of hand-writing a form per area, <SchemaForm> asks the schema "what are you?"
 * (string? list of objects? enum?) and "how should I look?" (the .meta() hints) and renders
 * the right input. Add a field to src/schema/site.ts and it shows up here automatically.
 */

type AnyDef = {
  type: string;
  innerType?: z.ZodType;
  getter?: () => z.ZodType;
  in?: z.ZodType;
  shape?: Record<string, z.ZodType>;
  element?: z.ZodType;
  entries?: Record<string, string>;
  options?: z.ZodType[];
  discriminator?: string;
  values?: unknown[];
  checks?: unknown[];
};

const WRAPPERS = new Set(["default", "prefault", "optional", "nullable", "readonly", "catch", "nonoptional"]);

export const defOf = (s: z.ZodType) => (s as unknown as { def: AnyDef }).def;

/** Strip default/optional/lazy wrappers to reach the real type. */
export function unwrap(s: z.ZodType): z.ZodType {
  let cur = s;
  for (let i = 0; i < 20; i++) {
    const d = defOf(cur);
    if (WRAPPERS.has(d.type) && d.innerType) cur = d.innerType;
    else if (d.type === "lazy" && d.getter) cur = d.getter();
    else if (d.type === "pipe" && d.in) cur = d.in;
    else break;
  }
  return cur;
}

/** Merge .meta() found on the wrapper chain (outermost wins). */
export function metaOf(s: z.ZodType): FieldMeta {
  const metas: FieldMeta[] = [];
  let cur: z.ZodType | undefined = s;
  for (let i = 0; cur && i < 20; i++) {
    const m = (cur as unknown as { meta: () => FieldMeta | undefined }).meta?.();
    if (m) metas.push(m);
    const d = defOf(cur);
    cur = WRAPPERS.has(d.type) ? d.innerType : d.type === "lazy" ? d.getter?.() : d.type === "pipe" ? d.in : undefined;
  }
  return Object.assign({}, ...metas.reverse());
}

export const kindOf = (s: z.ZodType) => defOf(unwrap(s)).type;
export const shapeOf = (s: z.ZodType) => defOf(unwrap(s)).shape ?? {};
export const elementOf = (s: z.ZodType) => defOf(unwrap(s)).element!;
export const enumValues = (s: z.ZodType) => Object.values(defOf(unwrap(s)).entries ?? {});
export const unionOptions = (s: z.ZodType) => defOf(unwrap(s)).options ?? [];
export const discriminatorOf = (s: z.ZodType) => defOf(unwrap(s)).discriminator;
export const literalValue = (s: z.ZodType) => defOf(unwrap(s)).values?.[0];

/** min/max from number checks (used by sliders). */
export function numberBounds(s: z.ZodType) {
  const n = unwrap(s) as unknown as { minValue?: number | null; maxValue?: number | null; isInt?: boolean };
  return { min: n.minValue ?? undefined, max: n.maxValue ?? undefined, int: !!n.isInt };
}

/** For a discriminated union item (sections): the option whose literal matches. */
export function unionVariant(s: z.ZodType, value: Record<string, unknown>) {
  const disc = discriminatorOf(s);
  if (!disc) return undefined;
  return unionOptions(s).find((o) => literalValue(shapeOf(o)[disc]) === value[disc]);
}

export const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)).slice(0, 8);

/** A fresh item for a list: parse an empty object (every field has a default) plus a new id. */
export function newItem(itemSchema: z.ZodType, extra: Record<string, unknown> = {}): unknown {
  const inner = unwrap(itemSchema);
  const k = defOf(inner).type;
  if (k === "object") {
    const shape = shapeOf(inner);
    return inner.parse({ ...("id" in shape ? { id: newId() } : {}), ...extra });
  }
  if (k === "string") return "";
  return itemSchema.parse(undefined);
}

/** Humanise a key when the schema gave no label: "minIntervalSec" → "Min interval sec". */
export const humanize = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
