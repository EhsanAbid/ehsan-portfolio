// Quick sanity check: lists tables and round-trips a few column types.
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
import { sql } from "drizzle-orm";
import { getDb } from "../src/db/client";

async function main() {
  const db = getDb();
  const t = await db.execute(sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`);
  console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
  const v = await db.execute(sql`select '\x0102ff'::bytea as b, now() as t, 5::bigint as n, '{"a":1}'::jsonb as j, true as f`);
  console.log(v.rows[0]);
}
main().catch((e) => { console.error(e); process.exit(1); });
