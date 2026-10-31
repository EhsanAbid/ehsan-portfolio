import type { Tier } from "@/lib/fps";

/**
 * Tiny shared store for the 3D world. The render loop reads it every frame (no React
 * re-render); React UI (the flight counter) subscribes to the few values it shows.
 */
type State = {
  tier: Tier;
  /** Scroll position in screen heights (0 = top). Drives explosion + flight. */
  progress: number;
  /** Index of the project card in focus during the flight (-1 = none). */
  focus: number;
  /** Mouse position in normalised device coordinates (-1..1), or null. */
  pointer: { x: number; y: number } | null;
  /** "pending" until the device check ran; then 3D flight or the static fallback. */
  mode: "pending" | "fly" | "static";
  /** The device check has picked a tier (the poster can be drawn). */
  ready: boolean;
};

// Kept on globalThis so every copy of this module (the page bundle and the lazily loaded
// 3D chunk can each end up with their own copy) shares ONE state object and listener set.
const g = globalThis as unknown as { __siteWorld?: { state: State; listeners: Set<() => void> } };
g.__siteWorld ??= {
  state: { tier: "medium", progress: 0, focus: -1, pointer: null, mode: "pending", ready: false },
  listeners: new Set(),
};
const listeners = g.__siteWorld.listeners;

export const world: State = g.__siteWorld.state;

export function setWorld(patch: Partial<State>) {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof State)[]) {
    if (world[k] !== patch[k]) changed = true;
  }
  if (!changed) return;
  Object.assign(world, patch);
  listeners.forEach((l) => l());
}

export function subscribeWorld(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
