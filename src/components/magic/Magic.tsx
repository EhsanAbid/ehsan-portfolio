"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { Achievement, Site } from "@/schema/site";
import { emit, on } from "@/lib/events";
import { configureSound, fanfare } from "@/lib/sound";
import { AchievementEngine } from "@/components/achievements/Engine";
import { TerminalLauncher } from "@/components/terminal/TerminalLauncher";
import type { TerminalData } from "@/components/terminal/types";
import { Cursor } from "@/components/cursor/Cursor";
import { ShootingStars } from "./ShootingStars";

const FxOverlay = dynamic(() => import("./FxOverlay"), { ssr: false });

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

export type MagicProps = {
  achievements: Achievement[];
  toastTitle: string;
  terminal: TerminalData;
  effects: Pick<Site["effects"], "cursor" | "shootingStars" | "konami" | "sound">;
  cursorStyle: Site["design"]["cursorStyle"];
  shootingStarLabel: string;
  funFact: string | null;
};

/** The magic layer (spec §3): everything playful, wired together through the event bus. */
export function Magic(p: MagicProps) {
  const [fx, setFx] = useState<{ kind: "matrix" | "confetti"; seconds: number; id: number } | null>(null);
  const done = useCallback(() => setFx(null), []);

  // Sound engine follows the HUD toggle / terminal `sound on|off`.
  useEffect(() => on("sound", ({ on: v }) => configureSound(v, p.effects.sound.volume)), [p.effects.sound.volume]);

  // Celebrations (skipped for reduced motion — the achievement toast still appears).
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const offs = [
      on("matrix", () => !reduced && setFx({ kind: "matrix", seconds: 6, id: Date.now() })),
      on("confetti", () => !reduced && setFx({ kind: "confetti", seconds: 3, id: Date.now() })),
      on("god-mode", () => {
        fanfare();
        if (!reduced) setFx({ kind: "matrix", seconds: p.effects.konami.durationSec, id: Date.now() });
      }),
    ];
    return () => offs.forEach((o) => o());
  }, [p.effects.konami.durationSec]);

  // Konami code → god mode (rainbow particles + matrix rain).
  useEffect(() => {
    if (!p.effects.konami.enabled) return;
    let buf: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      buf = [...buf, e.key.toLowerCase()].slice(-KONAMI.length);
      if (buf.join() === KONAMI.join()) {
        buf = [];
        emit("god-mode", {});
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [p.effects.konami.enabled]);

  // A little secret for developers who open the console.
  useEffect(() => {
    if (p.funFact) console.log(`%c> ${p.funFact}`, "color:#22d3ee;font:14px monospace");
  }, [p.funFact]);

  return (
    <>
      <AchievementEngine achievements={p.achievements} toastTitle={p.toastTitle} />
      <TerminalLauncher data={p.terminal} />
      {p.effects.shootingStars.enabled && (
        <ShootingStars min={p.effects.shootingStars.minIntervalSec} max={p.effects.shootingStars.maxIntervalSec} label={p.shootingStarLabel} />
      )}
      {p.effects.cursor.enabled && (
        <Cursor style={p.cursorStyle} trail={p.effects.cursor.trail} trailLength={p.effects.cursor.trailLength} magnetic={p.effects.cursor.magneticStrength} />
      )}
      {fx && <FxOverlay key={fx.id} kind={fx.kind} seconds={fx.seconds} onDone={done} />}
    </>
  );
}
