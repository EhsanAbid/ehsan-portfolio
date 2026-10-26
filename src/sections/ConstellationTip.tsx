"use client";

import { useEffect, useRef, useState } from "react";
import { emit } from "@/lib/events";

type Tip = { id: string; x: string; y: string; name: string; status: string; lines: string[] };

/**
 * Tooltip for the server-rendered constellation: one delegated listener on the SVG reads the
 * star's data-* attributes. Mouse: hover. Touch: tap (tap again to close).
 */
export function ConstellationTip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const svg = ref.current?.parentElement?.querySelector("svg");
    if (!svg) return;
    let current: string | null = null;
    const read = (g: SVGGElement): Tip => ({
      id: g.dataset.star!,
      x: g.dataset.x!,
      y: g.dataset.y!,
      name: g.dataset.name!,
      status: g.dataset.status!,
      lines: (g.dataset.lines ?? "").split("\n").filter(Boolean),
    });
    const show = (g: SVGGElement | null) => {
      svg.querySelectorAll(".star.active").forEach((el) => el.classList.remove("active"));
      if (!g) {
        current = null;
        return setTip(null);
      }
      g.classList.add("active");
      current = g.dataset.star!;
      setTip(read(g));
      emit("trigger", { type: "custom-event", param: "skill-inspect", key: current });
    };
    const star = (e: Event) => (e.target as Element).closest<SVGGElement>("[data-star]");
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const g = star(e);
      if (g && g.dataset.star !== current) show(g);
    };
    const leave = (e: PointerEvent) => e.pointerType === "mouse" && show(null);
    const click = (e: MouseEvent) => {
      const g = star(e);
      if (!g) return show(null);
      show(g.dataset.star === current ? null : g);
    };
    svg.addEventListener("pointerover", over);
    svg.addEventListener("pointerleave", leave);
    svg.addEventListener("click", click);
    return () => {
      svg.removeEventListener("pointerover", over);
      svg.removeEventListener("pointerleave", leave);
      svg.removeEventListener("click", click);
    };
  }, []);

  return (
    <div ref={ref}>
      {tip && (
        <div
          className="glass pointer-events-none absolute z-10 w-56 p-3 text-sm"
          style={{ left: `${tip.x}%`, top: `${tip.y}%`, transform: "translate(-50%, 18px)" }}
          role="status"
        >
          <p className="font-semibold text-white">{tip.name}</p>
          <p className="mono mt-0.5 text-xs text-cyan">{tip.status}</p>
          {tip.lines.map((l) => (
            <p key={l} className="mt-1 text-xs text-muted">
              {l}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
