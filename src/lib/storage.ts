import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { MediaRef } from "@/schema/fields";
import { mediaKey } from "./media";

/** Media library queries (never selects the file bytes unless asked). */

export async function listMedia() {
  const rows = await getDb()
    .select({
      id: schema.media.id,
      hash: schema.media.hash,
      filename: schema.media.filename,
      mime: schema.media.mime,
      width: schema.media.width,
      height: schema.media.height,
      size: schema.media.size,
      alt: schema.media.alt,
      createdAt: schema.media.createdAt,
    })
    .from(schema.media)
    .orderBy(desc(schema.media.id));
  return rows.map((r) => ({ ...r, key: mediaKey(r.hash, r.mime) }));
}
export type MediaItem = Awaited<ReturnType<typeof listMedia>>[number];

export async function getMediaById(id: number) {
  const [row] = await getDb()
    .select({ id: schema.media.id, hash: schema.media.hash, mime: schema.media.mime, alt: schema.media.alt, width: schema.media.width, height: schema.media.height })
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  return row ? { ...row, key: mediaKey(row.hash, row.mime) } : null;
}

export async function updateMediaAlt(id: number, alt: string) {
  await getDb().update(schema.media).set({ alt: alt.slice(0, 500) }).where(eq(schema.media.id, id));
}

export async function deleteMediaRow(id: number) {
  await getDb().delete(schema.media).where(eq(schema.media.id, id));
}

const isRef = (v: unknown): v is MediaRef =>
  !!v && typeof v === "object" && "key" in v && "alt" in v && typeof (v as MediaRef).key === "string";

/** "Where is this file used?" — paths of every MediaRef pointing at `key`. */
export function findUsage(doc: unknown, key: string, path = ""): string[] {
  if (isRef(doc)) return doc.key === key ? [path] : [];
  if (Array.isArray(doc)) return doc.flatMap((v, i) => findUsage(v, key, `${path}[${i}]`));
  if (doc && typeof doc === "object")
    return Object.entries(doc).flatMap(([k, v]) => findUsage(v, key, path ? `${path}.${k}` : k));
  return [];
}

/** Point every reference to `oldKey` at a new file (replace), or update its alt text. Returns a new document. */
export function rewriteRefs<T>(doc: T, oldKey: string, next: Partial<MediaRef>): T {
  if (isRef(doc)) return (doc.key === oldKey ? { ...doc, ...next } : doc) as T;
  if (Array.isArray(doc)) return doc.map((v) => rewriteRefs(v, oldKey, next)) as T;
  if (doc && typeof doc === "object")
    return Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, rewriteRefs(v, oldKey, next)])) as T;
  return doc;
}
