// Seed script: `npm run db:seed`
//  1. creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD (bcrypt hash only),
//  2. optimises files in /assets_input into the media library,
//  3. publishes the first site version with all default content (TODO_EHSAN placeholders).
// Safe to run again: existing admin + published content are kept unless you pass a flag:
//   --reset-admin   overwrite the admin password with ADMIN_PASSWORD
//   --reset-content replace the published content with fresh defaults (old one is archived)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
// Which env file to read: --env=.env.production.local for the live (Neon main) database.
const envArg = process.argv.find((a) => a.startsWith("--env="));
const envFile = envArg ? envArg.slice(6) : ".env.local";
if (envArg && !existsSync(envFile)) throw new Error(`${envFile} not found (see DEPLOY.md)`);
if (existsSync(envFile)) process.loadEnvFile(envFile);

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./client";
import { buildDefaultSite } from "../schema/defaults";
import { storeUpload, toRef, type StoredMedia } from "../lib/media";
import type { Site } from "../schema/site";

const args = new Set(process.argv.slice(2));

async function seedAdmin() {
  const db = getDb();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email) throw new Error("ADMIN_EMAIL is missing in the environment");

  const [existing] = await db.select().from(schema.adminUser).limit(1);
  if (existing && !args.has("--reset-admin")) {
    console.log(`[seed] admin exists (${existing.email}) — kept. Use --reset-admin to overwrite.`);
    return;
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  // bcrypt cost 12 ≈ 250 ms per hash: slow enough to make guessing expensive, fast enough to log in.
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    await db
      .update(schema.adminUser)
      .set({ email, passwordHash, sessionVersion: existing.sessionVersion + 1, updatedAt: new Date() })
      .where(eq(schema.adminUser.id, existing.id));
    console.log(`[seed] admin password reset for ${email}`);
  } else {
    await db.insert(schema.adminUser).values({ email, passwordHash });
    console.log(`[seed] admin created: ${email}`);
  }
  console.log("[seed] you can now remove ADMIN_PASSWORD from your environment.");
}

async function seedAssets(): Promise<StoredMedia[]> {
  const dir = path.resolve("assets_input");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => !f.startsWith(".") && statSync(path.join(dir, f)).isFile());
  const stored: StoredMedia[] = [];
  for (const f of files) {
    try {
      const alt = path.parse(f).name.replace(/[-_]+/g, " ");
      const m = await storeUpload(readFileSync(path.join(dir, f)), f, alt);
      stored.push(m);
      console.log(`[seed] media: ${f} → /media/${m.key} (${Math.round(m.size / 1024)} KB)`);
    } catch (err) {
      console.warn(`[seed] skipped ${f}: ${(err as Error).message}`);
    }
  }
  return stored;
}

/** Attach obvious assets: a photo-like image becomes the profile photo, a CV-like PDF the CV. */
function attachAssets(site: Site, media: StoredMedia[]) {
  const photo = media.find((m) => m.mime.startsWith("image/") && /photo|profile|avatar|me|ehsan/i.test(m.filename))
    ?? media.find((m) => m.mime.startsWith("image/"));
  if (photo) site.profile.photo = toRef({ ...photo, alt: `Photo of ${site.profile.name}` });
  const cv = media.find((m) => m.mime === "application/pdf" && /cv|resume|résumé/i.test(m.filename))
    ?? media.find((m) => m.mime === "application/pdf");
  if (cv) site.profile.cv = toRef({ ...cv, alt: `CV of ${site.profile.name}` });
}

async function seedContent(media: StoredMedia[]) {
  const db = getDb();
  const [published] = await db
    .select({ id: schema.siteVersions.id })
    .from(schema.siteVersions)
    .where(eq(schema.siteVersions.status, "published"))
    .limit(1);
  if (published && !args.has("--reset-content")) {
    console.log("[seed] published content exists — kept. Use --reset-content to replace with defaults.");
    return;
  }
  const site = buildDefaultSite();
  attachAssets(site, media);
  if (published) {
    await db.update(schema.siteVersions).set({ status: "archived" }).where(eq(schema.siteVersions.status, "published"));
  }
  await db.insert(schema.siteVersions).values({
    status: "published",
    data: site,
    note: "Initial seed (defaults from the spec)",
    publishedAt: new Date(),
  });
  console.log("[seed] published the default site version.");
}

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "postgresql://x@missing/x").hostname;
  console.log(`[seed] database: ${host}`);
  await seedAdmin();
  const media = await seedAssets();
  await seedContent(media);
  console.log("[seed] done.");
}

main().catch((err) => {
  console.error("[seed] failed:", err.message ?? err);
  process.exit(1);
});
