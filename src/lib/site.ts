import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { parseSite, type Site } from "@/schema/site";

export const SITE_TAG = "site";

/**
 * The published site, as every visitor sees it.
 *
 * Caching (spec §8.2): `'use cache'` stores the result, `cacheTag('site')` labels it, and
 * `cacheLife('max')` keeps it for a long time. The page that uses it is prerendered into a
 * static shell, so a normal visit runs **zero** database queries and Neon can sleep.
 * When the admin presses Publish we call `updateTag('site')` — the next request re-reads
 * the new version once and the cache is warm again.
 */
export async function getPublishedSite(): Promise<Site | null> {
  "use cache";
  cacheTag(SITE_TAG);
  cacheLife("max");
  const [row] = await getDb()
    .select({ data: schema.siteVersions.data })
    .from(schema.siteVersions)
    .where(eq(schema.siteVersions.status, "published"))
    .orderBy(desc(schema.siteVersions.publishedAt))
    .limit(1);
  if (!row) return null;
  // parse fills defaults for fields added after this version was saved
  return parseSite(row.data);
}
