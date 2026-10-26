"use client";

import { useEffect } from "react";
import { emit } from "@/lib/events";

/** Skip on any key / tap, and announce "boot-done" so the Big Bang can start. */
export function BootControl() {
  useEffect(() => {
    const d = document.documentElement;
    const mode = d.dataset.boot;
    if (!mode || mode === "off" || mode === "done") {
      emit("boot-done", {});
      return;
    }
    const ms = parseFloat(getComputedStyle(d).getPropertyValue("--boot-ms")) || 0;
    // The CSS animation started at first paint; finish relative to page start.
    const remaining = Math.max(0, ms - performance.now());
    let finished = false;
    // `skipped`: hide the overlay now. At the natural end the CSS animation has already hidden
    // it, so we don't touch the DOM at all (avoids restyling the whole page at that moment).
    const finish = (skipped: boolean) => {
      if (finished) return;
      finished = true;
      (window as unknown as { __bootDone?: boolean }).__bootDone = true;
      if (skipped) d.dataset.boot = "done";
      emit("boot-done", {});
      cleanup();
    };
    const timer = setTimeout(() => finish(false), remaining);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") finish(true);
    };
    const onPointer = () => finish(true);
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onPointer);
    function cleanup() {
      clearTimeout(timer);
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onPointer);
    }
    return cleanup;
  }, []);
  return null;
}
