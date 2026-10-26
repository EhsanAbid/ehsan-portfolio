"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Draws the "orbit" through the journey checkpoints: a smooth curve that passes through
 * every dot (Catmull-Rom spline converted to Bézier curves), revealed as you scroll by
 * animating stroke-dashoffset. Purely decorative; the timeline is readable without it.
 */
export function JourneyPath() {
  const ref = useRef<SVGSVGElement>(null);
  const [d, setD] = useState("");

  useEffect(() => {
    const svg = ref.current;
    const list = svg?.parentElement;
    if (!svg || !list) return;
    const build = () => {
      const box = list.getBoundingClientRect();
      const pts = Array.from(list.querySelectorAll<HTMLElement>(".journey-dot")).map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top] as const;
      });
      if (pts.length < 2) return setD("");
      // Catmull-Rom → cubic Bézier: control points are 1/6 of the neighbours' difference.
      let path = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        path += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
      }
      setD(path);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = ref.current;
    const path = svg?.querySelector<SVGPathElement>("path.journey-progress");
    if (!svg || !path || !d) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      // 0 when the list's top reaches 70% of the screen, 1 when its bottom does.
      const t = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      path.style.strokeDashoffset = `${len * (1 - t)}`;
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [d]);

  return (
    <svg ref={ref} aria-hidden className="pointer-events-none absolute inset-0 hidden size-full overflow-visible md:block">
      {d && (
        <>
          <path d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
          <path className="journey-progress" d={d} fill="none" stroke="url(#journey-grad)" strokeWidth={2.5} strokeLinecap="round" />
          <defs>
            <linearGradient id="journey-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--cyan)" />
              <stop offset="1" stopColor="var(--violet)" />
            </linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
}
