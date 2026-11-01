// Safety check for `db:migrate` / `db:seed`: refuse to touch a database that already holds another
// project's tables (e.g. a different website on the same Neon account), so a wrong connection string
// can't add tables to — or mix migrations with — someone else's database.
import { sql } from "drizzle-orm";
import type { Db } from "./client";

const OURS = new Set(["site_versions", "media", "messages", "stats", "admin_user", "login_attempts"]);
const OVERRIDE = "--force-db";

export async function assertOwnDatabase(db: Db, tag: string) {
  const host = new URL(process.env.DATABASE_URL ?? "postgresql://x@missing/x").hostname;
  console.log(`[${tag}] database host: ${host}`);
  const res = await db.execute(sql`
    select table_schema, table_name from information_schema.tables
    where table_schema not in ('pg_catalog', 'information_schema') and table_schema not like 'neon%'`);
  const foreign = res.rows
    .map((r) => ({ schema: String(r.table_schema), name: String(r.table_name) }))
    // our tables live in "public"; drizzle keeps its migration log in "drizzle"
    .filter((t) => !(t.schema === "public" && OURS.has(t.name)) && !(t.schema === "drizzle" && t.name === "__drizzle_migrations"))
    .map((t) => `${t.schema}.${t.name}`);
  if (!foreign.length || process.argv.includes(OVERRIDE)) return;
  console.error(
    `[${tag}] STOPPED: this database already contains tables from another project:\n  ${foreign.slice(0, 12).join(", ")}${foreign.length > 12 ? " …" : ""}\n` +
      `[${tag}] Check DATABASE_URL — the portfolio needs its own, empty Neon project. Nothing was changed.\n` +
      `[${tag}] (Only if you are sure: re-run with ${OVERRIDE}.)`,
  );
  process.exit(2);
}
