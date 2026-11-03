"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Site } from "@/schema/site";
import { hasWebGL, initialTier, prefersReducedMotion, type Tier } from "@/lib/fps";
import { samplePortrait, type Sample } from "./sampler";
import { setWorld, subscribeWorld, world } from "./store";
import type { CardWork } from "./Cards";
import { ATLAS_GRID, buildAtlas, type Atlas } from "./atlas";
import { BLOCK_MIN, screenH } from "./layout";

// three.js + react-three-fiber live in their own chunk, loaded when the browser is idle.
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

export type WorldClientProps = {
  photoKey: string | null;
  /** Project images that become texture tiles of the face. */
  imageKeys: string[];
  initials: string;
  effects: Site["effects"];
  works: CardWork[];
  colors: { panel: string; text: string; muted: string };
};

function whenIdle(fn: () => void, timeout = 1200) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 300);
}

/**
 * Draws the block face with the plain 2D canvas API. It appears almost instantly (the photo
 * sample is a few KB) and is what reduced-motion / no-WebGL visitors keep; in 3D mode the
 * WebGL scene fades in over it and this poster is removed.
 */
function drawPoster(canvas: HTMLCanvasElement, sample: Sample, p: Site["effects"]["portrait"], atlas: Atlas | null) {
  const dpr = Math.min(devicePixelRatio, 2);
  const W = canvas.clientWidth || innerWidth;
  const H = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g = canvas.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  if (!p.enabled) return;
  const narrow = W < 900 || W < H;
  const height = narrow ? H * 0.78 * p.size : H * p.size;
  const cx = narrow ? W / 2 : W / 2 + p.offsetX * W;
  const cy = narrow ? H / 2 - 0.09 * H : H / 2 + 0.035 * H;
  const cell = height / sample.rows;
  const left = cx - (sample.cols * cell) / 2;
  const top = cy - height / 2;
  const tileSize = atlas ? atlas.canvas.width / ATLAS_GRID : 0;
  let k = 0;
  for (const c of sample.cells) {
    const s = cell * (1 - p.gap) * (BLOCK_MIN + (1 - BLOCK_MIN) * c.lum);
    const x = left + c.x * cell + (cell - s) / 2;
    const y = top + c.y * cell + (cell - s) / 2;
    // same idea as the shader: the block's tone first, the texture tile only as soft detail on top
    const b = p.brightness * 255;
    g.fillStyle = `rgb(${Math.min(255, c.r * b)},${Math.min(255, c.g * b)},${Math.min(255, c.b * b)})`;
    g.fillRect(x, y, s, s);
    if (atlas && p.texture > 0) {
      const pool = c.spark ? atlas.vivid : atlas.neutral;
      const t = pool[(k++ * 7919) % pool.length];
      g.globalCompositeOperation = "soft-light";
      g.globalAlpha = p.texture;
      g.drawImage(atlas.canvas, (t % ATLAS_GRID) * tileSize + 3, Math.floor(t / ATLAS_GRID) * tileSize + 3, tileSize - 6, tileSize - 6, x, y, s, s);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
    }
  }
}

export function World({ photoKey, imageKeys, initials, effects, works, colors }: WorldClientProps) {
  const poster = useRef<HTMLCanvasElement>(null);
  const [sampled, setSampled] = useState<{ sample: Sample; font: string } | null>(null);
  const [live, setLive] = useState(false); // WebGL has drawn its first frame
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const keysSig = imageKeys.join(",");

  // Texture tiles for the blocks (project images + generated mini-thumbnails).
  useEffect(() => {
    let alive = true;
    buildAtlas(keysSig ? keysSig.split(",") : []).then((a) => alive && setAtlas(a));
    return () => {
      alive = false;
    };
  }, [keysSig]);
  // Mode and tier live in the shared store; this re-renders only when one of them changes.
  const snap = useSyncExternalStore(
    subscribeWorld,
    () => `${world.mode}|${world.ready ? world.tier : ""}`,
    () => "pending|",
  );
  const [mode, tier] = snap.split("|") as ["pending" | "fly" | "static", Tier | ""];
  // The block count is picked once per visit from the first tier. Re-sampling on every tier
  // change rebuilt the whole face (it visibly re-shuffled); now a tier change only adjusts the
  // pixel ratio and the background dust.
  const [startTier, setStartTier] = useState<Tier | "">("");
  if (tier && !startTier) setStartTier(tier);
  const cols = startTier ? effects.portrait.columns[startTier] : null;
  const staticMode = mode === "static";
  const sample = sampled?.sample ?? null;

  // Device check: quality tier, then 3D (needs WebGL, no reduced motion) or the static fallback.
  useEffect(() => {
    const tier = initialTier();
    if (prefersReducedMotion()) {
      setWorld({ tier, mode: "static", ready: true });
      return;
    }
    setWorld({ tier, ready: true });
    whenIdle(() => {
      if (hasWebGL()) setWorld({ tier: world.tier, mode: "fly" });
      else {
        document.documentElement.classList.remove("s-fly");
        setWorld({ mode: "static" });
      }
    });
  }, []);

  // Sample the photo for the current block count (re-sampled if the tier changes).
  useEffect(() => {
    if (!cols) return;
    let alive = true;
    // The resolved family list of the display font (canvas text can't read CSS variables).
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif";
    samplePortrait({
      photoKey,
      cols,
      crop: effects.portrait.crop,
      sideCrop: effects.portrait.sideCrop,
      // keep every block at least ~6 px tall on this screen (same height formula as the scene)
      maxRows: Math.floor((screenH() * (innerWidth < 900 || innerWidth < screenH() ? 0.78 : 1) * effects.portrait.size) / 6),
      initials,
      fontFamily: font,
      palette: [effects.portrait.palette.a, effects.portrait.palette.b, effects.portrait.palette.c, effects.portrait.palette.d],
      colourful: effects.portrait.colourful,
      mono: effects.portrait.mono,
    }).then((s) => alive && setSampled({ sample: s, font }));
    return () => {
      alive = false;
    };
  }, [cols, photoKey, initials, effects.portrait.palette, effects.portrait.colourful, effects.portrait.crop, effects.portrait.sideCrop, effects.portrait.mono, effects.portrait.size]);

  // Draw (and redraw on resize) the 2D poster until WebGL takes over.
  useEffect(() => {
    if (!sample || live || !poster.current) return;
    const c = poster.current;
    const draw = () => drawPoster(c, sample, effects.portrait, atlas);
    draw();
    addEventListener("resize", draw);
    return () => removeEventListener("resize", draw);
  }, [sample, live, effects.portrait, atlas]);

  // Scroll → progress (in screens) for the 3D scene, and --p for the CSS fades.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = scrollY / screenH();
      setWorld({ progress: p });
      document.documentElement.style.setProperty("--p", String(Math.min(p, 2).toFixed(4)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  // Mouse/finger position (normalised) for the ripple and the camera lean.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      world.pointer = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 };
    };
    const leave = () => (world.pointer = null);
    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    addEventListener("blur", leave);
    return () => {
      removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      removeEventListener("blur", leave);
    };
  }, []);

  // Smooth scrolling on desktop (Lenis), loaded lazily.
  useEffect(() => {
    if (!effects.motion.smoothScroll || prefersReducedMotion() || matchMedia("(pointer: coarse)").matches) return;
    let lenis: { destroy: () => void } | undefined;
    let cancelled = false;
    whenIdle(() =>
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        const l = new Lenis({ lerp: 0.11, autoRaf: true });
        (window as unknown as { __lenis?: unknown }).__lenis = l;
        lenis = l;
      }),
    );
    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, [effects.motion.smoothScroll]);

  // Anonymous visit counter: once per browser session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("s.visit")) return;
      sessionStorage.setItem("s.visit", "1");
    } catch {
      return;
    }
    fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "visits" }), keepalive: true }).catch(() => {});
  }, []);

  const onFirstFrame = useCallback(() => setLive(true), []);

  return (
    <>
      <canvas
        ref={poster}
        aria-hidden
        className="s-static"
        style={{
          position: staticMode ? "absolute" : "fixed",
          height: staticMode ? "100svh" : undefined,
          opacity: live ? 0 : 1,
          transition: "opacity 0.8s",
        }}
      />
      {mode === "fly" && sampled && atlas && (
        <WorldCanvas sample={sampled.sample} atlas={atlas} effects={effects} works={works} colors={colors} font={sampled.font} onFirstFrame={onFirstFrame} />
      )}
    </>
  );
}
