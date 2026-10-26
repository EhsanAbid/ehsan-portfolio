"use client";

import { useEffect, useRef } from "react";
import { subscribe, universe } from "@/components/space/store";

/**
 * Comet cursor + magnetic buttons (desktop / fine pointers only).
 * The comet is a small canvas: a glowing head that eases toward the pointer (linear
 * interpolation, "lerp") and a tail made from the last N head positions, drawn thinner and
 * more transparent the older they are. It grows over links/buttons. The loop sleeps when idle.
 */
export function Cursor({ style, trail, trailLength, magnetic }: { style: "comet" | "dot" | "system"; trail: boolean; trailLength: number; magnetic: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    // ── magnetic buttons: pull [data-magnetic] towards the pointer while hovering ──
    let magnet: HTMLElement | null = null;
    const onMagnet = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-magnetic]");
      if (magnet && magnet !== el) magnet.style.transform = "";
      magnet = el;
      if (!el || magnetic <= 0) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * magnetic * 0.4}px, ${dy * magnetic * 0.4}px)`;
    };
    document.addEventListener("pointermove", onMagnet, { passive: true });

    if (style === "system") return () => document.removeEventListener("pointermove", onMagnet);

    const c = ref.current!;
    const g = c.getContext("2d")!;
    root.classList.add("comet-cursor");
    const dpr = Math.min(devicePixelRatio, 2);
    const resize = () => {
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const css = getComputedStyle(root);
    const cyan = css.getPropertyValue("--cyan").trim() || "#22d3ee";
    let x = -100, y = -100, tx = -100, ty = -100, size = 5, targetSize = 5;
    const points: { x: number; y: number }[] = [];
    let raf = 0;
    let idle = 0;
    // Low quality tier: no trail (spec §9.1).
    let useTrail = trail && style === "comet" && universe.tier !== "low";
    const unsub = subscribe(() => (useTrail = trail && style === "comet" && universe.tier !== "low"));

    const frame = () => {
      x += (tx - x) * 0.35; // lerp: move 35% of the remaining distance each frame
      y += (ty - y) * 0.35;
      size += (targetSize - size) * 0.2;
      points.unshift({ x, y });
      points.length = Math.min(points.length, useTrail ? trailLength : 1);
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = points.length - 1; i > 0; i--) {
        const k = 1 - i / points.length;
        g.strokeStyle = cyan;
        g.globalAlpha = k * 0.5;
        g.lineWidth = size * k * 1.4;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(points[i].x, points[i].y);
        g.lineTo(points[i - 1].x, points[i - 1].y);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.shadowColor = cyan;
      g.shadowBlur = 16;
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(x, y, size * 0.6, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
      if (targetSize > 6) {
        g.strokeStyle = cyan;
        g.globalAlpha = 0.6;
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(x, y, size * 2, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }
      // keep animating until the comet has caught up and the tail has faded
      idle = Math.abs(tx - x) + Math.abs(ty - y) < 0.3 ? idle + 1 : 0;
      raf = idle > trailLength + 5 ? 0 : requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      const hot = (e.target as HTMLElement).closest("a, button, [role=button], input, textarea, select, label, .star");
      targetSize = hot ? 9 : 5;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      tx = ty = -100;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      root.classList.remove("comet-cursor");
      document.removeEventListener("pointermove", onMagnet);
      document.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      removeEventListener("resize", resize);
    };
  }, [style, trail, trailLength, magnetic]);

  if (style === "system") return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[300] hidden size-full [@media(pointer:fine)]:block" />;
}
