"use client";

import { useEffect } from "react";

/**
 * Mini oscilloscopes for the Lab: each [data-scope] box gets a canvas with a sine wave whose
 * frequency rises with the topic's progress (more progress = more "signal").
 * One requestAnimationFrame loop drives all of them, and only while they are on screen.
 */
export function LabScopes() {
  useEffect(() => {
    const boxes = Array.from(document.querySelectorAll<HTMLElement>("[data-scope]"));
    if (!boxes.length) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cyan = getComputedStyle(document.documentElement).getPropertyValue("--cyan").trim() || "#22d3ee";
    // Canvases are created lazily the first time a scope scrolls into view.
    const scopes = boxes.map((box) => ({
      box,
      c: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      progress: Number(box.dataset.scope) || 0,
      visible: false,
    }));
    const io = new IntersectionObserver((es) =>
      es.forEach((e) => {
        const s = scopes.find((x) => x.box === e.target);
        if (!s) return;
        s.visible = e.isIntersecting;
        if (s.visible && !s.c) {
          s.c = document.createElement("canvas");
          s.c.className = "size-full";
          s.box.appendChild(s.c);
          s.ctx = s.c.getContext("2d");
          if (reduced) requestAnimationFrame((t) => draw(t)); // static wave: draw once
        }
      }),
    );
    scopes.forEach((s) => io.observe(s.box));

    let raf = 0;
    const draw = (time: number) => {
      for (const s of scopes) {
        if (!s.c || !s.ctx || (!s.visible && !reduced)) continue;
        const dpr = Math.min(devicePixelRatio, 2);
        const w = s.box.clientWidth;
        const h = s.box.clientHeight;
        if (s.c.width !== Math.round(w * dpr)) {
          s.c.width = Math.round(w * dpr);
          s.c.height = Math.round(h * dpr);
        }
        const g = s.ctx;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, w, h);
        // grid
        g.strokeStyle = "rgba(255,255,255,0.06)";
        g.lineWidth = 1;
        for (let x = 0; x < w; x += 16) g.strokeRect(x, 0, 0, h);
        g.beginPath();
        g.moveTo(0, h / 2);
        g.lineTo(w, h / 2);
        g.stroke();
        // signal: cycles across the box = 1 + progress/12; phase drifts slowly (< 1 Hz)
        const cycles = 1 + s.progress / 12;
        const phase = reduced ? 0 : time * 0.0012;
        g.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + Math.sin((x / w) * cycles * Math.PI * 2 - phase) * (h * 0.32);
          if (x === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokeStyle = cyan;
        g.lineWidth = 1.8;
        g.shadowColor = cyan;
        g.shadowBlur = 8;
        g.stroke();
        g.shadowBlur = 0;
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      scopes.forEach((s) => s.c?.remove());
    };
  }, []);
  return null;
}
