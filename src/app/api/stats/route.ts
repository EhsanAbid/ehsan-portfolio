import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { json, sameOrigin } from "@/lib/http";

/**
 * POST /api/stats {key: "visits"} — an anonymous visit counter for the dashboard.
 * The browser sends it at most once per session, so this is one tiny upsert per visit —
 * no personal data at all. Only known keys are accepted.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const parsed = z.object({ key: z.literal("visits") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  await getDb()
    .insert(schema.stats)
    .values({ key: parsed.data.key, count: 1 })
    .onConflictDoUpdate({ target: schema.stats.key, set: { count: sql`${schema.stats.count} + 1`, updatedAt: new Date() } });
  return json({ ok: true });
}
