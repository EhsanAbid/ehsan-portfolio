"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Site } from "@/schema/site";
import { FpsController, type Tier } from "@/lib/fps";
import { setUniverse, subscribe, universe } from "./store";
import { Starfield } from "./Starfield";

/**
 * The one WebGL canvas of the site (lazy-loaded chunk): fixed behind the content,
 * aria-hidden, pointer-events off. Hosts the starfield and (Phase 4) the hero particles,
 * so there is a single render loop and a single FPS controller.
 */
export type SpaceProps = {
  effects: Site["effects"];
  colors: { cyan: string; violet: string };
  children?: (tier: Tier) => ReactNode;
};

/** Frame-loop bookkeeping: FPS controller + scroll velocity. */
class LoopState {
  lastY = 0;
  constructor(public ctl: FpsController) {}
  frame() {
    this.ctl.tick(performance.now());
    // Scroll velocity (px per frame), smoothed so a single jump doesn't spike the warp.
    const y = window.scrollY;
    const v = y - this.lastY;
    this.lastY = y;
    universe.velocity += (v - universe.velocity) * 0.2;
  }
}

function Controller({ effects }: { effects: Site["effects"] }) {
  const [loop] = useState(() => new LoopState(new FpsController(universe.tier, effects.quality, (t) => setUniverse({ tier: t }))));
  useEffect(() => loop.ctl.setConfig(effects.quality), [loop, effects.quality]);
  useFrame(() => loop.frame());
  return null;
}

export default function SpaceCanvas({ effects, colors, children }: SpaceProps) {
  const [tier, setTier] = useState<Tier>(universe.tier);
  useEffect(() => subscribe(() => setTier(universe.tier)), []);
  const q = effects.quality;
  const dprCap = tier === "high" ? q.dprHigh : tier === "medium" ? q.dprMedium : q.dprLow;
  const sf = effects.starfield;
  const count = sf.counts[tier];
  const [visible, setVisible] = useState(true);

  // Stop rendering completely while the tab is hidden (saves battery; rAF is throttled anyway).
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const camera = useMemo(() => ({ fov: 60, near: 0.1, far: 1000, position: [0, 0, 0] as [number, number, number] }), []);

  return (
    <div className="space-canvas" aria-hidden>
      <Canvas
        dpr={[1, dprCap]}
        camera={camera}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Controller effects={effects} />
        {sf.enabled && count > 0 && (
          <Starfield
            key={count}
            count={count}
            warpIntensity={sf.warpIntensity}
            drift={sf.drift}
            streaks={tier !== "low"}
            colorA={colors.cyan}
            colorB={colors.violet}
          />
        )}
        {children?.(tier)}
      </Canvas>
    </div>
  );
}
