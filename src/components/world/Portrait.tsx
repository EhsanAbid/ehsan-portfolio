"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Vector3 } from "three";
import type { Site } from "@/schema/site";
import { rng, type Sample } from "./sampler";
import type { Atlas } from "./atlas";
import { BLOCK_MIN, cameraZ, flightEnd } from "./layout";
import { world } from "./store";

/*
 * ───────────── The block portrait ─────────────
 * Thousands of small squares, drawn in ONE draw call (instancing): the GPU draws the same
 * square many times, each copy reading its own position/colour from per-instance attributes.
 *
 * Every block has two homes:
 *   aStart — its spot in the face,  aEnd — a random spot in a long 3D "field" ahead of the camera.
 * One uniform, uExplode (0 → 1, from the scroll position), moves every block from its face
 * position to its field position in the vertex shader. Each block starts at a slightly
 * different moment (aSeed), so the face crumbles instead of jumping. Zero CPU work per frame.
 *
 * Mouse ripple: blocks near the pointer (measured in the face plane) are pushed toward the
 * camera and brightened; the effect fades out as the face breaks apart.
 */

const vertex = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  attribute float aTile;
  uniform float uExplode;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uRadius;
  uniform float uPush;
  uniform float uShimmer;
  uniform float uBrightness;
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vTile;
  varying float vE;

  void main() {
    vTile = aTile;
    // staggered, eased progress for this block (smoothstep = soft start and stop)
    float e = clamp(uExplode * 1.4 - aSeed * 0.4, 0.0, 1.0);
    e = e * e * (3.0 - 2.0 * e);
    vE = e;
    vec3 pos = mix(aStart, aEnd, e);

    // ripple: 1 at the pointer, 0 at the radius
    float d = distance(aStart.xy, uPointer);
    float h = (1.0 - smoothstep(0.0, uRadius, d)) * (1.0 - e) * uHover;
    pos.z += h * uPush * 2.2;
    // a slow breathing so the face never looks frozen (< 1 Hz)
    pos.z += sin(uTime * 0.55 + aSeed * 31.0) * 0.06 * (1.0 - e);

    // blocks grow and become small "cards" (4:3) once they are out in the field
    vec2 scale = vec2(aSize * (1.0 + e * 1.6) * (1.0 + h * 0.35));
    scale.x *= 1.0 + e * 0.35;
    vec4 mv = modelViewMatrix * vec4(pos + vec3(position.xy * scale, 0.0), 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 1.0 + uShimmer * 0.18 * sin(uTime * (0.4 + aSeed * 0.7) + aSeed * 57.0);
    vColor = aColor * uBrightness * twinkle * (1.0 + h * 0.3);
    vUv = uv;
    // fade blocks that are about to hit the camera, and the far end of the field
    float depth = -mv.z;
    vAlpha = smoothstep(0.6, 3.5, depth) * (1.0 - smoothstep(70.0, 130.0, depth));
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uTex;
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vTile;
  varying float vE;
  void main() {
    // slightly rounded "thumbnail" corners
    vec2 q = abs(vUv - 0.5) * 2.0;
    float r = 0.18;
    float dist = length(max(q - (1.0 - r), 0.0)) / r;
    float a = (1.0 - smoothstep(0.75, 1.0, dist)) * vAlpha;
    if (a < 0.02) discard;
    // Pick this block's tile in the 8×8 atlas (row 0 is the top of the canvas; the texture is flipped in y).
    float col = mod(vTile, 8.0);
    float row = floor(vTile / 8.0);
    vec2 auv = vec2((col + vUv.x) / 8.0, 1.0 - (row + 1.0 - vUv.y) / 8.0);
    vec3 tex = texture2D(uAtlas, auv).rgb;
    // The tile only adds detail; the block's own tone decides how bright it is. (Multiplying the
    // tone by the raw tile made a dark block with a bright tile look like a lit one, and the face
    // dissolved into noise.) So the tile's pattern is a gentle ±28 % around the tone, and a
    // colourful tile lends its hue, rescaled to that same tone.
    vec3 W = vec3(0.299, 0.587, 0.114);
    float tone = dot(vColor, W);
    float l = dot(tex, W);
    vec3 detail = vColor * (0.72 + 0.56 * l);
    vec3 hue = min(tex / max(l, 0.08) * tone, vec3(1.0));
    float chroma = max(tex.r, max(tex.g, tex.b)) - min(tex.r, min(tex.g, tex.b));
    vec3 textured = mix(detail, hue, clamp(chroma * 1.2, 0.0, 0.7));
    // Out in the field (vE → 1) the blocks are little "cards": there the full thumbnail shows.
    vec3 card = tex * (0.32 + tone * 1.7);
    textured = mix(textured, card, vE);
    gl_FragColor = vec4(mix(vColor, textured, uTex), a);
  }
`;

export type PortraitFrame = { cx: number; cy: number; height: number };

/** Camera distance at the top of the page (see layout.cameraZ). */
const CAM_START = cameraZ(0, 1);

class BlockSim {
  pointer = new Vector3();
  dir = new Vector3();
  hover = 0;
  explode = 0;
  material: ShaderMaterial;
  geometry = new InstancedBufferGeometry();

  texture: CanvasTexture;
  faceCount: number;
  dustMax: number;

  /** `dust` is the most dust blocks any tier may show; setDust() picks how many are drawn. */
  constructor(sample: Sample, frame: PortraitFrame, cfg: Site["effects"]["portrait"], fieldEnd: number, atlas: Atlas, dust: number) {
    const { cols, rows, cells } = sample;
    const n = cells.length + dust;
    this.faceCount = cells.length;
    this.dustMax = dust;
    // Start where the scroll already is, so a rebuilt face doesn't re-assemble mid-flight.
    this.explode = Math.min(1, Math.max(0, (world.progress - 0.02) / 0.98));
    const cell = frame.height / rows;
    const start = new Float32Array(n * 3);
    const end = new Float32Array(n * 3);
    const color = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const size = new Float32Array(n);
    const tile = new Float32Array(n);
    const rand = rng(98765);
    const zNear = 4;
    const fieldPos = (i: number) => {
      // Field: a long tube around the flight path, empty in the middle so cards stay visible.
      const ang = rand() * Math.PI * 2;
      const rad = 4.5 + Math.pow(rand(), 0.7) * 26;
      end[i * 3] = Math.cos(ang) * rad;
      end[i * 3 + 1] = Math.sin(ang) * rad * 0.7;
      end[i * 3 + 2] = zNear - rand() * (zNear - fieldEnd);
    };
    const pickTile = (pool: number[]) => pool[Math.floor(rand() * pool.length)] ?? 0;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      // Relief: lit blocks sit forward, shadows recede — the face reads as 3D when the camera moves.
      const z = (c.lum - 0.45) * cfg.relief * 1.4 + (rand() - 0.5) * 0.06 * cfg.relief;
      // Perspective makes a block that sits forward look bigger and pushes it away from the
      // centre of the view. The face is off-centre, so lit and dark neighbours drifted up to a
      // whole cell apart and the face looked scrambled. Shrinking each block's position and size
      // by its distance cancels that exactly for the starting camera: at rest the face looks
      // like the flat photo, and the depth only shows once the camera moves.
      const k = (CAM_START - z) / CAM_START;
      start[i * 3] = (frame.cx + (c.x - cols / 2 + 0.5) * cell) * k;
      start[i * 3 + 1] = (frame.cy - (c.y - rows / 2 + 0.5) * cell) * k;
      start[i * 3 + 2] = z;
      fieldPos(i);
      color.set([c.r, c.g, c.b], i * 3);
      seed[i] = rand();
      // Bright = full-size block, dark = small block: the face is "drawn" by block size too.
      size[i] = cell * (1 - cfg.gap) * (BLOCK_MIN + (1 - BLOCK_MIN) * c.lum) * k;
      tile[i] = pickTile(c.spark ? atlas.vivid : atlas.neutral);
    }
    // Dust: a few hundred faint tiles floating behind the portrait (and joining the field later).
    for (let i = cells.length; i < n; i++) {
      start[i * 3] = (rand() - 0.5) * 80;
      start[i * 3 + 1] = (rand() - 0.5) * 44;
      start[i * 3 + 2] = -6 - rand() * 50;
      fieldPos(i);
      const v = 0.12 + rand() * 0.3;
      color.set([v, v, v], i * 3);
      seed[i] = rand();
      size[i] = cell * (0.4 + rand() * 0.8);
      tile[i] = pickTile(rand() < 0.2 ? atlas.vivid : atlas.neutral);
    }
    const plane = new PlaneGeometry(1, 1);
    this.geometry.index = plane.index;
    this.geometry.setAttribute("position", plane.getAttribute("position"));
    this.geometry.setAttribute("uv", plane.getAttribute("uv"));
    this.geometry.setAttribute("aStart", new InstancedBufferAttribute(start, 3));
    this.geometry.setAttribute("aEnd", new InstancedBufferAttribute(end, 3));
    this.geometry.setAttribute("aColor", new InstancedBufferAttribute(color, 3));
    this.geometry.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));
    this.geometry.setAttribute("aSize", new InstancedBufferAttribute(size, 1));
    this.geometry.setAttribute("aTile", new InstancedBufferAttribute(tile, 1));
    this.texture = new CanvasTexture(atlas.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.geometry.instanceCount = n;
    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uExplode: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: [999, 999] },
        uHover: { value: 0 },
        uRadius: { value: cfg.hoverRadius * frame.height },
        uPush: { value: cfg.hoverPush },
        uShimmer: { value: cfg.shimmer },
        uBrightness: { value: cfg.brightness },
        uAtlas: { value: this.texture },
        uTex: { value: cfg.texture },
      },
    });
  }

  setDust(count: number) {
    this.geometry.instanceCount = this.faceCount + Math.min(this.dustMax, count);
  }

  step(time: number, dt: number, camera: { position: Vector3 } & { projectionMatrixInverse: unknown }, unproject: (v: Vector3) => Vector3) {
    const u = this.material.uniforms;
    u.uTime.value = time;
    // explosion follows scroll, eased so fast scrolling still looks smooth
    const target = Math.min(1, Math.max(0, (world.progress - 0.02) / 0.98));
    this.explode += (target - this.explode) * Math.min(1, dt * 6);
    u.uExplode.value = this.explode;

    // pointer → point on the face plane (z = 0): cast a ray from the camera through the mouse
    const p = world.pointer;
    const want = p && this.explode < 0.9 ? 1 : 0;
    this.hover += (want - this.hover) * Math.min(1, dt * 4);
    u.uHover.value = this.hover;
    if (p) {
      const v = unproject(this.dir.set(p.x, p.y, 0.5));
      v.sub(camera.position).normalize();
      const t = -camera.position.z / v.z;
      this.pointer.copy(camera.position).addScaledVector(v, t);
      u.uPointer.value = [this.pointer.x, this.pointer.y];
    }
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

export function Portrait({
  sample,
  frame,
  cfg,
  depth,
  count,
  perWork,
  atlas,
  dust,
  dustMax,
}: {
  atlas: Atlas;
  /** dust blocks drawn now (per tier) — changing it doesn't rebuild anything */
  dust: number;
  dustMax: number;
  sample: Sample;
  frame: PortraitFrame;
  cfg: Site["effects"]["portrait"];
  depth: number;
  count: number;
  perWork: number;
}) {
  const fieldEnd = useMemo(() => cameraZ(flightEnd(count, perWork) + 1.2, depth) - 40, [count, perWork, depth]);
  const [sim] = useState(() => new BlockSim(sample, frame, cfg, fieldEnd, atlas, dustMax));
  useEffect(() => () => sim.dispose(), [sim]);
  useEffect(() => sim.setDust(dust), [sim, dust]);

  useFrame((state, delta) =>
    sim.step(state.clock.elapsedTime, Math.min(delta, 0.05), state.camera as never, (v) => v.unproject(state.camera)),
  );

  return <mesh geometry={sim.geometry} material={sim.material} frustumCulled={false} renderOrder={1} />;
}
