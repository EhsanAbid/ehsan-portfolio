import { eq } from "drizzle-orm";
import sharp from "sharp";
import { getDb, schema } from "@/db/client";

/** Smaller copies the site asks for: the block-portrait sample and project-card textures. */
const WIDTHS = new Set([64, 96, 128, 160, 200, 320, 640, 960]);

/**
 * GET /media/<hash>.<ext>[?w=640] — serves uploaded files from Neon.
 *
 * The URL contains the file's content hash, so the bytes behind a URL can never change.
 * That lets us say `immutable` + 1 year: Vercel's CDN and browsers keep it forever and
 * Neon is asked for each file roughly once (spec §8.2). `?w=` returns a resized WebP
 * (only a fixed list of widths, so nobody can make the server resize to every size);
 * the CDN caches each width separately.
 */
export async function GET(req: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  const m = /^([a-f0-9]{24})\.(webp|pdf)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const w = Number(new URL(req.url).searchParams.get("w") ?? 0);
  if (w && !WIDTHS.has(w)) return new Response("Unsupported width", { status: 400 });

  const [row] = await getDb()
    .select({ bytes: schema.media.bytes, mime: schema.media.mime, filename: schema.media.filename })
    .from(schema.media)
    .where(eq(schema.media.hash, m[1]))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const isPdf = row.mime === "application/pdf";
  let body: Uint8Array = new Uint8Array(row.bytes);
  if (w && !isPdf) {
    body = new Uint8Array(await sharp(row.bytes).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
  }
  const safeName = row.filename.replace(/["\\\r\n]/g, "_");
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(isPdf ? { "Content-Disposition": `inline; filename="${safeName}"` } : {}),
    },
  });
}
