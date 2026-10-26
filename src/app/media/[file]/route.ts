import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

/**
 * GET /media/<hash>.<ext> — serves uploaded files from Neon.
 *
 * The URL contains the file's content hash, so the bytes behind a URL can never change.
 * That lets us say `immutable` + 1 year: Vercel's CDN and browsers keep it forever and
 * Neon is asked for each file roughly once (spec §8.2).
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  const m = /^([a-f0-9]{24})\.(webp|pdf)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });

  const [row] = await getDb()
    .select({ bytes: schema.media.bytes, mime: schema.media.mime, filename: schema.media.filename })
    .from(schema.media)
    .where(eq(schema.media.hash, m[1]))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const isPdf = row.mime === "application/pdf";
  const safeName = row.filename.replace(/["\\\r\n]/g, "_");
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(isPdf ? { "Content-Disposition": `inline; filename="${safeName}"` } : {}),
    },
  });
}
