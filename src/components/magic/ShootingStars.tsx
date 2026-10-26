"use client";

import { useEffect, useState } from "react";
import { emit } from "@/lib/events";
import { sparkle } from "@/lib/sound";

type Star = { id: number; top: number; left: number; angle: number };

/** A shooting star crosses the sky every min–max seconds. Catch one to make a wish. */
export function ShootingStars({ min, max, label }: { min: number; max: number; label: string }) {
  const [star, setStar] = useState<Star | null>(null);
  const [caught, setCaught] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const wait = (min + Math.random() * Math.max(0, max - min)) * 1000;
      t = setTimeout(() => {
        if (!document.hidden) {
          setStar({ id: Date.now(), top: 5 + Math.random() * 35, left: 10 + Math.random() * 60, angle: 20 + Math.random() * 20 });
          setTimeout(() => setStar(null), 2600);
        }
        schedule();
      }, wait);
    };
    schedule();
    return () => clearTimeout(t);
  }, [min, max]);

  return (
    <>
      {star && (
        <button
          key={star.id}
          type="button"
          tabIndex={-1}
          aria-label={label}
          className="shooting-star"
          style={{ top: `${star.top}vh`, left: `${star.left}vw`, "--angle": `${star.angle}deg` } as React.CSSProperties}
          onClick={(e) => {
            setCaught({ x: e.clientX, y: e.clientY });
            setStar(null);
            sparkle();
            emit("trigger", { type: "custom-event", param: "shooting-star" });
            setTimeout(() => setCaught(null), 900);
          }}
        >
          <span />
        </button>
      )}
      {caught && <span className="star-burst" style={{ left: caught.x, top: caught.y }} aria-hidden />}
    </>
  );
}
