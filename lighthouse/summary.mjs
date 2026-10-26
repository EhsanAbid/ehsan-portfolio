// Prints the key numbers from a Lighthouse JSON report: node lighthouse/summary.mjs <file>
import { readFileSync } from "node:fs";

const r = JSON.parse(readFileSync(process.argv[2], "utf8"));
console.log(Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])));
const a = r.audits;
for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive", "total-byte-weight"])
  console.log(k.padEnd(26), a[k]?.displayValue);
