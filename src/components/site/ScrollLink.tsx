"use client";

import type { ReactNode } from "react";
import { scrollToScreens } from "@/lib/events";

/** A link-styled button that scrolls to a point of the flight (in screens). */
export function ScrollLink({ to, children, className = "s-link" }: { to: number; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => scrollToScreens(to)}>
      {children}
    </button>
  );
}
