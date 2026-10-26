"use client";

import { useEffect } from "react";
import { emit } from "@/lib/events";

/**
 * Site-wide pointer interactions via event delegation (one listener, any number of elements):
 *  • [data-tilt]   → 3D tilt + holographic sheen following the pointer (mouse and touch)
 *  • [data-event]  → fires an achievement trigger (e.g. the email button)
 *  • [data-achievement-click] → counts clicks for "click element N times" achievements
 *  • [data-rocket] → back-to-top launch animation
 */
export function Interactions({ tilt }: { tilt: boolean }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let tilted: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (!tilt || reduced) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tilt]");
      if (tilted && tilted !== el) reset(tilted);
      tilted = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0..1 across the card
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.dataset.tilting = "";
    };
    const reset = (el: HTMLElement) => {
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      delete el.dataset.tilting;
    };
    const onLeave = (e: PointerEvent) => {
      if (tilted && (e.pointerType !== "mouse" || !tilted.contains(e.relatedTarget as Node))) {
        reset(tilted);
        tilted = null;
      }
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const ev = t.closest<HTMLElement>("[data-event]");
      if (ev) emit("trigger", { type: "custom-event", param: ev.dataset.event });
      const counted = t.closest<HTMLElement>("[data-achievement-click]");
      if (counted) emit("trigger", { type: "click-element", param: counted.dataset.achievementClick });
      const rocket = t.closest<HTMLElement>("[data-rocket]");
      if (rocket) {
        rocket.classList.remove("launch");
        void rocket.offsetWidth; // restart the CSS animation
        rocket.classList.add("launch");
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
    document.addEventListener("pointerup", onLeave);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      document.removeEventListener("pointerup", onLeave);
      document.removeEventListener("click", onClick);
    };
  }, [tilt]);
  return null;
}
