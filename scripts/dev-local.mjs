// `npm run dev:local` — starts the local database (PGlite, see local-db.mjs) and `next dev`
// together, for working without a Neon connection. Ctrl+C stops both.
import { spawn } from "node:child_process";

const run = (cmd, args) => spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
const db = run("node", ["scripts/local-db.mjs"]);

// Give the database a moment to open its data folder, then start Next.js.
setTimeout(() => {
  const next = run("npx", ["next", "dev"]);
  const stop = () => {
    next.kill();
    db.kill();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  next.on("exit", stop);
}, 1500);
