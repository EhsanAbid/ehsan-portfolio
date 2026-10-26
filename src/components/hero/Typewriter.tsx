"use client";

import { useEffect, useState } from "react";

/**
 * Typewriter taglines. The server renders the first tagline as plain text, so the line is
 * readable before (and without) JavaScript; the typing loop starts after hydration.
 * Screen readers get the full list from a hidden paragraph in the hero instead.
 */
export function Typewriter({ lines }: { lines: string[] }) {
  const [text, setText] = useState(lines[0] ?? "");

  useEffect(() => {
    if (lines.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let shown = lines[0];
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (deleting) {
        shown = shown.slice(0, -1);
        if (!shown) {
          deleting = false;
          i = (i + 1) % lines.length;
        }
        setText(shown);
        timer = setTimeout(tick, 28);
      } else {
        const next = lines[i];
        shown = next.slice(0, shown.length + 1);
        setText(shown);
        if (shown === next) {
          deleting = true;
          timer = setTimeout(tick, 2200);
        } else timer = setTimeout(tick, 55 + Math.random() * 40);
      }
    };
    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, [lines]);

  return (
    <span aria-hidden className="whitespace-pre-wrap">
      {text}
    </span>
  );
}
