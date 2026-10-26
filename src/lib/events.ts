/**
 * A tiny event bus between independent client islands (terminal, HUD, achievements,
 * sky, sound…). Built on window CustomEvents, so islands never import each other.
 */
export type EventMap = {
  sky: { id: string | "next" | "auto" };
  sound: { on: boolean };
  "terminal-open": Record<string, never>;
  "terminal-toggle": Record<string, never>;
  "god-mode": Record<string, never>;
  matrix: Record<string, never>;
  confetti: Record<string, never>;
  /** Generic hooks the achievements engine listens to. */
  trigger: { type: string; param?: string; key?: string };
  unlocked: { id: string };
  "boot-done": Record<string, never>;
};

export function emit<K extends keyof EventMap>(name: K, detail: EventMap[K]) {
  window.dispatchEvent(new CustomEvent(`ehsan:${name}`, { detail }));
}

export function on<K extends keyof EventMap>(name: K, fn: (detail: EventMap[K]) => void) {
  const h = (e: Event) => fn((e as CustomEvent<EventMap[K]>).detail);
  window.addEventListener(`ehsan:${name}`, h);
  return () => window.removeEventListener(`ehsan:${name}`, h);
}

/** Is the boot overlay still running? (set by the inline boot script, finished by BootControl) */
export function bootRunning() {
  if (typeof window === "undefined") return false;
  if ((window as unknown as { __bootDone?: boolean }).__bootDone) return false;
  return ["full", "mini"].includes(document.documentElement.dataset.boot ?? "");
}
