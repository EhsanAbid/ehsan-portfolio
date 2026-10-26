"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import { universe } from "./store";

/*
 * ───────────── Starfield + warp streaks ─────────────
 * The camera sits at the origin looking down −z. Stars live in a long box in front of it.
 * Instead of moving thousands of stars on the CPU every frame, we send ONE number to the
 * GPU — `uTravel`, how far we have flown — and the vertex shader moves every star at once:
 *     z = mod(startZ + uTravel, depth) − depth
 * `mod` wraps a star back to the far end when it passes the camera, so the field is endless.
 * Scrolling fast raises the flight speed and `uStretch`: each star also has a second copy
 * drawn as a line whose tail is pushed back along z — at speed, dots become light streaks.
 */

const DEPTH = 400;
const SPREAD = 220;

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aTail;     // 0 = head of the streak, 1 = tail (lines only)
  uniform float uTravel;
  uniform float uDepth;
  uniform float uStretch;
  uniform float uPixelRatio;
  uniform float uTime;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec3 p = position;
    p.z = mod(p.z + uTravel, uDepth) - uDepth;      // endless flight
    float near = 1.0 - (-p.z / uDepth);             // 0 = far away, 1 = at the camera
    p.z -= aTail * uStretch * (0.3 + near);         // pull the tail vertex back → streak
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (0.5 + near * 2.5);
    // fade in from the distance; gentle twinkle (< 1 Hz, as the spec asks)
    vAlpha = smoothstep(0.0, 0.3, near) * (0.75 + 0.25 * sin(uTime * 0.9 + aSeed * 6.283));
    vSeed = aSeed;
  }
`;

const pointFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    // gl_PointCoord is 0..1 across the point's square: turn it into a soft round dot.
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(1.0), vSeed > 0.7 ? uColorA : uColorB, step(0.55, vSeed) * 0.6);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

const lineFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform float uStreakAlpha;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(mix(vec3(1.0), uColorA, 0.5), vAlpha * uStreakAlpha);
  }
`;

function buildGeometries(count: number) {
  const pts = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const lpos = new Float32Array(count * 6);
  const lseed = new Float32Array(count * 2);
  const ltail = new Float32Array(count * 2);
  const lsize = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    // random point in a box, keeping a small empty tunnel around the camera's path
    let x = (Math.random() - 0.5) * SPREAD;
    let y = (Math.random() - 0.5) * SPREAD * 0.7;
    if (Math.abs(x) < 4 && Math.abs(y) < 4) {
      x += Math.sign(x || 1) * 6;
      y += Math.sign(y || 1) * 6;
    }
    const z = -Math.random() * DEPTH;
    pts.set([x, y, z], i * 3);
    size[i] = 0.6 + Math.random() ** 3 * 2.6;
    seed[i] = Math.random();
    lpos.set([x, y, z, x, y, z], i * 6);
    lseed.set([seed[i], seed[i]], i * 2);
    ltail.set([0, 1], i * 2);
    lsize.set([1, 1], i * 2);
  }
  const points = new BufferGeometry();
  points.setAttribute("position", new BufferAttribute(pts, 3));
  points.setAttribute("aSize", new BufferAttribute(size, 1));
  points.setAttribute("aSeed", new BufferAttribute(seed, 1));
  points.setAttribute("aTail", new BufferAttribute(new Float32Array(count), 1));
  const lines = new BufferGeometry();
  lines.setAttribute("position", new BufferAttribute(lpos, 3));
  lines.setAttribute("aSize", new BufferAttribute(lsize, 1));
  lines.setAttribute("aSeed", new BufferAttribute(lseed, 1));
  lines.setAttribute("aTail", new BufferAttribute(ltail, 1));
  return { points, lines };
}

/**
 * Holds the GPU resources and the per-frame simulation. Kept in a plain class (created once)
 * so React never re-creates materials, and the frame loop can mutate it freely.
 */
class StarSim {
  speed = 0;
  uniforms = {
    uTravel: { value: 0 },
    uDepth: { value: DEPTH },
    uStretch: { value: 0 },
    uStreakAlpha: { value: 0 },
    uPixelRatio: { value: 1 },
    uTime: { value: 0 },
    uColorA: { value: new Color() },
    uColorB: { value: new Color() },
  };
  pointMat = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: vertex, fragmentShader: pointFragment, transparent: true, depthWrite: false, blending: AdditiveBlending });
  lineMat = new ShaderMaterial({ uniforms: this.uniforms, vertexShader: vertex, fragmentShader: lineFragment, transparent: true, depthWrite: false, blending: AdditiveBlending });

  setColors(a: string, b: string) {
    this.uniforms.uColorA.value.set(a);
    this.uniforms.uColorB.value.set(b);
  }

  step(delta: number, time: number, dpr: number, o: { warpIntensity: number; drift: number; streaks: boolean }) {
    const dt = Math.min(delta, 0.05); // ignore huge gaps (tab switch) so stars don't teleport
    // Ease the speed toward the target: ambient drift + |scroll velocity| × intensity.
    const target = o.drift * 6 + Math.min(Math.abs(universe.velocity) * o.warpIntensity * 2.2, 260);
    this.speed += (target - this.speed) * Math.min(1, dt * 4);
    const u = this.uniforms;
    u.uTravel.value += this.speed * dt * (universe.velocity < -0.5 ? -1 : 1);
    u.uTime.value = time;
    u.uPixelRatio.value = dpr;
    const stretch = o.streaks ? Math.max(0, this.speed - o.drift * 6) * 0.12 : 0;
    u.uStretch.value = stretch;
    u.uStreakAlpha.value = Math.min(1, stretch / 6);
  }

  dispose() {
    this.pointMat.dispose();
    this.lineMat.dispose();
  }
}

export type StarfieldProps = {
  count: number;
  warpIntensity: number;
  drift: number;
  streaks: boolean;
  colorA: string;
  colorB: string;
};

export function Starfield({ count, warpIntensity, drift, streaks, colorA, colorB }: StarfieldProps) {
  const { points, lines } = useMemo(() => buildGeometries(count), [count]);
  const [sim] = useState(() => new StarSim());
  useEffect(() => sim.setColors(colorA, colorB), [sim, colorA, colorB]);
  useEffect(() => () => sim.dispose(), [sim]);
  useEffect(
    () => () => {
      points.dispose();
      lines.dispose();
    },
    [points, lines],
  );

  useFrame((state, delta) => sim.step(delta, state.clock.elapsedTime, state.viewport.dpr, { warpIntensity, drift, streaks }));

  return (
    <>
      <points geometry={points} material={sim.pointMat} frustumCulled={false} />
      {streaks && <lineSegments geometry={lines} material={sim.lineMat} frustumCulled={false} />}
    </>
  );
}
