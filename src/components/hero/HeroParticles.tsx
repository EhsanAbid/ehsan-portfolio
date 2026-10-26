"use client";

import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import type { Site } from "@/schema/site";
import type { Tier } from "@/lib/fps";
import { on } from "@/lib/events";
import { universe } from "@/components/space/store";

/*
 * ───────────── Big Bang particle name ─────────────
 * 1. SAMPLE: draw the name (same font, size and wrapping as the HTML <h1>) onto an invisible
 *    2D canvas and read its pixels. Every opaque pixel is a possible "home" for a particle.
 * 2. EXPLODE: all particles start at the bright point in the middle of the screen with a
 *    random outward velocity.
 * 3. SPRING PHYSICS, every frame, for every particle (a damped spring, like a car suspension):
 *        force     = k · (home − position)                 ← Hooke's law pulls it home
 *                  + repel · (position − pointer)/d · (1 − d/r)   if the pointer is closer than r
 *        velocity  = (velocity + force) · damping          ← damping < 1 bleeds energy, so it settles
 *        position += velocity
 *    k (stiffness), damping, repel force and radius are all admin settings.
 * Physics runs on the CPU in page pixels (simple to reason about); the GPU only draws:
 * the vertex shader turns page pixels into screen coordinates.
 */

const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  uniform vec2 uRes;       // viewport size in CSS px
  uniform float uScroll;   // window.scrollY
  uniform float uSize;
  uniform float uDpr;
  uniform float uTime;
  uniform float uRainbow;  // 0 = brand colours, 1 = god-mode rainbow
  varying vec3 vColor;

  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 p = vec2(position.x, position.y - uScroll);            // page px → viewport px
    vec2 clip = vec2(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0);  // → −1..1
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = uSize * uDpr * (0.75 + aSeed * 0.6);
    vec3 rainbow = hsv2rgb(vec3(fract(p.x / uRes.x + uTime * 0.3), 0.75, 1.0));
    vColor = mix(aColor, rainbow, uRainbow);
  }
`;

const fragment = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d) * uAlpha);
  }
`;

type Cfg = Site["effects"]["particles"];

/** Pixels of the name, in page coordinates. */
function sampleName(el: HTMLElement, count: number): Float32Array {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const W = Math.ceil(rect.width);
  const fontSize = parseFloat(cs.fontSize);
  const lineH = parseFloat(cs.lineHeight) || fontSize;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const setup = () => {
    ctx.font = font;
    // letter-spacing changes the measured width, so apply it before measuring.
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
  };
  setup();
  // Wrap words exactly like the browser would at this width.
  const words = (el.textContent ?? "").trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > W + 1) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  c.width = W;
  c.height = Math.ceil(lineH * lines.length);
  setup(); // resizing a canvas resets its drawing state
  lines.forEach((l, i) => ctx.fillText(l, 0, i * lineH + lineH / 2 + fontSize * 0.04));

  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const step = Math.max(1, Math.round(Math.sqrt((c.width * c.height * 0.25) / count)));
  const hits: number[] = [];
  for (let y = 0; y < c.height; y += step)
    for (let x = 0; x < c.width; x += step) if (data[(y * c.width + x) * 4 + 3] > 128) hits.push(x, y);

  const out = new Float32Array(count * 2);
  const n = hits.length / 2;
  const ox = rect.left + scrollX;
  const oy = rect.top + scrollY;
  for (let i = 0; i < count; i++) {
    const j = n ? Math.floor(Math.random() * n) : 0;
    out[i * 2] = ox + (hits[j * 2] ?? W / 2) + (Math.random() - 0.5) * step;
    out[i * 2 + 1] = oy + (hits[j * 2 + 1] ?? 0) + (Math.random() - 0.5) * step;
  }
  return out;
}

class ParticleSim {
  pos: Float32Array;
  vel: Float32Array;
  home: Float32Array | null = null;
  geometry = new BufferGeometry();
  material: ShaderMaterial;
  attr: BufferAttribute;
  active = false;
  rainbow = 0;
  rainbowUntil = 0;
  alpha = 0;

  constructor(
    public count: number,
    colors: string[],
  ) {
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 2);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const palette = colors.map((h) => new Color(h));
    for (let i = 0; i < count; i++) {
      const cc = palette[i % palette.length];
      col.set([cc.r, cc.g, cc.b], i * 3);
      seed[i] = Math.random();
    }
    this.attr = new BufferAttribute(this.pos, 3);
    this.geometry.setAttribute("position", this.attr);
    this.geometry.setAttribute("aColor", new BufferAttribute(col, 3));
    this.geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uRes: { value: [1, 1] },
        uScroll: { value: 0 },
        uSize: { value: 2 },
        uDpr: { value: 1 },
        uTime: { value: 0 },
        uRainbow: { value: 0 },
        uAlpha: { value: 0 },
      },
    });
  }

  /** Big Bang: everyone starts at the centre of the screen and flies outward. */
  explode(el: HTMLElement) {
    this.home = sampleName(el, this.count);
    const cx = innerWidth / 2;
    const cy = scrollY + innerHeight / 2;
    for (let i = 0; i < this.count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 4 + Math.random() * 22;
      this.pos[i * 3] = cx;
      this.pos[i * 3 + 1] = cy;
      this.vel[i * 2] = Math.cos(a) * s;
      this.vel[i * 2 + 1] = Math.sin(a) * s;
    }
    this.active = true;
  }

  resample(el: HTMLElement) {
    if (this.home) this.home = sampleName(el, this.count);
  }

  step(dt: number, time: number, dpr: number, cfg: Cfg, hero: HTMLElement) {
    const u = this.material.uniforms;
    u.uDpr.value = dpr;
    u.uRes.value = [innerWidth, innerHeight];
    u.uScroll.value = scrollY;
    u.uTime.value = time;
    u.uSize.value = cfg.size;
    // God-mode rainbow: on for N seconds, then fade back.
    const target = performance.now() < this.rainbowUntil ? 1 : 0;
    this.rainbow += (target - this.rainbow) * Math.min(1, dt * 3);
    u.uRainbow.value = this.rainbow;
    this.alpha += ((this.active ? 1 : 0) - this.alpha) * Math.min(1, dt * 2);
    u.uAlpha.value = this.alpha;
    if (!this.home || !this.active) return;

    // Skip the physics while the hero is scrolled out of view (nothing to see).
    if (hero.getBoundingClientRect().bottom < -50) return;

    // Frame-rate independence: the constants are tuned for 60 fps, so scale by dt·60.
    const f = Math.min(dt * 60, 3);
    const k = cfg.spring * f;
    const damp = Math.pow(cfg.damping, f);
    const p = universe.pointer;
    const px = p.x;
    const py = p.y + scrollY;
    const r = cfg.repelRadius;
    const r2 = r * r;
    const repel = cfg.repelForce * 6 * f;
    const { pos, vel, home } = this;
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      const iv = i * 2;
      let fx = (home[iv] - pos[ix]) * k;
      let fy = (home[iv + 1] - pos[ix + 1]) * k;
      if (p.active) {
        const dx = pos[ix] - px;
        const dy = pos[ix + 1] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = (1 - d / r) * repel;
          fx += (dx / d) * push;
          fy += (dy / d) * push;
        }
      }
      vel[iv] = (vel[iv] + fx) * damp;
      vel[iv + 1] = (vel[iv + 1] + fy) * damp;
      pos[ix] += vel[iv] * f;
      pos[ix + 1] += vel[iv + 1] * f;
    }
    this.attr.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export function HeroParticles({ cfg, tier, godSeconds }: { cfg: Cfg; tier: Tier; godSeconds: number }) {
  const count = cfg.counts[tier];
  const colors = [cfg.colors.a, cfg.colors.b, cfg.colors.c, cfg.colors.d];
  const [sim] = useState(() => new ParticleSim(count, colors));
  const dpr = useThree((s) => s.viewport.dpr);

  useEffect(() => {
    const el = document.getElementById("hero-name");
    if (!el) return;
    const root = document.documentElement;
    let formedTimer: ReturnType<typeof setTimeout>;
    const start = () =>
      document.fonts.ready.then(() => {
        sim.explode(el);
        formedTimer = setTimeout(() => root.classList.add("particles-on", `tier-${tier}`), 900);
      });
    const bootDone = !root.dataset.boot || root.dataset.boot === "off" || root.dataset.boot === "done";
    const off = bootDone ? (start(), () => {}) : on("boot-done", start);

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => sim.resample(el), 200);
    };
    addEventListener("resize", onResize);
    const offGod = on("god-mode", () => {
      sim.rainbowUntil = performance.now() + godSeconds * 1000;
    });
    return () => {
      off();
      offGod();
      clearTimeout(formedTimer);
      clearTimeout(rt);
      removeEventListener("resize", onResize);
      root.classList.remove("particles-on", `tier-${tier}`);
    };
  }, [sim, tier, godSeconds]);
  useEffect(() => () => sim.dispose(), [sim]);

  useFrame((state, delta) => {
    const hero = document.getElementById("top");
    if (hero) sim.step(delta, state.clock.elapsedTime, dpr, cfg, hero);
  });

  return <points geometry={sim.geometry} material={sim.material} frustumCulled={false} renderOrder={10} />;
}
