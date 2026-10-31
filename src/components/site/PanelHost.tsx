"use client";

import { useEffect } from "react";
import { on, scrollToScreens } from "@/lib/events";
import { cardProgress } from "@/components/world/layout";

/**
 * Opens and closes the glass panels. Panel links are normal `#about`-style links; with
 * JavaScript we intercept them so the page doesn't jump, keep the URL in sync (shareable
 * links, Back button works), close on Escape and move keyboard focus into the panel.
 * Opening a project also flies the camera to that project's card behind the panel.
 */
export function PanelHost({ workIds, perWork }: { workIds: string[]; perWork: number }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("s-js"); // switches off the no-JS :target fallback
    let lastFocus: HTMLElement | null = null;

    const panels = () => Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"));
    const show = (id: string, fromUser: boolean) => {
      const target = id ? document.getElementById(id) : null;
      const isPanel = !!target?.hasAttribute("data-panel");
      panels().forEach((p) => (p === target && isPanel ? p.setAttribute("data-open", "") : p.removeAttribute("data-open")));
      if (!isPanel) {
        lastFocus?.focus?.();
        lastFocus = null;
        return;
      }
      if (fromUser && !lastFocus) lastFocus = document.activeElement as HTMLElement;
      target!.querySelector<HTMLElement>(".s-panel-body")?.scrollTo({ top: 0 });
      requestAnimationFrame(() => target!.querySelector<HTMLElement>("h2, [data-close]")?.focus({ preventScroll: true }));
      // A project: bring its card into focus behind the panel (3D mode only).
      const m = /^work-(.+)$/.exec(id);
      if (m && root.classList.contains("s-fly")) {
        const i = workIds.indexOf(m[1]);
        if (i >= 0) scrollToScreens(cardProgress(i, perWork));
      }
    };
    const open = (id: string) => {
      const url = id ? `#${id}` : location.pathname + location.search;
      if (location.hash !== (id ? `#${id}` : "")) history.pushState(null, "", url);
      show(id, true);
    };

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || e.metaKey || e.ctrlKey) return;
      const id = a.getAttribute("href")!.slice(1);
      if (id === "top") {
        e.preventDefault();
        open("");
        scrollToScreens(0);
        return;
      }
      if (id === "_" || a.hasAttribute("data-close")) {
        e.preventDefault();
        open("");
        return;
      }
      if (document.getElementById(id)?.hasAttribute("data-panel")) {
        e.preventDefault();
        open(id);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panels().some((p) => p.hasAttribute("data-open"))) open("");
    };
    const onPop = () => show(location.hash.slice(1), false);

    // headings receive focus programmatically
    panels().forEach((p) => p.querySelector("h2")?.setAttribute("tabindex", "-1"));
    document.addEventListener("click", onClick);
    addEventListener("keydown", onKey);
    addEventListener("popstate", onPop);
    const off = on("open-panel", ({ id }) => open(id));
    if (location.hash.length > 1) show(location.hash.slice(1), false);
    return () => {
      document.removeEventListener("click", onClick);
      removeEventListener("keydown", onKey);
      removeEventListener("popstate", onPop);
      off();
    };
  }, [workIds, perWork]);
  return null;
}
