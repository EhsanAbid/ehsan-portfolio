"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribe, universe } from "./store";
import { scrollToTarget } from "./motion";

export type MapStop = { id: string; label: string; color: string };

/**
 * Vertical mini-map: one glowing dot per planet (desktop). Click to warp there.
 * On phones it becomes a thin progress line at the top of the screen.
 */
export function MiniMap({ stops, label }: { stops: MapStop[]; label: string }) {
  const [active, setActive] = useState(stops[0]?.id);
  const progress = useSyncExternalStore(subscribe, () => universe.progress, () => 0);

  useEffect(() => {
    const els = stops.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    // IntersectionObserver: the browser tells us which section crosses the middle band.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [stops]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 h-0.5 md:hidden" aria-hidden>
        <div className="h-full origin-left bg-gradient-to-r from-cyan to-violet" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <nav aria-label={label} className="fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 md:block">
        <ol className="flex flex-col items-end gap-3">
          {stops.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget(`#${s.id}`);
                    history.replaceState(null, "", `#${s.id}`);
                  }}
                  className="group flex items-center gap-2 py-0.5"
                  aria-current={on ? "location" : undefined}
                >
                  <span className={`mono text-[0.68rem] tracking-wider text-muted uppercase transition-opacity ${on ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                    {s.label}
                  </span>
                  <span
                    className="block rounded-full transition-all duration-500"
                    style={{
                      width: on ? 12 : 7,
                      height: on ? 12 : 7,
                      background: on ? s.color : "rgba(255,255,255,0.25)",
                      boxShadow: on ? `0 0 14px ${s.color}` : "none",
                    }}
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
