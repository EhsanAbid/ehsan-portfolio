"use client";

import { useSyncExternalStore } from "react";
import { emit, scrollToScreens } from "@/lib/events";
import { subscribeWorld, world } from "@/components/world/store";

export type HudWork = { id: string; title: string; category: string; year: string };

/**
 * Bottom overlay while flying: links on the left, the project in focus on the right
 * ("003 · Title · Category · 3 of 12 works"). Only re-renders when the focus changes.
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
    () => `${world.focus}|${world.progress > 1.02 && world.progress < end + 0.35 ? 1 : 0}`,
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
          <>
            <span className="s-label block">{labels.elsewhere}</span>
            {socials.map((s, i) => (
              <span key={s.url}>
                <a className="s-link" href={s.url} tabIndex={on ? 0 : -1} {...(/^https?:/.test(s.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {s.label}
                </a>
                {i < socials.length - 1 ? ", " : ""}
              </span>
            ))}
          </>
        )}
      </p>
      <div className="s-hud-count" aria-live="polite">
        {w && (
          <>
            <p className="s-hud-num">{String(focus + 1).padStart(3, "0")}</p>
            <button type="button" className="s-hud-title block text-right" onClick={() => emit("open-panel", { id: `work-${w.id}` })} tabIndex={on ? 0 : -1}>
              {w.title}
            </button>
            <p className="s-label">{[w.category, w.year].filter(Boolean).join(", ")}</p>
            <p className="s-label mt-2">
              {focus + 1} {labels.of} {total} {total === 1 ? labels.work : labels.works}
            </p>
          </>
        )}
        <button type="button" className="s-link mt-1" onClick={() => scrollToScreens(0)} tabIndex={on ? 0 : -1}>
          {labels.backHome}
        </button>
      </div>
    </div>
  );
}
