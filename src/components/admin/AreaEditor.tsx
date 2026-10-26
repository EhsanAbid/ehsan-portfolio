"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { siteSchema, type Site } from "@/schema/site";
import { saveAreaAction } from "@/app/admin/actions";
import { SchemaField } from "./SchemaForm";
import { useAdmin } from "./AdminContext";
import { shapeOf } from "./schemaUtils";

type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string; issues?: { path: string; message: string }[] };

/**
 * Edits one top-level area of the draft (e.g. "profile", "quests", "design").
 * Changes autosave after a short pause (debounce): typing fast sends one request, not 30.
 * The value is validated in the browser first; the server validates the whole site again.
 */
export function AreaEditor<K extends keyof Site>({
  area,
  initial,
  only,
  onValue,
  onSaved,
  toolbar,
}: {
  area: K;
  initial: Site[K];
  /** Only show these keys of an object area (e.g. Content → "Labels"). */
  only?: string[];
  /** Notified on every change (used by live previews). */
  onValue?: (v: Site[K]) => void;
  /** Called after each successful save (live preview reloads). */
  onSaved?: () => void;
  /** Extra controls above the form that can change the whole value (e.g. design presets). */
  toolbar?: (value: Site[K], change: (v: Site[K]) => void) => ReactNode;
}) {
  const [value, setValue] = useState<Site[K]>(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const { setChanges } = useAdmin();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const schema = siteSchema.shape[area];

  async function save(v: Site[K]) {
    timer.current = null;
    const local = schema.safeParse(v);
    if (!local.success) {
      setStatus({
        kind: "error",
        message: "Not saved — fix the highlighted fields.",
        issues: local.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    setStatus({ kind: "saving" });
    const res = await saveAreaAction(area as string, v);
    if (latest.current !== v) return; // a newer edit is on its way
    if (res.ok) {
      setStatus({ kind: "saved" });
      if ("changes" in res) setChanges(res.changes as number);
      onSaved?.();
    } else setStatus({ kind: "error", message: res.error, issues: "issues" in res ? res.issues : undefined });
  }

  function change(v: unknown) {
    const next = v as Site[K];
    setValue(next);
    latest.current = next;
    onValue?.(next);
    setStatus({ kind: "saving" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), 700);
  }

  // Flush a pending save if the editor unmounts (e.g. switching tabs).
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void saveAreaAction(area as string, latest.current);
      }
    },
    [area],
  );

  const shown =
    only && value && typeof value === "object" && !Array.isArray(value)
      ? only.map((k) => ({ k, s: shapeOf(schema)[k] }))
      : null;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-1 mb-3 flex justify-end px-1 py-1" aria-live="polite">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            status.kind === "error" ? "bg-rose-500/15 text-rose-300" : status.kind === "saving" ? "bg-white/5 text-muted" : status.kind === "saved" ? "bg-emerald-500/15 text-emerald-300" : "text-transparent"
          }`}
        >
          {status.kind === "saving" ? "Saving draft…" : status.kind === "saved" ? "Draft saved ✓" : status.kind === "error" ? status.message : "·"}
        </span>
      </div>
      {status.kind === "error" && status.issues?.length ? (
        <ul className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {status.issues.map((i, n) => (
            <li key={n}>
              <code>{i.path || "(root)"}</code>: {i.message}
            </li>
          ))}
        </ul>
      ) : null}
      {toolbar && <ToolbarSlot render={toolbar} value={value} change={change} />}
      {shown ? (
        <div className="grid gap-4">
          {shown.map(({ k, s }) => (
            <SchemaField
              key={k}
              name={k}
              schema={s}
              value={(value as Record<string, unknown>)[k]}
              onChange={(v) => change({ ...(value as Record<string, unknown>), [k]: v })}
            />
          ))}
        </div>
      ) : (
        <SchemaField name={area as string} bare schema={schema} value={value} onChange={change} />
      )}
    </div>
  );
}

function ToolbarSlot<V>({ render, value, change }: { render: (v: V, c: (v: V) => void) => ReactNode; value: V; change: (v: V) => void }) {
  return <>{render(value, change)}</>;
}
