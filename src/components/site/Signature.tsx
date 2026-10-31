"use client";

import { useEffect, useId, useRef } from "react";
import { DEFAULT_SIGNATURE } from "./signaturePath";

/*
 * Ehsan's signature, written behind the block face (centred on the head), over and over.
 *
 * The signature is a filled outline (traced from his handwriting). To make it look written from
 * left to right we hide it behind an SVG <mask>: the mask holds one wide white rectangle with a
 * soft right edge, parked just left of the signature. Sliding that rectangle to the right reveals
 * the ink bit by bit, like a pen moving along the line. Then it stays, fades away and starts again.
 */
export function Signature({
  path,
  opacity,
  drawSec,
  holdSec,
  size,
  shiftX,
}: {
  path: string;
  opacity: number;
  drawSec: number;
  holdSec: number;
  size: number;
  /** horizontal position of the head on desktop (share of the screen width from the centre) */
  shiftX: number;
}) {
  const ink = useRef<SVGPathElement>(null);
  const wipe = useRef<SVGRectElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const el = ink.current;
    const rect = wipe.current;
    if (!el || !rect) return;
    // the rectangle spans x = -1300…0; moving it 1200 units uncovers the whole 1000-wide box incl. its soft edge
    const FULL = "translateX(1200px)";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rect.style.transform = FULL;
      el.style.opacity = String(opacity);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const anims: Animation[] = [];
    const loaderMs =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--loader-ms",
        ),
      ) || 0;

    const write = () => {
      if (!alive) return;
      el.style.opacity = String(opacity);
      // a hand speeds up mid-word and slows at the ends
      const a = rect.animate(
        [{ transform: "translateX(0px)" }, { transform: FULL }],
        {
          duration: drawSec * 1000,
          easing: "cubic-bezier(0.45, 0.05, 0.4, 1)",
          fill: "forwards",
        },
      );
      anims.push(a);
      a.onfinish = () => {
        timer = setTimeout(() => {
          const f = el.animate([{ opacity }, { opacity: 0 }], {
            duration: 1400,
            fill: "forwards",
          });
          anims.push(f);
          f.onfinish = () => {
            el.style.opacity = "0";
            // drop finished animations so the mask is back at the start before the next pass
            anims.splice(0).forEach((x) => x.cancel());
            timer = setTimeout(write, 700);
          };
        }, holdSec * 1000);
      };
    };
    timer = setTimeout(write, loaderMs + 500);
    return () => {
      alive = false;
      clearTimeout(timer);
      anims.forEach((x) => x.cancel());
    };
  }, [path, opacity, drawSec, holdSec]);

  return (
    <svg
      className="s-sign"
      viewBox="0 0 1000 400"
      aria-hidden
      style={
        {
          "--sign-w": `${size * 100}vw`,
          "--sign-x": shiftX,
          opacity: "calc(1 - var(--p, 0) * 1.1)",
        } as React.CSSProperties
      }
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.86" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${id}m`}
          maskUnits="userSpaceOnUse"
          x="-50"
          y="-50"
          width="1100"
          height="500"
        >
          <rect
            ref={wipe}
            x="-1300"
            y="-50"
            width="1300"
            height="500"
            fill={`url(#${id}g)`}
          />
        </mask>
      </defs>
      <path
        ref={ink}
        d={path || DEFAULT_SIGNATURE}
        fill="var(--line)"
        fillRule="evenodd"
        mask={`url(#${id}m)`}
        style={{ opacity: 0 }}
      />
    </svg>
  );
}
