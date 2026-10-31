"use client";

import { useEffect, useRef } from "react";

/*
 * "Abid" written by hand across the background, over and over.
 *
 * The signature is ONE SVG path (a pen stroke drawn in a 1000×400 box, plus the i-dot and an
 * underline as extra sub-paths). To make it "write itself" we use a classic trick: set the
 * stroke's dash pattern to one dash as long as the whole path, then animate the dash offset
 * from that length to 0 — the visible part of the line grows along the path like ink.
 * Then it waits, fades out and writes again. Admins can paste their real signature's path.
 */
export const DEFAULT_SIGNATURE =
  "M 70 330 C 120 300, 170 190, 215 95 C 230 65, 250 60, 252 95 C 255 160, 262 250, 290 330 " +
  "C 250 280, 170 245, 105 255 C 180 232, 285 228, 360 236 " +
  "C 395 240, 410 150, 432 80 C 442 45, 470 40, 462 85 C 452 150, 425 250, 418 322 " +
  "C 440 268, 492 250, 505 282 C 515 318, 465 340, 440 318 C 480 305, 520 300, 548 290 " +
  "C 560 284, 568 262, 575 248 C 572 280, 572 312, 590 320 C 605 318, 622 300, 632 284 " +
  "C 618 262, 588 270, 590 300 C 592 330, 640 330, 662 290 C 682 220, 700 120, 712 60 " +
  "C 718 120, 700 240, 698 322 C 740 300, 820 262, 945 250 " +
  "M 586 205 C 590 200, 596 200, 598 204 " +
  "M 95 372 C 330 352, 640 360, 930 318";

export function Signature({
  path,
  width,
  opacity,
  drawSec,
  holdSec,
  size,
}: {
  path: string;
  width: number;
  opacity: number;
  drawSec: number;
  holdSec: number;
  size: number;
}) {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.strokeDashoffset = "0";
      el.style.opacity = String(opacity);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let anim: Animation | null = null;
    const loaderMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--loader-ms")) || 0;

    const write = () => {
      if (!alive) return;
      el.style.opacity = String(opacity);
      // a pen doesn't move at constant speed: ease in and out
      anim = el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: drawSec * 1000,
        easing: "cubic-bezier(0.55, 0.1, 0.35, 1)",
        fill: "forwards",
      });
      anim.onfinish = () => {
        timer = setTimeout(() => {
          anim = el.animate([{ opacity }, { opacity: 0 }], { duration: 1400, fill: "forwards" });
          anim.onfinish = () => {
            el.style.opacity = "0";
            timer = setTimeout(write, 700);
          };
        }, holdSec * 1000);
      };
    };
    el.style.strokeDashoffset = `${len}`;
    timer = setTimeout(write, loaderMs + 500);
    return () => {
      alive = false;
      clearTimeout(timer);
      anim?.cancel();
    };
  }, [path, opacity, drawSec, holdSec]);

  return (
    <svg
      className="s-sign"
      viewBox="0 0 1000 400"
      aria-hidden
      style={{ width: `${size * 100}vw`, opacity: "calc(1 - var(--p, 0) * 1.1)" }}
    >
      <path
        ref={ref}
        d={path || DEFAULT_SIGNATURE}
        fill="none"
        stroke="var(--line)"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ opacity: 0 }}
      />
    </svg>
  );
}
