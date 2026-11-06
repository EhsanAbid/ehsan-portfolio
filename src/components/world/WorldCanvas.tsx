"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Camera } from "three";
import type { Site } from "@/schema/site";
import { FpsController, type Tier } from "@/lib/fps";
import type { Sample } from "./sampler";
import type { Atlas } from "./atlas";
import { Portrait, type PortraitFrame, type Tints } from "./Portrait";
import { Cards, type CardColors, type CardWork } from "./Cards";
import { cameraZ, cardProgress } from "./layout";
import { setWorld, subscribeWorld, world } from "./store";

const FOV = 35;
const CAM0 = 30;
/** Visible height of the z = 0 plane from the starting camera position. */
const H0 = 2 * CAM0 * Math.tan(((FOV / 2) * Math.PI) / 180);

export type WorldProps = {
  sample: Sample;
  atlas: Atlas;
  effects: Site["effects"];
  works: CardWork[];
  colors: CardColors;
  tints: Tints;
  font: string;
  onFirstFrame: () => void;
};

/** Camera: follows the scroll position (smoothed) and leans a little toward the mouse. */
class Rig {
  z = CAM0;
  x = 0;
  y = 0;
  first = true;
  ctl: FpsController;
  constructor(cfg: Site["effects"]["quality"]) {
    this.ctl = new FpsController(world.tier, cfg, (t) => setWorld({ tier: t }));
  }

  step(camera: Camera, delta: number, o: { perWork: number; depth: number; count: number; onFirstFrame: () => void }) {
    const dt = Math.min(delta, 0.05);
    this.ctl.tick(performance.now());
    const p = world.progress;
    // ease toward the scroll target: smooth even with a mouse wheel that jumps
    this.z += (cameraZ(p, o.depth) - this.z) * Math.min(1, dt * 5);
    const ptr = world.pointer;
    // a gentle lean only: a big one turns the face away and the relief makes it look scrambled
    this.x += ((ptr ? ptr.x * 0.5 : 0) - this.x) * Math.min(1, dt * 2.5);
    this.y += ((ptr ? ptr.y * 0.3 : 0) - this.y) * Math.min(1, dt * 2.5);
    camera.position.set(this.x, this.y, this.z);
    camera.lookAt(this.x * 0.3, this.y * 0.3, this.z - CAM0);

    // which project is in focus? (the one whose scroll position is nearest, within half a step)
    let focus = -1;
    if (p > 1.05) {
      const i = Math.round((p - cardProgress(0, o.perWork)) / o.perWork);
      if (i >= 0 && i < o.count && Math.abs(p - cardProgress(i, o.perWork)) < o.perWork * 0.55) focus = i;
    }
    setWorld({ focus });

    if (this.first) {
      this.first = false;
      requestAnimationFrame(o.onFirstFrame);
    }
  }
}

function CameraRig({ effects, count, onFirstFrame }: { effects: Site["effects"]; count: number; onFirstFrame: () => void }) {
  const [rig] = useState(() => new Rig(effects.quality));
  useEffect(() => rig.ctl.setConfig(effects.quality), [rig, effects.quality]);
  const opts = { perWork: effects.flight.scrollPerWork, depth: effects.flight.fieldDepth, count, onFirstFrame };
  useFrame((state, delta) => rig.step(state.camera, delta, opts));
  return null;
}

/** How long the scroll must be still (with a panel open) before the scene stops drawing. */
const SLEEP_AFTER_MS = 1500;

/**
 * The canvas renders "on demand": this keeps asking for the next frame — except while a glass
 * panel covers the page and nothing moves. Then the last frame simply stays on screen, so the
 * browser's backdrop blur (expensive!) isn't recomputed 60 times a second for a still image.
 * Any change in the shared store (scroll, panel closed, tier) wakes it up again.
 */
function FrameDriver() {
  const invalidate = useThree((s) => s.invalidate);
  const still = useRef({ progress: -1, since: 0 });
  useEffect(() => subscribeWorld(() => invalidate()), [invalidate]);
  useFrame(() => {
    const now = performance.now();
    const s = still.current;
    if (world.progress !== s.progress) {
      s.progress = world.progress;
      s.since = now;
    }
    if (!world.panel || now - s.since < SLEEP_AFTER_MS) invalidate();
  });
  return null;
}

function Scene({ sample, atlas, effects, works, colors, tints, font, onFirstFrame, tier }: WorldProps & { tier: Tier }) {
  const size = useThree((s) => s.size);
  const narrow = size.width < 900 || size.width < size.height;
  const frame: PortraitFrame = useMemo(() => {
    const aspect = size.width / size.height;
    const pc = effects.portrait;
    if (narrow) return { cx: 0, cy: H0 * 0.09, height: H0 * 0.78 * pc.size };
    return { cx: pc.offsetX * H0 * aspect, cy: -H0 * 0.035, height: H0 * pc.size };
  }, [size.width, size.height, narrow, effects.portrait]);

  const fl = effects.flight;
  const dust = effects.portrait.dust;
  return (
    <>
      <FrameDriver />
      <CameraRig effects={effects} count={works.length} onFirstFrame={onFirstFrame} />
      {effects.portrait.enabled && (
        <Portrait
          // a tier change only changes the dust count and pixel ratio — no rebuild, no flicker
          key={`${sample.cols}-${sample.rows}-${frame.cx.toFixed(2)}-${frame.height.toFixed(2)}`}
          sample={sample}
          atlas={atlas}
          dust={dust[tier]}
          dustMax={Math.max(dust.high, dust.medium, dust.low)}
          tints={tints}
          frame={frame}
          cfg={effects.portrait}
          depth={fl.fieldDepth}
          count={works.length}
          perWork={fl.scrollPerWork}
        />
      )}
      {fl.enabled && works.length > 0 && (
        <Cards
          key={narrow ? "n" : "w"}
          works={works}
          perWork={fl.scrollPerWork}
          depth={fl.fieldDepth}
          size={fl.cardSize}
          narrow={narrow}
          colors={colors}
          font={font}
        />
      )}
    </>
  );
}

export default function WorldCanvas(props: WorldProps) {
  const [tier, setTier] = useState<Tier>(world.tier);
  useEffect(() => subscribeWorld(() => setTier(world.tier)), []);
  const q = props.effects.quality;
  const dprCap = tier === "high" ? q.dprHigh : tier === "medium" ? q.dprMedium : q.dprLow;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  return (
    <div className="s-canvas" aria-hidden>
      <Canvas
        dpr={[1, dprCap]}
        camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 0, CAM0] }}
        frameloop={visible ? "demand" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Scene {...props} tier={tier} />
      </Canvas>
    </div>
  );
}
