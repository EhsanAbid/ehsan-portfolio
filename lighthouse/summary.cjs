// Prints the key numbers from a Lighthouse JSON report: node lighthouse/summary.cjs <file>
const r = require(require("path").resolve(process.argv[2]));
const c = r.categories;
console.log(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)])));
const a = r.audits;
for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive", "total-byte-weight"])
  console.log(k.padEnd(26), a[k]?.displayValue);
