import { TODO } from "@/schema/fields";

export type TodoItem = { path: string; value: string };

/** Walk the whole site document and collect every string that still contains TODO_EHSAN. */
export function findTodos(value: unknown, path = ""): TodoItem[] {
  if (typeof value === "string") return value.includes(TODO) ? [{ path, value }] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => findTodos(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => findTodos(v, path ? `${path}.${k}` : k));
  }
  return [];
}

/** True when a value is real content (not empty and not a placeholder). */
export function filled(v: string | undefined | null): v is string {
  return !!v && !v.includes(TODO);
}

/** Strip the "TODO_EHSAN: " prefix for display in previews. */
export function todoHint(v: string) {
  return v.replace(`${TODO}:`, "").trim();
}
