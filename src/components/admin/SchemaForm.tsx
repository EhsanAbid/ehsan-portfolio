"use client";

import dynamic from "next/dynamic";
import { useId, useState, type ReactNode } from "react";
import type { z } from "zod";
import type { MediaRef } from "@/schema/fields";
import type { RichDoc } from "@/schema/rich";
import { ColorField } from "./ColorField";
import { MediaPicker } from "./MediaPicker";
import { SortableList } from "./SortableList";
import {
  discriminatorOf,
  elementOf,
  enumValues,
  humanize,
  kindOf,
  literalValue,
  metaOf,
  newId,
  newItem,
  numberBounds,
  shapeOf,
  unionOptions,
  unionVariant,
} from "./schemaUtils";

// The rich-text editor (TipTap + ProseMirror) is heavy: load it only when a rich field is shown.
const RichEditor = dynamic(() => import("./RichEditor"), {
  ssr: false,
  loading: () => <div className="a-input min-h-[120px] animate-pulse" />,
});

type FieldProps = {
  schema: z.ZodType;
  value: unknown;
  onChange: (v: unknown) => void;
  name: string;
  /** Hide the label (list rows already show a title). */
  bare?: boolean;
};

type Obj = Record<string, unknown>;

function FieldWrap({ label, help, error, htmlFor, children }: { label?: string; help?: string; error?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      {label && (
        <label className="a-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? <p className="a-error">{error}</p> : help ? <p className="a-help">{help}</p> : null}
    </div>
  );
}

/** Validate a single leaf value against its own schema, for inline error messages. */
function leafError(schema: z.ZodType, value: unknown) {
  const r = schema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
}

/**
 * Renders ANY part of the site schema as a form. The widget is picked from the schema's
 * type and its .meta({ widget }) hint, recursively for groups and lists.
 */
export function SchemaField({ schema, value, onChange, name, bare }: FieldProps) {
  const id = useId();
  const meta = metaOf(schema);
  const kind = kindOf(schema);
  const label = bare ? undefined : (meta.label ?? humanize(name));
  const widget = meta.widget;

  if (widget === "hidden") return null;

  if (widget === "rich") {
    return (
      <FieldWrap label={label} help={meta.help}>
        <RichEditor value={(value as RichDoc) ?? { type: "doc", content: [] }} onChange={onChange} />
      </FieldWrap>
    );
  }

  if (widget === "media") {
    return (
      <FieldWrap label={label} help={meta.help}>
        <MediaPicker value={(value as MediaRef) ?? { key: "", alt: "", width: 0, height: 0 }} onChange={onChange} accept={meta.accept} />
      </FieldWrap>
    );
  }

  if (kind === "object") return <GroupField schema={schema} value={(value as Obj) ?? {}} onChange={onChange} label={label} />;

  if (kind === "union" && discriminatorOf(schema)) {
    const variant = unionVariant(schema, (value as Obj) ?? {});
    if (!variant) return <p className="a-error">Unknown item type</p>;
    return <GroupField schema={variant} value={(value as Obj) ?? {}} onChange={onChange} label={label} />;
  }

  if (kind === "array") {
    const el = elementOf(schema);
    if (kindOf(el) === "string") {
      return (
        <FieldWrap label={label} help={meta.help}>
          <TagsField value={(value as string[]) ?? []} onChange={onChange} />
        </FieldWrap>
      );
    }
    return <ListField schema={schema} value={(value as unknown[]) ?? []} onChange={onChange} label={label} />;
  }

  const error = leafError(schema, value);

  if (kind === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <label htmlFor={id} className="text-sm text-text">
          {label}
          {meta.help && <span className="a-help block">{meta.help}</span>}
        </label>
        <button id={id} type="button" role="switch" aria-checked={!!value} className="a-switch" onClick={() => onChange(!value)} />
      </div>
    );
  }

  if (kind === "enum") {
    const opts = enumValues(schema);
    return (
      <FieldWrap label={label} help={meta.help} error={error} htmlFor={id}>
        <select id={id} className="a-input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {opts.map((o) => (
            <option key={o} value={o}>
              {meta.optionLabels?.[o] ?? humanize(o)}
            </option>
          ))}
        </select>
      </FieldWrap>
    );
  }

  if (kind === "number") {
    const { min, max, int } = numberBounds(schema);
    const step = meta.step ?? (int ? 1 : (max ?? 1) - (min ?? 0) <= 2 ? 0.01 : 0.1);
    const num = typeof value === "number" ? value : Number(value ?? 0);
    const set = (v: number) => onChange(int ? Math.round(v) : Math.round(v * 1000) / 1000);
    return (
      <FieldWrap label={label} help={meta.help} error={error} htmlFor={id}>
        <div className="flex items-center gap-3">
          {widget === "slider" && min !== undefined && max !== undefined && (
            <input type="range" min={min} max={max} step={step} value={num} onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-cyan-400" aria-label={label} />
          )}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(num) ? num : 0}
            onChange={(e) => set(Number(e.target.value))}
            className={`a-input ${widget === "slider" ? "!w-24" : "!w-32"}`}
          />
          {meta.unit && <span className="text-xs text-muted">{meta.unit}</span>}
        </div>
      </FieldWrap>
    );
  }

  // strings
  const str = String(value ?? "");
  if (widget === "color") {
    return (
      <FieldWrap label={label} help={meta.help} error={error} htmlFor={id}>
        <ColorField id={id} value={str} onChange={onChange} />
      </FieldWrap>
    );
  }
  if (widget === "textarea" || widget === "code") {
    return (
      <FieldWrap label={label} help={meta.help} error={error} htmlFor={id}>
        <textarea id={id} className={`a-input ${widget === "code" ? "min-h-[220px] font-mono text-xs" : ""}`} value={str} onChange={(e) => onChange(e.target.value)} spellCheck={widget !== "code"} />
      </FieldWrap>
    );
  }
  return (
    <FieldWrap label={label} help={meta.help} error={error} htmlFor={id}>
      <input
        id={id}
        className={`a-input ${widget === "icon" ? "!w-24 text-center text-lg" : ""} ${str.includes("TODO_EHSAN") ? "!border-amber-400/60" : ""}`}
        type={widget === "url" ? "text" : "text"}
        inputMode={widget === "url" ? "url" : undefined}
        placeholder={meta.placeholder}
        value={str}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

function GroupField({ schema, value, onChange, label }: { schema: z.ZodType; value: Obj; onChange: (v: unknown) => void; label?: string }) {
  const meta = metaOf(schema);
  const shape = shapeOf(schema);
  const disc = discriminatorOf(schema);
  const keys = Object.keys(shape).filter((k) => k !== disc && k !== "type");
  if (!keys.length) return meta.help ? <p className="a-help">{meta.help}</p> : null;
  const body = (
    <div className="grid gap-4">
      {keys.map((k) => (
        <SchemaField key={k} name={k} schema={shape[k]} value={value[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
      ))}
    </div>
  );
  if (!label) return body;
  return (
    <details className="a-fieldset group" open={!meta.collapsed}>
      <summary className="cursor-pointer text-sm font-semibold text-white select-none">{label}</summary>
      {meta.help && <p className="a-help mb-2">{meta.help}</p>}
      <div className="mt-3">{body}</div>
    </details>
  );
}

function itemTitle(item: unknown, labelKey: string | undefined, index: number): string {
  if (item && typeof item === "object") {
    const o = item as Obj;
    const v = (labelKey && o[labelKey]) || o.title || o.name || o.label || o.alt;
    if (typeof v === "string" && v) return v;
    if (typeof o.key === "string" && o.key) return o.key;
  }
  return `Item ${index + 1}`;
}

/** A list of objects: drag to reorder, expand to edit, add / duplicate / delete. */
export function ListField({ schema, value, onChange, label }: { schema: z.ZodType; value: unknown[]; onChange: (v: unknown) => void; label?: string }) {
  const meta = metaOf(schema);
  const el = elementOf(schema);
  const isUnion = kindOf(el) === "union";
  const disc = isUnion ? discriminatorOf(el) : undefined;
  const types = isUnion ? unionOptions(el).map((o) => String(literalValue(shapeOf(o)[disc!]))) : [];
  const [open, setOpen] = useState<string | null>(null);
  const [newType, setNewType] = useState(types[0] ?? "");

  // Stable ids for dnd-kit: use the item's own id when it has one.
  const getId = (item: unknown, i: number) => {
    const v = item && typeof item === "object" ? (item as Obj).id ?? (item as Obj).key : undefined;
    return typeof v === "string" && v ? `${v}` : `idx-${i}`;
  };

  const add = () => {
    const item = isUnion
      ? newItem(unionOptions(el).find((o) => literalValue(shapeOf(o)[disc!]) === newType)!, { [disc!]: newType })
      : newItem(el);
    onChange([...value, item]);
    setOpen(getId(item, value.length));
  };

  return (
    <div className="a-fieldset">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">
          {label} <span className="text-muted">({value.length})</span>
        </span>
      </div>
      {meta.help && <p className="a-help mb-2">{meta.help}</p>}
      <SortableList
        items={value}
        getId={getId}
        onReorder={onChange}
        renderItem={(item, i, handle) => {
          const id = getId(item, i);
          const expanded = open === id;
          return (
            <div className="rounded-xl border border-white/10 bg-[#0a0e1c]">
              <div className="flex items-center gap-2 p-2">
                {handle}
                <button type="button" className={`flex-1 truncate text-left text-sm ${(item as Obj)?.enabled === false ? "text-muted line-through" : "text-text"}`} onClick={() => setOpen(expanded ? null : id)} aria-expanded={expanded}>
                  {isUnion && <span className="chip mr-2">{String((item as Obj)[disc!])}</span>}
                  {itemTitle(item, meta.itemLabel, i)}
                </button>
                {typeof (item as Obj)?.enabled === "boolean" && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={(item as Obj).enabled as boolean}
                    aria-label="Visible / enabled"
                    title="Visible / enabled"
                    className="a-switch"
                    onClick={() => onChange(value.map((x, j) => (j === i ? { ...(x as Obj), enabled: !(x as Obj).enabled } : x)))}
                  />
                )}
                <button
                  type="button"
                  className="a-btn a-btn-icon"
                  title="Duplicate"
                  aria-label="Duplicate"
                  onClick={() => {
                    const copy = structuredClone(item) as Obj;
                    if (copy && typeof copy === "object" && "id" in copy) copy.id = newId();
                    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)]);
                  }}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="a-btn a-btn-icon a-btn-danger"
                  title="Delete"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete “${itemTitle(item, meta.itemLabel, i)}”?`)) onChange(value.filter((_, j) => j !== i));
                  }}
                >
                  ✕
                </button>
                <button type="button" className="a-btn a-btn-icon" onClick={() => setOpen(expanded ? null : id)} aria-label={expanded ? "Collapse" : "Edit"}>
                  {expanded ? "▴" : "▾"}
                </button>
              </div>
              {expanded && (
                <div className="border-t border-white/10 p-3">
                  <SchemaField name="" bare schema={el} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
                </div>
              )}
            </div>
          );
        }}
      />
      <div className="mt-3 flex gap-2">
        {isUnion && (
          <select className="a-input !w-auto" value={newType} onChange={(e) => setNewType(e.target.value)} aria-label="Type to add">
            {types.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="a-btn" onClick={add}>
          + Add
        </button>
      </div>
    </div>
  );
}

/** A list of short strings (taglines, boot lines, keywords…). */
function TagsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      {value.map((v, i) => (
        <div key={i} className="flex gap-1.5">
          <input className={`a-input ${v.includes("TODO_EHSAN") ? "!border-amber-400/60" : ""}`} value={v} onChange={(e) => set(i, e.target.value)} aria-label={`Item ${i + 1}`} />
          <button type="button" className="a-btn a-btn-icon" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>↑</button>
          <button type="button" className="a-btn a-btn-icon" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === value.length - 1}>↓</button>
          <button type="button" className="a-btn a-btn-icon a-btn-danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onChange([...value, ""])}>
        + Add
      </button>
    </div>
  );
}
