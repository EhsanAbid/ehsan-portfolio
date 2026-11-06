"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture, TextureLoader } from "three";
import { emit } from "@/lib/events";
import { rng } from "./sampler";
import { CARD_AHEAD, cameraZ, cardProgress } from "./layout";
import { world } from "./store";

export type CardColors = { panel: string; panelText: string; panelMuted: string; upper: boolean };

export type CardWork = {
  id: string;
  title: string;
  category: string;
  imageKey: string | null;
  aspect: number; // height / width
};

/** A rounded-rectangle mask shared by every card (white = visible). */
function roundedMask() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#fff";
  g.beginPath();
  g.roundRect(0, 0, 128, 128, 2);
  g.fill();
  return new CanvasTexture(c);
}

/** Projects without an image fly in as a paper sheet: the title in the display font. */
function titleTexture(w: CardWork, colors: CardColors, font: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 768;
  const g = c.getContext("2d")!;
  g.fillStyle = colors.panel;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = colors.panelMuted;
  g.font = `500 36px ${getComputedStyle(document.body).fontFamily}`;
  g.fillText(w.category, 64, 100);
  g.fillStyle = colors.panelText;
  const title = colors.upper ? w.title.toUpperCase() : w.title;
  const words = title.split(/\s+/);
  // simple word wrap, at the largest size where the whole title fits on the card
  const wrap = () => {
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (g.measureText(test).width > c.width - 128 && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
    return lines;
  };
  let size = 200;
  let lines: string[];
  do {
    size -= 8;
    g.font = `800 ${size}px ${font}`;
    lines = wrap();
  } while (size > 72 && lines.length * size * 0.94 > c.height - 200);
  let y = c.height - 64;
  [...lines].reverse().forEach((l) => {
    g.fillText(l, 64, y);
    y -= size * 0.94;
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

class CardSet {
  meshes: Mesh[] = [];
  textures: Texture[] = [];
  mask = roundedMask();
  geometry = new PlaneGeometry(1, 1);

  constructor(
    works: CardWork[],
    o: { perWork: number; depth: number; size: number; narrow: boolean; colors: CardColors; font: string },
  ) {
    const rand = rng(4242);
    const loader = new TextureLoader();
    const width = (o.narrow ? 3.7 : 7.5) * o.size;
    works.forEach((w, i) => {
      const material = new MeshBasicMaterial({ transparent: true, toneMapped: false, alphaMap: this.mask, opacity: 0, depthWrite: false });
      const mesh = new Mesh(this.geometry, material);
      mesh.renderOrder = 2; // drawn after the blocks, so nothing flies across the title
      const side = i % 2 === 0 ? -1 : 1;
      const xAmp = o.narrow ? 0 : 4.2; // phones: centred, a sideways offset would cut the card off
      mesh.position.set(side * xAmp * (0.6 + rand() * 0.4), (rand() - 0.5) * (o.narrow ? 1.6 : 2.6), cameraZ(cardProgress(i, o.perWork), o.depth) - CARD_AHEAD);
      mesh.scale.set(width, width * w.aspect, 1);
      mesh.userData = { id: w.id, index: i };
      if (w.imageKey) {
        const tex = loader.load(`/media/${w.imageKey}?w=${o.narrow ? 640 : 960}`);
        tex.colorSpace = SRGBColorSpace;
        material.map = tex;
        this.textures.push(tex);
      } else {
        const tex = titleTexture(w, o.colors, o.font);
        material.map = tex;
        this.textures.push(tex);
        mesh.scale.set(width, width * 0.75, 1);
      }
      material.needsUpdate = true;
      this.meshes.push(mesh);
    });
  }

  step(camZ: number, dt: number) {
    // cards only appear once the face has broken apart
    const gate = Math.min(1, Math.max(0, (world.progress - 0.75) / 0.3));
    for (const m of this.meshes) {
      const mat = m.material as MeshBasicMaterial;
      const dist = camZ - m.position.z; // > 0 when the card is ahead
      // fade in from the far end, and fade out well before the camera: a bright sheet passing
      // close by would otherwise wash over the whole screen
      const target = gate * (dist < 6 ? 0 : Math.min(1, (dist - 6) / 4) * (1 - Math.min(1, Math.max(0, (dist - 45) / 25))));
      mat.opacity += (target - mat.opacity) * Math.min(1, dt * 8);
      m.visible = mat.opacity > 0.01;
    }
  }

  dispose() {
    this.textures.forEach((t) => t.dispose());
    this.meshes.forEach((m) => (m.material as MeshBasicMaterial).dispose());
    this.mask.dispose();
    this.geometry.dispose();
  }
}

export function Cards({
  works,
  perWork,
  depth,
  size,
  narrow,
  colors,
  font,
}: {
  works: CardWork[];
  perWork: number;
  depth: number;
  size: number;
  narrow: boolean;
  colors: CardColors;
  font: string;
}) {
  const opts = useMemo(() => ({ perWork, depth, size, narrow, colors, font }), [perWork, depth, size, narrow, colors, font]);
  const [set] = useState(() => new CardSet(works, opts));
  useEffect(() => () => set.dispose(), [set]);

  useFrame((state, delta) => set.step(state.camera.position.z, Math.min(delta, 0.05)));

  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    emit("open-panel", { id: `work-${e.object.userData.id}` });
  };

  return (
    <group>
      {set.meshes.map((m) => (
        <primitive
          key={m.uuid}
          object={m}
          onClick={open}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        />
      ))}
    </group>
  );
}
