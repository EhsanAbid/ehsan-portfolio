/*
 * Turns the portrait photo into blocks.
 *
 * We download a tiny copy of the photo (e.g. 128 px wide — /media/<key>?w=128), draw it on a
 * hidden 2D canvas and read every pixel. One pixel = one block: its colour is the pixel's
 * colour (plus some optional colour "noise" from the palette) and transparent pixels (the
 * cut-out background) get no block. With no photo we draw the initials instead.
 */

export type Cell = {
  /** Column/row in the grid, 0 at top-left. */
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  /** Tone 0..1 after the contrast curve: drives block size and depth (bright = big, closer). */
  lum: number;
  /** A colour-sparkle block (gets a vivid texture tile). */
  spark: boolean;
};

export type Sample = { cols: number; rows: number; cells: Cell[] };

const SAMPLE_WIDTHS = [64, 96, 128, 160, 200];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** A seeded random generator (mulberry32) so the layout is the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readCells(ctx: CanvasRenderingContext2D, cols: number, rows: number, o: { palette: string[]; colourful: number; mono: number }): Sample {
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const pal = o.palette.map(hexToRgb01);
  const rand = rng(1234);
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      if (data[i + 3] < 110) continue; // background (transparent) → no block
      const pr = data[i] / 255;
      const pg = data[i + 1] / 255;
      const pb = data[i + 2] / 255;
      // Relative luminance (how bright the eye sees it), then an S-curve for more contrast,
      // so the lit side of the face is bright and the shadows fall away — like a sculpted bust.
      const raw = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
      let t = Math.min(1, Math.max(0, (raw - 0.06) / 0.8));
      t = t * t * (3 - 2 * t);
      // Deep shadows: mostly empty, with a few dim blocks so the outline still reads.
      if (t < 0.06 && rand() > 0.35) continue;
      // Black & white: blend the photo colour toward its grey value.
      let r = pr * (1 - o.mono) + t * o.mono;
      let g = pg * (1 - o.mono) + t * o.mono;
      let b = pb * (1 - o.mono) + t * o.mono;
      // Colour sparkles: a few blocks borrow a vivid palette colour at the same brightness.
      const spark = pal.length > 0 && rand() < o.colourful;
      if (spark) {
        const p = pal[Math.floor(rand() * pal.length)];
        const k = 0.6 + rand() * 0.35;
        const scale = 0.45 + t * 0.9;
        r = r * (1 - k) + p[0] * scale * k;
        g = g * (1 - k) + p[1] * scale * k;
        b = b * (1 - k) + p[2] * scale * k;
      }
      // Lift the darkest blocks slightly so they're visible on a black page.
      r = 0.08 + r * 0.92;
      g = 0.08 + g * 0.92;
      b = 0.09 + b * 0.91;
      cells.push({ x, y, r, g, b, lum: t, spark });
    }
  }
  return { cols, rows, cells };
}

export async function samplePortrait(opts: {
  photoKey: string | null;
  cols: number;
  /** Share of the photo (from the top) to use: 1 = whole photo, 0.6 ≈ head and shoulders. */
  crop: number;
  initials: string;
  fontFamily: string;
  palette: string[];
  colourful: number;
  mono: number;
}): Promise<Sample> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  if (opts.photoKey) {
    try {
      // Use the smallest pre-made width that is at least as wide as the grid.
      const w = SAMPLE_WIDTHS.find((s) => s >= opts.cols) ?? SAMPLE_WIDTHS[SAMPLE_WIDTHS.length - 1];
      const img = await loadImage(`/media/${opts.photoKey}?w=${w}`);
      const cols = opts.cols;
      const srcH = img.naturalHeight * Math.min(1, Math.max(0.1, opts.crop));
      const rows = Math.max(1, Math.round(cols * (srcH / img.naturalWidth)));
      canvas.width = cols;
      canvas.height = rows;
      ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, cols, rows);
      return readCells(ctx, cols, rows, opts);
    } catch {
      /* fall through to the initials */
    }
  }

  // No photo yet: big initials made of blocks.
  const cols = opts.cols;
  const rows = Math.round(cols * 1.1);
  canvas.width = cols;
  canvas.height = rows;
  ctx.fillStyle = "#e9e9e6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic ${Math.round(rows * 0.62)}px ${opts.fontFamily}`;
  ctx.fillText(opts.initials, cols / 2, rows * 0.52);
  return readCells(ctx, cols, rows, opts);
}
