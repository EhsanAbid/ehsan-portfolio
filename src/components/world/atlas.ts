/*
 * The texture atlas: one 512×512 canvas cut into an 8×8 grid of 64 px tiles. Every block of
 * the portrait shows one tile, so instead of flat squares the face is made of tiny "pictures"
 * (like a mosaic of thumbnails). Tiles come from:
 *   1. your project images (cover + gallery), when you have some — just like the reference,
 *   2. procedurally drawn mini-thumbnails: web pages, photo-like blurs, posters, grids, charts.
 * Neutral (grey) tiles keep the face black & white; vivid tiles are used for the sparkle blocks.
 */
import { rng } from "./sampler";

export const ATLAS_GRID = 8;
const TILE = 64;
const PAD = 3; // keep content away from tile edges so mipmaps don't bleed between tiles

export type Atlas = {
  canvas: HTMLCanvasElement;
  /** Tile indices to use for normal (grey) blocks and for colour-sparkle blocks. */
  neutral: number[];
  vivid: number[];
};

type Draw = (g: CanvasRenderingContext2D, w: number, h: number, r: () => number, vivid: boolean) => void;

const VIVID = ["#4D7CFF", "#B15CFF", "#2EE6A8", "#FF8A3D", "#FF4D8D", "#36C5FF", "#F5D547"];
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];
const grey = (r: () => number, lo: number, hi: number) => {
  const v = Math.round((lo + r() * (hi - lo)) * 255);
  return `rgb(${v},${v},${v})`;
};

// Each "layout" mimics a kind of thumbnail you'd see in a designer's portfolio.
const layouts: Draw[] = [
  // web page, light
  (g, w, h, r, v) => {
    g.fillStyle = grey(r, 0.82, 0.95);
    g.fillRect(0, 0, w, h);
    g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.1, 0.3);
    g.fillRect(0, 0, w, h * 0.16);
    g.fillStyle = grey(r, 0.45, 0.65);
    for (let i = 0; i < 3; i++) g.fillRect(w * 0.1, h * (0.3 + i * 0.12), w * (0.35 + r() * 0.3), h * 0.05);
    g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.55, 0.75);
    g.fillRect(w * 0.55, h * 0.3, w * 0.35, h * 0.5);
  },
  // web page, dark with a button
  (g, w, h, r, v) => {
    g.fillStyle = grey(r, 0.05, 0.14);
    g.fillRect(0, 0, w, h);
    g.fillStyle = grey(r, 0.75, 0.95);
    g.fillRect(w * 0.1, h * 0.28, w * 0.6, h * 0.1);
    g.fillStyle = grey(r, 0.35, 0.5);
    g.fillRect(w * 0.1, h * 0.45, w * 0.45, h * 0.05);
    g.fillRect(w * 0.1, h * 0.55, w * 0.35, h * 0.05);
    g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.85, 1);
    g.beginPath();
    g.roundRect(w * 0.1, h * 0.7, w * 0.3, h * 0.12, h * 0.06);
    g.fill();
  },
  // photo-like: soft blurry blobs
  (g, w, h, r, v) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, v ? pick(r, VIVID) : grey(r, 0.2, 0.5));
    bg.addColorStop(1, grey(r, 0.05, 0.3));
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = w * (0.2 + r() * 0.35);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, v && r() < 0.5 ? pick(r, VIVID) : grey(r, 0.6, 1));
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }
  },
  // poster: big shape on a flat colour
  (g, w, h, r, v) => {
    g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.06, 0.9);
    g.fillRect(0, 0, w, h);
    g.fillStyle = grey(r, 0, 1);
    if (r() < 0.5) {
      g.beginPath();
      g.arc(w * (0.3 + r() * 0.4), h * (0.3 + r() * 0.4), w * (0.15 + r() * 0.2), 0, Math.PI * 2);
      g.fill();
    } else {
      g.font = `700 ${Math.round(h * 0.6)}px sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String.fromCharCode(65 + Math.floor(r() * 26)), w / 2, h * 0.55);
    }
  },
  // gallery grid
  (g, w, h, r, v) => {
    g.fillStyle = grey(r, 0.9, 0.98);
    g.fillRect(0, 0, w, h);
    const n = 3;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        g.fillStyle = v && r() < 0.4 ? pick(r, VIVID) : grey(r, 0.15, 0.8);
        g.fillRect(w * (0.08 + x * 0.29), h * (0.08 + y * 0.29), w * 0.25, h * 0.25);
      }
  },
  // gradient card with a logo dot
  (g, w, h, r, v) => {
    const gr = g.createLinearGradient(0, h, w, 0);
    gr.addColorStop(0, v ? pick(r, VIVID) : grey(r, 0.1, 0.4));
    gr.addColorStop(1, v ? pick(r, VIVID) : grey(r, 0.5, 0.95));
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = grey(r, 0.9, 1);
    g.beginPath();
    g.arc(w * 0.3, h * 0.5, w * 0.12, 0, Math.PI * 2);
    g.fill();
    g.fillRect(w * 0.48, h * 0.45, w * 0.35, h * 0.1);
  },
  // bar chart
  (g, w, h, r, v) => {
    g.fillStyle = grey(r, 0.04, 0.12);
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      const bh = h * (0.2 + r() * 0.6);
      g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.4, 0.95);
      g.fillRect(w * (0.1 + i * 0.17), h * 0.9 - bh, w * 0.11, bh);
    }
  },
  // grain / texture
  (g, w, h, r, v) => {
    g.fillStyle = v ? pick(r, VIVID) : grey(r, 0.2, 0.7);
    g.fillRect(0, 0, w, h);
    const img = g.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 70;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function buildAtlas(imageKeys: string[]): Promise<Atlas> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ATLAS_GRID * TILE;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, canvas.width, canvas.height);
  const r = rng(777);
  const total = ATLAS_GRID * ATLAS_GRID;
  const neutral: number[] = [];
  const vivid: number[] = [];

  const slot = (i: number) => [(i % ATLAS_GRID) * TILE + PAD, Math.floor(i / ATLAS_GRID) * TILE + PAD, TILE - PAD * 2] as const;

  // 1) real project images first (cover-cropped into squares), used by both pools
  const images = (await Promise.all(imageKeys.slice(0, 24).map((k) => loadImage(`/media/${k}?w=64`)))).filter(Boolean) as HTMLImageElement[];
  let i = 0;
  for (const img of images) {
    const [x, y, s] = slot(i);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, x, y, s, s);
    neutral.push(i, i);
    vivid.push(i);
    i++;
  }

  // 2) procedural mini-thumbnails for the rest: ~70 % grey, ~30 % vivid
  for (; i < total; i++) {
    const isVivid = i % 10 >= 7;
    const [x, y, s] = slot(i);
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.rect(0, 0, s, s);
    g.clip();
    pick(r, layouts)(g, s, s, r, isVivid);
    g.restore();
    (isVivid ? vivid : neutral).push(i);
  }
  return { canvas, neutral, vivid };
}
