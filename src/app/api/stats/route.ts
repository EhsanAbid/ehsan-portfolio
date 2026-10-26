import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/client";
import { json, sameOrigin } from "@/lib/http";
import { getPublishedSite } from "@/lib/site";

/**
 * POST /api/stats {key} — anonymous counters for the dashboard.
 * The browser sends each key at most once per visitor session ("visits") or once ever
 * (an achievement unlock), so this is one tiny upsert per visit — no personal data at all.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const parsed = z.object({ key: z.string().max(80) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { key } = parsed.data;

  // Only accept known keys, so nobody can fill the table with junk.
  if (key !== "visits") {
    const site = await getPublishedSite(); // cached — no DB query
    const ids = new Set(site?.game.achievements.map((a) => `unlock:${a.id}`) ?? []);
    if (!ids.has(key)) return json({ error: "unknown key" }, 400);
  }

  await getDb()
    .insert(schema.stats)
    .values({ key, count: 1 })
    .onConflictDoUpdate({ target: schema.stats.key, set: { count: sql`${schema.stats.count} + 1`, updatedAt: new Date() } });
  return json({ ok: true });
}
