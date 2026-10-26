"use client";

import { useEffect, useState } from "react";
import { emit, on } from "@/lib/events";
import { unlockedIds } from "@/components/achievements/storage";

export type HudProps = {
  show: boolean;
  avatarUrl: string | null;
  initials: string;
  levelText: string;
  progress: number; // 0..1
  xpLabel: string;
  achievementsLabel: string;
  achievementIds: string[];
  soundDefault: boolean;
  labels: { soundOn: string; soundOff: string; sky: string; terminal: string };
  terminalEnabled: boolean;
};

/**
 * HUD: player card (top-left) and quick controls (top-right).
 * Level/XP are computed on the server from real content; the achievement counter is
 * read from this browser's saved progress.
 */
export function Hud(p: HudProps) {
  const [count, setCount] = useState(0);
  const [sound, setSound] = useState(p.soundDefault);

  useEffect(() => {
    const valid = new Set(p.achievementIds);
    const update = () => {
      const n = unlockedIds().filter((id) => valid.has(id)).length;
      setCount(n);
      document.querySelectorAll("[data-achievement-count]").forEach((el) => (el.textContent = String(n)));
    };
    update();
    return on("unlocked", update);
  }, [p.achievementIds]);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("ehsan.sound");
    } catch {}
    const off = on("sound", ({ on: v }) => setSound(v));
    // Tell everyone (sound engine + this HUD) the visitor's saved preference.
    emit("sound", { on: saved === null ? p.soundDefault : saved === "1" });
    return off;
  }, [p.soundDefault]);

  const toggleSound = () => {
    const v = !sound;
    try {
      localStorage.setItem("ehsan.sound", v ? "1" : "0");
    } catch {}
    emit("sound", { on: v });
  };

  return (
    <>
      {p.show && (
        <div className="glass fixed top-3 left-3 z-50 flex items-center gap-3 !rounded-2xl px-3 py-2 md:top-4 md:left-4" data-hud>
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" width={36} height={36} className="size-9 rounded-full border border-cyan/50 object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full border border-cyan/50 bg-violet/30 font-heading text-xs font-bold text-white" aria-hidden>
              {p.initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="mono truncate text-[0.72rem] text-white">{p.levelText}</p>
            <div
              className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-white/10 md:w-36"
              role="progressbar"
              aria-label={p.xpLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(p.progress * 100)}
            >
              <div className="xp-fill h-full rounded-full" style={{ width: `${Math.max(4, p.progress * 100)}%` }} />
            </div>
            <p className="mono mt-1 hidden text-[0.65rem] text-gold sm:block">
              {p.achievementsLabel} {count}/{p.achievementIds.length}
            </p>
          </div>
        </div>
      )}
      <div className="fixed top-3 right-3 z-50 flex gap-1.5 md:top-4 md:right-4">
        <button type="button" className="hud-btn glass" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? p.labels.soundOn : p.labels.soundOff} title={sound ? p.labels.soundOn : p.labels.soundOff}>
          {sound ? "🔊" : "🔈"}
        </button>
        <button type="button" className="hud-btn glass" onClick={() => emit("sky", { id: "next" })} aria-label={p.labels.sky} title={p.labels.sky}>
          ☾
        </button>
        {p.terminalEnabled && (
          <button type="button" className="hud-btn glass mono" onClick={() => emit("terminal-toggle", {})} aria-label={p.labels.terminal} title={p.labels.terminal}>
            &gt;_
          </button>
        )}
      </div>
    </>
  );
}
