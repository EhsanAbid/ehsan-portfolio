// Applies the SQL files in /drizzle to the database in DATABASE_URL.
// Uses the same Neon HTTP driver as the app, so it works for Neon and the local shim.
import { existsSync } from "node:fs";
// Which env file to read: --env=.env.production.local for the live (Neon main) database.
const envArg = process.argv.find((a) => a.startsWith("--env="));
const envFile = envArg ? envArg.slice(6) : ".env.local";
if (envArg && !existsSync(envFile)) throw new Error(`${envFile} not found (see DEPLOY.md)`);
if (existsSync(envFile)) process.loadEnvFile(envFile);

import { migrate } from "drizzle-orm/neon-http/migrator";
import { getDb } from "./client";
import { assertOwnDatabase } from "./guard";

async function main() {
  await assertOwnDatabase(getDb(), "migrate");
  console.log("[migrate] applying migrations …");
  await migrate(getDb(), { migrationsFolder: "drizzle" });
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
