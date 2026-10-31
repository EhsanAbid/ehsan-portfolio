/**
 * A tiny event bus between independent client islands (3D cards, panels, terminal).
 * Built on window CustomEvents, so islands never import each other.
 */
export type EventMap = {
  /** Open a panel: "about" | "work" | "contact" | "work-<projectId>" | "" (close). */
  "open-panel": { id: string };
  "terminal-toggle": Record<string, never>;
};

export function emit<K extends keyof EventMap>(name: K, detail: EventMap[K]) {
  window.dispatchEvent(new CustomEvent(`site:${name}`, { detail }));
}

export function on<K extends keyof EventMap>(name: K, fn: (detail: EventMap[K]) => void) {
  const h = (e: Event) => fn((e as CustomEvent<EventMap[K]>).detail);
  window.addEventListener(`site:${name}`, h);
  return () => window.removeEventListener(`site:${name}`, h);
}

/** Scroll to a position (in screens), through Lenis when smooth scrolling is on. */
export function scrollToScreens(screens: number, immediate = false) {
  const y = screens * innerHeight;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.6 });
  else scrollTo({ top: y, behavior: immediate || matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
