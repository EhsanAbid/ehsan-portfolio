"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { AuthError, assertAdmin, login, logout } from "@/lib/auth";
import {
  discardDraft,
  getWorkingSite,
  loadVersionIntoDraft,
  publishDraft,
  replaceDraft,
  restoreVersion,
  saveDraftKey,
} from "@/lib/publish";
import { SITE_TAG } from "@/lib/site";
import { deleteMediaRow, findUsage, getMediaById, rewriteRefs, updateMediaAlt } from "@/lib/storage";
import { getPublishedRow } from "@/lib/publish";
import { parseSite, siteSchema, type Site } from "@/schema/site";

/*
 * Server actions = functions the admin UI calls directly. Next.js turns each into a POST
 * endpoint with built-in CSRF protection (it checks the Origin header). Every single one
 * re-checks the session itself via assertAdmin() — never trust that the UI was protected.
 */

type Fail = { ok: false; error: string; issues?: { path: string; message: string }[] };

async function guard<R extends { ok: boolean }>(fn: () => Promise<R>): Promise<R | Fail> {
  try {
    await assertAdmin();
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "Your session expired — please sign in again." };
    console.error("[admin action]", err);
    return { ok: false, error: "Something went wrong on the server." };
  }
}

/** Visitors see the new version: expire the cached published site (page shell included). */
function refreshLiveSite() {
  updateTag(SITE_TAG);
}

/* ───────── Auth ───────── */

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = z
    .object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Invalid email or password." };
  const res = await login(parsed.data.email, parsed.data.password);
  if (!res.ok) return { error: res.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ───────── Draft editing ───────── */

const areaKey = z.enum(Object.keys(siteSchema.shape) as [keyof Site, ...(keyof Site)[]]);

export async function saveAreaAction(key: string, value: unknown) {
  return guard(async () => {
    const k = areaKey.safeParse(key);
    if (!k.success) return { ok: false as const, error: "Unknown area" };
    return saveDraftKey(k.data, value);
  });
}

export async function publishAction(note: string) {
  return guard(async () => {
    const res = await publishDraft(String(note ?? ""));
    if (res.ok) refreshLiveSite();
    return res;
  });
}

export async function discardDraftAction() {
  return guard(async () => {
    await discardDraft();
    return { ok: true };
  });
}

export async function restoreVersionAction(id: number) {
  return guard(async () => {
    const res = await restoreVersion(z.number().int().positive().parse(id));
    if (res.ok) refreshLiveSite();
    return res;
  });
}

export async function loadVersionAction(id: number) {
  return guard(() => loadVersionIntoDraft(z.number().int().positive().parse(id)));
}

export async function importBackupAction(json: string) {
  return guard(async () => {
    if (json.length > 2_000_000) return { ok: false, error: "Backup file is too large." };
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      return { ok: false, error: "That is not a JSON file." };
    }
    const site = (data && typeof data === "object" && "site" in data ? (data as { site: unknown }).site : data) ?? {};
    return replaceDraft(site);
  });
}

/* ───────── Media ───────── */

export async function updateMediaAltAction(id: number, alt: string) {
  return guard(async () => {
    const cleanAlt = z.string().trim().min(1, "Alt text is required").max(500).parse(alt);
    const m = await getMediaById(z.number().int().parse(id));
    if (!m) return { ok: false, error: "File not found." };
    await updateMediaAlt(m.id, cleanAlt);
    // Copy the new alt text into every place the draft uses this file.
    const { site } = await getWorkingSite();
    if (findUsage(site, m.key).length) await replaceDraft(rewriteRefs(site, m.key, { alt: cleanAlt }));
    return { ok: true };
  });
}

export async function deleteMediaAction(id: number) {
  return guard(async () => {
    const m = await getMediaById(z.number().int().parse(id));
    if (!m) return { ok: false, error: "File not found." };
    const { site } = await getWorkingSite();
    const published = await getPublishedRow();
    const used = [
      ...findUsage(site, m.key).map((p) => `draft: ${p}`),
      ...(published ? findUsage(parseSite(published.data), m.key).map((p) => `live: ${p}`) : []),
    ];
    if (used.length) return { ok: false, error: `Still used in: ${[...new Set(used)].slice(0, 6).join(", ")}. Remove it there first.` };
    await deleteMediaRow(m.id);
    return { ok: true };
  });
}

/** Swap every use of one file in the draft for another (Media → Replace). */
export async function replaceMediaAction(oldId: number, newId: number) {
  return guard(async () => {
    const [a, b] = await Promise.all([getMediaById(oldId), getMediaById(newId)]);
    if (!a || !b) return { ok: false, error: "File not found." };
    const { site } = await getWorkingSite();
    const next = rewriteRefs(site, a.key, { key: b.key, alt: b.alt || a.alt, width: b.width ?? 0, height: b.height ?? 0 });
    return replaceDraft(next);
  });
}

export async function listMediaAction() {
  try {
    await assertAdmin();
  } catch {
    return [];
  }
  const { listMedia } = await import("@/lib/storage");
  return (await listMedia()).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
}

/* ───────── Inbox ───────── */

export async function updateMessageAction(id: number, patch: { read?: boolean; spam?: boolean }) {
  return guard(async () => {
    const { getDb, schema } = await import("@/db/client");
    const { eq } = await import("drizzle-orm");
    const clean = z.object({ read: z.boolean().optional(), spam: z.boolean().optional() }).parse(patch);
    await getDb().update(schema.messages).set(clean).where(eq(schema.messages.id, z.number().int().parse(id)));
    return { ok: true as const };
  });
}

export async function deleteMessageAction(id: number) {
  return guard(async () => {
    const { getDb, schema } = await import("@/db/client");
    const { eq } = await import("drizzle-orm");
    await getDb().delete(schema.messages).where(eq(schema.messages.id, z.number().int().parse(id)));
    return { ok: true as const };
  });
}

/* ───────── Account ───────── */

export async function changePasswordAction(current: string, next: string) {
  try {
    const admin = await assertAdmin();
    const { changePassword } = await import("@/lib/auth");
    return await changePassword(admin.id, String(current).slice(0, 200), String(next).slice(0, 200));
  } catch {
    return { ok: false as const, error: "Your session expired — please sign in again." };
  }
}

export async function signOutEverywhereAction() {
  const admin = await assertAdmin().catch(() => null);
  if (admin) {
    const { signOutEverywhere } = await import("@/lib/auth");
    await signOutEverywhere(admin.id);
  }
  redirect("/admin/login");
}
