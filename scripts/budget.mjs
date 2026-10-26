// Performance-budget check (spec §9). Run against a production server:
//   npm run build && npm run start   (in another terminal)
//   node scripts/budget.mjs [http://localhost:3000]
// Measures what a first visit downloads (gzip): HTML, CSS, JS, preloaded fonts,
// plus the lazily-loaded 3D chunk and the admin-only code that must NOT be on public pages.
import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

const html = await (await fetch(base + "/")).text();
// `nomodule` scripts are polyfills for very old browsers; modern browsers never download them.
const scripts = [...html.matchAll(/<script([^>]+)src="([^"]+)"[^>]*>/g)].filter((m) => !/nomodule/i.test(m[0])).map((m) => m[2]);
const styles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
const fonts = [...html.matchAll(/<link[^>]+href="([^"]+\.woff2)"[^>]*>/g)].filter((m) => /preload/.test(m[0])).map((m) => m[1]);

async function size(url) {
  const res = await fetch(url.startsWith("http") ? url : base + url);
  const buf = Buffer.from(await res.arrayBuffer());
  return { raw: buf.length, gz: url.endsWith(".woff2") ? buf.length : gz(buf) };
}

let js = 0;
for (const s of new Set(scripts)) js += (await size(s)).gz;
let css = 0;
for (const s of new Set(styles)) css += (await size(s)).gz;
let font = 0;
for (const f of new Set(fonts)) font += (await size(f)).raw;
const htmlGz = gz(Buffer.from(html));

// Lazy chunks on disk: find the three.js chunk(s) and make sure admin code isn't in first-load JS.
const dir = ".next/static/chunks";
const files = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".js"));
let three = 0;
for (const f of files) {
  const buf = readFileSync(path.join(dir, String(f)));
  if (buf.includes("WebGLRenderer")) three += gz(buf);
}
const firstLoadHasAdmin = await (async () => {
  for (const s of new Set(scripts)) {
    const t = await (await fetch(base + s)).text();
    if (t.includes("ProseMirror") || t.includes("HexColorPicker") || t.includes("DndContext")) return true;
  }
  return false;
})();

const total = htmlGz + js + css + font;
const row = (name, value, limit) => console.log(`${name.padEnd(34)} ${kb(value).padStart(10)}   budget ${kb(limit).padStart(9)}  ${value <= limit ? "✓" : "✗ OVER"}`);
console.log(`\nBudget report for ${base}\n`);
row("Public JS, first load (gzip)", js, 200 * 1024);
row("3D chunk(s) (gzip, lazy)", three, 350 * 1024);
row("Total first load (HTML+CSS+JS+fonts)", total, 1.5 * 1024 * 1024);
console.log(`${"  of which HTML / CSS / fonts".padEnd(34)} ${kb(htmlGz)} / ${kb(css)} / ${kb(font)}`);
console.log(`${"Admin libraries in public JS?".padEnd(34)} ${firstLoadHasAdmin ? "✗ yes" : "✓ no"}`);
