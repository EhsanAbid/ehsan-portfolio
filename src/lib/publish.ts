import "server-only";
import { and, desc, eq, inArray, ne, notInArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { parseSite, siteSchema, type Site } from "@/schema/site";

/*
 * ───────────── Draft → Preview → Publish ─────────────
 * site_versions holds at most one `draft` row (the admin's working copy), exactly one
 * `published` row (what visitors see) and older `archived` rows (history, last 30 kept).
 * Admin edits only ever touch the draft, so visitors never see half-finished changes.
 */

export const KEEP_VERSIONS = 30;
type Row = typeof schema.siteVersions.$inferSelect;

async function latest(status: Row["status"]) {
  const [row] = await getDb()
    .select()
    .from(schema.siteVersions)
    .where(eq(schema.siteVersions.status, status))
    .orderBy(desc(schema.siteVersions.id))
    .limit(1);
  return row ?? null;
}

export const getDraftRow = () => latest("draft");
export const getPublishedRow = () => latest("published");

/** The document the admin is editing: the draft if there is one, otherwise the live version. */
export async function getWorkingSite() {
  const [draft, published] = await Promise.all([getDraftRow(), getPublishedRow()]);
  const base = draft ?? published;
  const site = parseSite(base?.data ?? {});
  const live = published ? parseSite(published.data) : null;
  return {
    site,
    published: live,
    hasDraft: !!draft,
    draftUpdatedAt: draft?.updatedAt ?? null,
    publishedAt: published?.publishedAt ?? null,
    changes: live ? countChanges(live, site) : 1,
  };
}

/** Number of leaf values that differ between two documents (the "unpublished changes" badge). */
export function countChanges(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return 1;
  if (Array.isArray(a) !== Array.isArray(b)) return 1;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let n = 0;
  for (const k of keys) n += countChanges((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
  return n;
}

export type SaveResult = { ok: true; changes: number } | { ok: false; error: string; issues?: { path: string; message: string }[] };

function issuesOf(err: import("zod").ZodError) {
  return err.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), message: i.message }));
}

async function writeDraft(site: Site) {
  const db = getDb();
  const draft = await getDraftRow();
  if (draft) {
    await db.update(schema.siteVersions).set({ data: site, updatedAt: new Date() }).where(eq(schema.siteVersions.id, draft.id));
  } else {
    await db.insert(schema.siteVersions).values({ status: "draft", data: site });
  }
}

/** Replace one top-level area (e.g. "profile", "sections") of the draft, validating the whole site. */
export async function saveDraftKey(key: keyof Site, value: unknown): Promise<SaveResult> {
  if (!(key in siteSchema.shape)) return { ok: false, error: `Unknown area "${String(key)}"` };
  const { site, published } = await getWorkingSite();
  const parsed = siteSchema.safeParse({ ...site, [key]: value });
  if (!parsed.success) return { ok: false, error: "Some fields are invalid.", issues: issuesOf(parsed.error) };
  await writeDraft(parsed.data);
  return { ok: true, changes: published ? countChanges(published, parsed.data) : 1 };
}

/** Replace the whole draft (backup import, "edit this version"). */
export async function replaceDraft(data: unknown): Promise<SaveResult> {
  const parsed = siteSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "That file is not a valid site backup.", issues: issuesOf(parsed.error) };
  await writeDraft(parsed.data);
  const published = await getPublishedRow();
  return { ok: true, changes: published ? countChanges(parseSite(published.data), parsed.data) : 1 };
}

/**
 * Publish a document atomically: current live → archived, new live row, draft removed.
 * Runs as one batch (= one database transaction), so a crash can never leave the site
 * with zero or two published versions.
 */
async function publishData(site: Site, note: string) {
  const db = getDb();
  await db.batch([
    db.update(schema.siteVersions).set({ status: "archived" }).where(eq(schema.siteVersions.status, "published")),
    db.insert(schema.siteVersions).values({ status: "published", data: site, note: note.slice(0, 200) || null, publishedAt: new Date() }),
    db.delete(schema.siteVersions).where(eq(schema.siteVersions.status, "draft")),
  ]);
  await pruneVersions();
}

export async function publishDraft(note = ""): Promise<SaveResult> {
  const draft = await getDraftRow();
  if (!draft) return { ok: false, error: "Nothing to publish — there is no draft." };
  const parsed = siteSchema.safeParse(draft.data);
  if (!parsed.success) return { ok: false, error: "The draft has invalid fields.", issues: issuesOf(parsed.error) };
  await publishData(parsed.data, note);
  return { ok: true, changes: 0 };
}

export async function discardDraft() {
  await getDb().delete(schema.siteVersions).where(eq(schema.siteVersions.status, "draft"));
}

/** Keep the newest KEEP_VERSIONS non-draft versions, delete older archived ones. */
async function pruneVersions() {
  const db = getDb();
  const keep = await db
    .select({ id: schema.siteVersions.id })
    .from(schema.siteVersions)
    .where(ne(schema.siteVersions.status, "draft"))
    .orderBy(desc(schema.siteVersions.id))
    .limit(KEEP_VERSIONS);
  if (keep.length < KEEP_VERSIONS) return;
  await db.delete(schema.siteVersions).where(
    and(
      eq(schema.siteVersions.status, "archived"),
      notInArray(schema.siteVersions.id, keep.map((k) => k.id)),
    ),
  );
}

export async function listVersions() {
  return getDb()
    .select({
      id: schema.siteVersions.id,
      status: schema.siteVersions.status,
      note: schema.siteVersions.note,
      createdAt: schema.siteVersions.createdAt,
      updatedAt: schema.siteVersions.updatedAt,
      publishedAt: schema.siteVersions.publishedAt,
    })
    .from(schema.siteVersions)
    .where(inArray(schema.siteVersions.status, ["draft", "published", "archived"]))
    .orderBy(desc(schema.siteVersions.id));
}

export async function getVersion(id: number) {
  const [row] = await getDb().select().from(schema.siteVersions).where(eq(schema.siteVersions.id, id)).limit(1);
  return row ? { ...row, site: parseSite(row.data) } : null;
}

/** One-click restore: an older version becomes the live site again (as a new version). */
export async function restoreVersion(id: number): Promise<SaveResult> {
  const v = await getVersion(id);
  if (!v) return { ok: false, error: "Version not found." };
  await publishData(v.site, `Restored version #${id}`);
  return { ok: true, changes: 0 };
}

export async function loadVersionIntoDraft(id: number): Promise<SaveResult> {
  const v = await getVersion(id);
  if (!v) return { ok: false, error: "Version not found." };
  return replaceDraft(v.site);
}
