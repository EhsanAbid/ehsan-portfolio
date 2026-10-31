import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { cacheLife } from "next/cache";
import { getDb, schema } from "@/db/client";
import { getPublishedSite } from "@/lib/site";

/**
 * The portrait turned into black & white blocks (never the real photo): shrink it to a tiny
 * grid, then scale back up with "nearest neighbour" so every pixel becomes a hard square.
 * Read straight from the database (no network fetch).
 */
async function photoDataUrl(key: string) {
  "use cache"; // the bytes behind a media key never change
  cacheLife("max");
  const [row] = await getDb()
    .select({ bytes: schema.media.bytes })
    .from(schema.media)
    .where(eq(schema.media.hash, key.split(".")[0]))
    .limit(1);
  if (!row) return null;
  const crop = await sharp(row.bytes).metadata();
  const h = Math.round((crop.height ?? 1000) * 0.62);
  const png = await sharp(row.bytes)
    .extract({ left: 0, top: 0, width: crop.width ?? 1000, height: Math.min(h, crop.height ?? h) })
    .greyscale()
    .resize({ height: 56 })
    .resize({ height: 600, kernel: "nearest" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/**
 * GET /og — the auto-generated 1200×630 share image (LinkedIn preview card), used when no
 * Open Graph image is uploaded in Admin → SEO. Built from the published version, so it is
 * prerendered and refreshed on Publish like the page.
 */
export async function GET() {
  const site = await getPublishedSite();
  const name = site?.profile.name ?? "Portfolio";
  const c = site?.design.colors;
  const photo = site?.profile.photo.key ? await photoDataUrl(site.profile.photo.key) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: c?.bg ?? "#0A0A0A", color: c?.text ?? "#F2F2F0" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={520} height={590} style={{ position: "absolute", right: 60, top: 40, objectFit: "contain", opacity: 0.95 }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 64, top: 56, fontSize: 24, color: c?.muted ?? "#A3A3A0" }}>
          <span>{site?.copy.top.currently ?? ""}</span>
          <span style={{ color: c?.text ?? "#F2F2F0" }}>{site?.profile.currently ?? ""}</span>
        </div>
        <div style={{ display: "flex", position: "absolute", left: 56, bottom: 36, fontSize: 132, fontStyle: "italic", letterSpacing: -5, lineHeight: 0.9, fontFamily: "serif", maxWidth: 1100 }}>
          {name}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
