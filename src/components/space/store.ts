import type { Tier } from "@/lib/fps";

/**
 * A tiny shared store for the effects layer. Animation code reads it every frame
 * (no React re-render), React UI subscribes to the few values it displays.
 */
type State = {
  tier: Tier;
  /** Smoothed scroll velocity in px/frame (+ down, − up). Drives the warp streaks. */
  velocity: number;
  /** 0 at the top of the page, 1 at the bottom. */
  progress: number;
  /** Pointer in CSS pixels (or -9999 when absent). */
  pointer: { x: number; y: number; active: boolean };
  sky: string;
  godMode: boolean;
  webgl: boolean;
};

const listeners = new Set<() => void>();

export const universe: State = {
  tier: "medium",
  velocity: 0,
  progress: 0,
  pointer: { x: -9999, y: -9999, active: false },
  sky: "",
  godMode: false,
  webgl: false,
};

export function setUniverse(patch: Partial<State>) {
  Object.assign(universe, patch);
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
