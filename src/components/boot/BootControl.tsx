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
    const finish = () => {
      if (finished) return;
      finished = true;
      d.dataset.boot = "done";
      emit("boot-done", {});
      cleanup();
    };
    const timer = setTimeout(finish, remaining);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") finish();
    };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", finish);
    function cleanup() {
      clearTimeout(timer);
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", finish);
    }
    return cleanup;
  }, []);
  return null;
}
