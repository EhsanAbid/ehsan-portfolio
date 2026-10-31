"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { on } from "@/lib/events";
import type { TerminalData } from "./types";

// The terminal window is only downloaded the first time someone opens it.
const TerminalWindow = dynamic(() => import("./TerminalWindow"), { ssr: false });

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Opens the hidden terminal with ` or ~ (when not typing in a field) or the HUD button. */
export function TerminalLauncher({ data }: { data: TerminalData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!data.cfg.enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // e.code = the physical key, so it also works on non-US layouts (e.g. Bangla).
      if ((e.key === "`" || e.key === "~" || e.code === "Backquote") && !typing(e.target)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    addEventListener("keydown", onKey);
    const off = on("terminal-toggle", () => setOpen((o) => !o));
    return () => {
      removeEventListener("keydown", onKey);
      off();
    };
  }, [data.cfg.enabled]);


  if (!open) return null;
  return <TerminalWindow data={data} onClose={() => setOpen(false)} />;
}
