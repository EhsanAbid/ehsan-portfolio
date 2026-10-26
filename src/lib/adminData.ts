import "server-only";
import { cache } from "react";
import { and, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { requireAdmin } from "./auth";
import { getWorkingSite } from "./publish";

/**
 * Everything an admin page needs, loaded once per request. React's cache() dedupes the
 * call between the layout and the page, so the session + draft are read only once.
 */
export const loadAdmin = cache(async () => {
  const admin = await requireAdmin();
  const working = await getWorkingSite();
  return { admin, ...working };
});

export const unreadCount = cache(async () => {
  const [r] = await getDb()
    .select({ n: count() })
    .from(schema.messages)
    .where(and(eq(schema.messages.read, false), eq(schema.messages.spam, false)));
  return r?.n ?? 0;
});
