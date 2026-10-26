"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen 2D canvas for short celebrations: matrix rain and confetti.
 * Lazy-loaded on the first celebration and removed again when it finishes.
 */
export default function FxOverlay({ kind, seconds, onDone }: { kind: "matrix" | "confetti"; seconds: number; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio, 2);
    const resize = () => {
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const css = getComputedStyle(document.documentElement);
    const palette = ["--cyan", "--violet", "--pink", "--gold"].map((v) => css.getPropertyValue(v).trim() || "#fff");
    const end = performance.now() + seconds * 1000;
    let raf = 0;

    if (kind === "matrix") {
      // Matrix rain: one falling "drop" per column; each frame draws a random glyph at the drop
      // and paints a translucent black rectangle over everything, which leaves fading trails.
      const size = 16;
      const cols = Math.ceil(innerWidth / size);
      const drops = Array.from({ length: cols }, () => Math.random() * -50);
      const glyphs = "アカサタナハマヤラワ01ABCDEFabcdef<>/{}ehsan";
      const frame = (t: number) => {
        g.fillStyle = "rgba(5, 6, 15, 0.12)";
        g.fillRect(0, 0, innerWidth, innerHeight);
        g.font = `${size}px monospace`;
        drops.forEach((y, i) => {
          g.fillStyle = Math.random() > 0.96 ? "#fff" : palette[0];
          g.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y * size);
          drops[i] = y * size > innerHeight && Math.random() > 0.975 ? 0 : y + 1;
        });
        if (t < end) raf = requestAnimationFrame(frame);
        else onDone();
      };
      raf = requestAnimationFrame(frame);
    } else {
      // Confetti: simple projectiles — gravity pulls them down, air drag slows them, they spin.
      const parts = Array.from({ length: 160 }, () => ({
        x: innerWidth / 2,
        y: innerHeight * 0.55,
        vx: (Math.random() - 0.5) * 16,
        vy: -8 - Math.random() * 12,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: palette[(Math.random() * palette.length) | 0],
        w: 6 + Math.random() * 6,
      }));
      const frame = (t: number) => {
        g.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of parts) {
          p.vy += 0.35; // gravity
          p.vx *= 0.99; // drag
          p.x += p.vx;
          p.y += p.vy;
          p.r += p.vr;
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.r);
          g.fillStyle = p.c;
          g.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2);
          g.restore();
        }
        if (t < end) raf = requestAnimationFrame(frame);
        else onDone();
      };
      raf = requestAnimationFrame(frame);
    }
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [kind, seconds, onDone]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[140] size-full" />;
}
