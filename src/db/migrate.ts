// Applies the SQL files in /drizzle to the database in DATABASE_URL.
// Uses the same Neon HTTP driver as the app, so it works for Neon and the local shim.
import { existsSync } from "node:fs";
if (existsSync(".env.local") && !process.env.SKIP_ENV_FILE) process.loadEnvFile(".env.local");

import { migrate } from "drizzle-orm/neon-http/migrator";
import { getDb } from "./client";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "postgresql://x@missing/x").hostname;
  console.log(`[migrate] applying migrations to ${host} …`);
  await migrate(getDb(), { migrationsFolder: "drizzle" });
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
