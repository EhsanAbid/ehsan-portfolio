"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { Site } from "@/schema/site";
import { hasWebGL, initialTier, prefersReducedMotion, type Tier } from "@/lib/fps";
import { on } from "@/lib/events";
import { setUniverse, universe } from "./store";
import { applySky, readSavedSky, saveSky, themeForHour } from "./sky";
import { MiniMap, type MapStop } from "./MiniMap";

// three.js + react-three-fiber live in their own chunk, downloaded only after the page is idle.
const SpaceCanvas = dynamic(() => import("./SpaceCanvas"), { ssr: false });

export type UniverseProps = {
  effects: Site["effects"];
  colors: { cyan: string; violet: string };
  stops: MapStop[];
  mapLabel: string;
  /** Extra things to draw inside the WebGL scene (hero particles). */
  scene?: (tier: Tier) => ReactNode;
};

/** Runs `fn` when the browser has nothing better to do (after first paint & hydration). */
function whenIdle(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 600);
}

export function Universe({ effects, colors, stops, mapLabel, scene }: UniverseProps) {
  const [mount3d, setMount3d] = useState(false);

  // Device check, WebGL check, then lazy-load the canvas + smooth scroll.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const webgl = hasWebGL();
    setUniverse({ tier: initialTier(), webgl });
    document.documentElement.classList.toggle("no-webgl", !webgl || reduced);
    let stop: (() => void) | undefined;
    let cancelled = false;
    whenIdle(() => {
      if (cancelled) return;
      if (webgl && !reduced) setMount3d(true);
      if (!reduced) {
        import("./motion").then(({ startMotion }) =>
          startMotion({ smoothScroll: effects.motion.smoothScroll, revealMs: effects.motion.revealMs }).then((s) => {
            if (cancelled) s();
            else stop = s;
          }),
        );
      }
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [effects.motion.smoothScroll, effects.motion.revealMs]);

  // Sky theme: saved choice > visitor's local hour. Changeable via toggle/terminal events.
  useEffect(() => {
    const themes = effects.sky.themes;
    if (!themes.length) return;
    const pick = (id: string | null) => {
      const manual = id ? themes.find((t) => t.id === id || t.name.toLowerCase() === id.toLowerCase()) : undefined;
      const t = manual ?? (effects.sky.auto ? themeForHour(themes, new Date().getHours()) : themes.find((x) => x.id === "night")) ?? themes[0];
      applySky(t);
      setUniverse({ sky: t.id });
    };
    pick(readSavedSky());
    return on("sky", ({ id }) => {
      if (id === "auto") {
        saveSky(null);
        pick(null);
        return;
      }
      let next = id;
      if (id === "next") {
        const i = themes.findIndex((t) => t.id === universe.sky);
        next = themes[(i + 1) % themes.length].id;
      }
      saveSky(next);
      pick(next);
    });
  }, [effects.sky]);

  // Scroll progress for the mini-map / progress line (velocity is measured in the canvas loop).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setUniverse({ progress: max > 0 ? scrollY / max : 0 });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="static-stars" aria-hidden />
      {mount3d && effects.starfield.enabled && <SpaceCanvas effects={effects} colors={colors}>{scene}</SpaceCanvas>}
      <MiniMap stops={stops} label={mapLabel} />
    </>
  );
}
