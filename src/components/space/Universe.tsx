"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Site } from "@/schema/site";
import { hasWebGL, initialTier, prefersReducedMotion } from "@/lib/fps";
import { bootRunning, on } from "@/lib/events";
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
};

/** Runs `fn` when the browser has nothing better to do (after first paint & hydration). */
function whenIdle(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 600);
}

export function Universe({ effects, colors, stops, mapLabel }: UniverseProps) {
  const [mount3d, setMount3d] = useState(false);

  // Device check, WebGL check, then lazy-load the canvas + smooth scroll.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    setUniverse({ tier: initialTier() });
    if (reduced) document.documentElement.classList.add("no-webgl");
    // Creating a test WebGL context is expensive, so it happens later, right before we need it.
    let webgl: boolean | null = null;
    const canWebGL = () => {
      if (webgl === null) {
        webgl = hasWebGL();
        setUniverse({ webgl });
        document.documentElement.classList.toggle("no-webgl", !webgl || reduced);
      }
      return webgl;
    };
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Wait for the boot overlay to finish, then for an idle moment, so the heavy 3D setup
    // never competes with the first paint and hydration.
    const afterBoot = (fn: () => void) => (bootRunning() ? on("boot-done", fn) : (fn(), () => {}));
    // Phones (coarse pointer): by default the 3D layer starts on the first touch or scroll, so the
    // heavy WebGL setup never lands while the page is loading (admin: Effects → Quality controller).
    const phone = matchMedia("(pointer: coarse)").matches;
    const mode = phone ? effects.quality.phoneStart : "immediately";
    const delay = mode === "delay" ? effects.quality.phoneDelaySec * 1000 : mode === "interaction" ? Infinity : 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const start3d = () => {
      if (!cancelled && !reduced) whenIdle(() => !cancelled && canWebGL() && setMount3d(true));
      removeEventListener("touchstart", start3d);
      removeEventListener("scroll", start3d);
    };
    const offBoot = afterBoot(() => {
      if (!delay) return start3d();
      if (Number.isFinite(delay)) delayTimer = setTimeout(start3d, delay);
      addEventListener("touchstart", start3d, { passive: true, once: true });
      addEventListener("scroll", start3d, { passive: true, once: true });
    });
    whenIdle(() => {
      if (cancelled) return;
      if (!reduced) {
        import("./motion").then(({ startMotion, startLiteMotion }) => {
          if (cancelled) return;
          if (phone) {
            stop = startLiteMotion({ revealMs: effects.motion.revealMs });
            return;
          }
          startMotion({ smoothScroll: effects.motion.smoothScroll, revealMs: effects.motion.revealMs }).then((s) => {
            if (cancelled) s();
            else stop = s;
          });
        });
      }
    });
    return () => {
      cancelled = true;
      offBoot();
      clearTimeout(delayTimer);
      removeEventListener("touchstart", start3d);
      removeEventListener("scroll", start3d);
      stop?.();
    };
  }, [effects.motion.smoothScroll, effects.motion.revealMs, effects.quality.phoneDelaySec, effects.quality.phoneStart]);

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

  // Pointer position for the particle repel (canvas has pointer-events: none, so listen on window).
  useEffect(() => {
    // Mutated directly (no listeners notified): only the render loop reads it.
    const move = (e: PointerEvent) => (universe.pointer = { x: e.clientX, y: e.clientY, active: true });
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.type === "pointerleave") universe.pointer = { x: -9999, y: -9999, active: false };
    };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", move, { passive: true });
    addEventListener("pointerup", leave);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", move);
      removeEventListener("pointerup", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

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
      {mount3d && (effects.starfield.enabled || effects.particles.enabled) && <SpaceCanvas effects={effects} colors={colors} />}
      <MiniMap stops={stops} label={mapLabel} />
    </>
  );
}
