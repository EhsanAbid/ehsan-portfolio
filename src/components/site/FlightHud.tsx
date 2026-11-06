"use client";

import { useSyncExternalStore } from "react";
import { emit, scrollToScreens } from "@/lib/events";
import { subscribeWorld, world } from "@/components/world/store";

export type HudWork = { id: string; title: string; category: string; year: string };

/**
 * Bottom overlay while flying: links on the left, the project in focus on the right
 * (title, type, "3 of 12 projects"). Only re-renders when the focus changes.
 */
export function FlightHud({
  works,
  socials,
  end,
  labels,
}: {
  works: HudWork[];
  socials: { label: string; url: string }[];
  end: number;
  labels: { of: string; works: string; work: string; open: string; elsewhere: string; backHome: string };
}) {
  const snap = useSyncExternalStore(
    subscribeWorld,
    () => `${world.focus}|${world.progress > 1.02 && world.progress < end - 0.1 && !world.panel ? 1 : 0}`,
    () => "-1|0",
  );
  const [f, onFlag] = snap.split("|");
  const focus = Number(f);
  const w = works[focus];
  const on = onFlag === "1";
  const total = works.length;

  return (
    <div className={`s-hud ${on ? "on" : ""}`} aria-hidden={!on}>
      <p>
        {socials.length > 0 && (
          <span className="s-hud-links">
            {socials.map((s) => (
              <a key={s.url} className="s-link" href={s.url} tabIndex={on ? 0 : -1} {...(/^https?:/.test(s.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {s.label}
              </a>
            ))}
          </span>
        )}
      </p>
      <div className="s-hud-count" aria-live="polite">
        {w && (
          <>
            <button type="button" className="s-btn" aria-label={`${labels.open}: ${w.title}`} onClick={() => emit("open-panel", { id: `work-${w.id}` })} tabIndex={on ? 0 : -1}>
              {labels.open}
            </button>
            <p className="s-hud-meta">
              {[w.category, w.year].filter(Boolean).join(", ")}. {focus + 1} {labels.of} {total} {total === 1 ? labels.work : labels.works}
            </p>
          </>
        )}
        <button type="button" className="s-link s-hud-top" onClick={() => scrollToScreens(0)} tabIndex={on ? 0 : -1}>
          {labels.backHome}
        </button>
      </div>
    </div>
  );
}
