"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import type { EndGlowProps } from "./EndGlowShader";

/**
 * A slow glow behind the end screen, drawn with WebGPU (the `shaders` library).
 * It costs nothing until it is needed: the library is downloaded only when the end screen is
 * about to scroll into view, and the GPU canvas is removed again when it scrolls away, so it
 * never competes with the block portrait at the top. Without WebGPU (or with reduced motion)
 * nothing is loaded and the plain background stays.
 */
export function EndGlow({ colors, strength, speed, distortion }: Omit<EndGlowProps, "onUnavailable"> & { strength: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [Glow, setGlow] = useState<ComponentType<EndGlowProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current?.parentElement;
    // The WebGPU engine is a big download (~730 KB gzip), so: desktops only, never with "save data".
    const desktop = matchMedia("(pointer: fine) and (min-width: 900px)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!el || !desktop || saveData || !("gpu" in navigator) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "40% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || Glow || failed) return;
    let alive = true;
    // Ask for a GPU first: many browsers have `navigator.gpu` but no usable adapter — no download then.
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    Promise.resolve(gpu?.requestAdapter())
      .then((adapter) => {
        if (!adapter) throw new Error("no WebGPU adapter");
        return import("./EndGlowShader");
      })
      .then((m) => alive && setGlow(() => m.default))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [near, Glow, failed]);

  return (
    <div ref={host} className="s-end-glow" aria-hidden style={{ opacity: strength }}>
      {near && Glow && !failed && <Glow colors={colors} speed={speed} distortion={distortion} onUnavailable={() => setFailed(true)} />}
    </div>
  );
}
