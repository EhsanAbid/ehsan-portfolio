import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon's HTTP driver: every query is one stateless HTTPS request, which suits
 * serverless functions (no connection pool to exhaust). Created lazily so that
 * importing this module never crashes a build that has no DATABASE_URL.
 *
 * Local development: if DATABASE_URL points at localhost, queries go to the
 * PGlite shim (`npm run db:local`, scripts/local-db.mjs) which speaks the same
 * HTTP protocol — so local and production share one code path.
 */
let instance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    const { hostname, port } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      neonConfig.fetchEndpoint = `http://127.0.0.1:${port || 4444}/sql`;
    }
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
