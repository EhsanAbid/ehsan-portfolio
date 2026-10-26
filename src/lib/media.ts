import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { MediaRef } from "@/schema/fields";

export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB in
export const PDF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const IMAGE_MAX_SIDE = 1920;
export const WEBP_QUALITY = 80;

type Kind = "jpeg" | "png" | "webp" | "gif" | "avif" | "pdf";

/**
 * Detect the real file type from its first bytes ("magic numbers") instead of trusting
 * the extension or the browser-sent MIME type, which an attacker controls.
 * SVG is deliberately not accepted: it is XML that can carry scripts.
 */
export function sniff(buf: Buffer): Kind | null {
  const h = (n: number) => buf.subarray(0, n);
  if (buf.length < 12) return null;
  if (h(3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (h(8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (h(4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (h(4).toString("latin1") === "GIF8") return "gif";
  if (buf.subarray(4, 12).toString("latin1").startsWith("ftypavi")) return "avif";
  if (h(5).toString("latin1") === "%PDF-") return "pdf";
  return null;
}

export class MediaError extends Error {}

export type StoredMedia = {
  id: number;
  key: string;
  hash: string;
  filename: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  alt: string;
};

export const mediaKey = (hash: string, mime: string) => `${hash}.${mime === "application/pdf" ? "pdf" : "webp"}`;
export { mediaUrl } from "./mediaUrl";

/**
 * Validate, optimise and store an upload.
 * Images: auto-rotate (EXIF), shrink to ≤ 1920 px, re-encode as WebP q80 (strips metadata).
 * The content hash becomes the URL, so identical uploads are stored once and the URL can be
 * cached forever ("immutable") — a new image always gets a new URL.
 */
export async function storeUpload(input: Buffer, filename: string, alt: string): Promise<StoredMedia> {
  const kind = sniff(input);
  if (!kind) throw new MediaError("Unsupported file type. Use JPEG, PNG, WebP, GIF, AVIF or PDF.");

  let bytes: Buffer;
  let mime: string;
  let width: number | null = null;
  let height: number | null = null;

  if (kind === "pdf") {
    if (input.length > PDF_MAX_BYTES) throw new MediaError("PDF is larger than 5 MB.");
    bytes = input;
    mime = "application/pdf";
  } else {
    if (input.length > IMAGE_MAX_BYTES) throw new MediaError("Image is larger than 4 MB.");
    const out = await sharp(input, { animated: false, limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: IMAGE_MAX_SIDE, height: IMAGE_MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    bytes = out.data;
    width = out.info.width;
    height = out.info.height;
    mime = "image/webp";
  }

  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 24);
  const safeName = filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
  const db = getDb();
  const [existing] = await db.select().from(schema.media).where(eq(schema.media.hash, hash)).limit(1);
  const row =
    existing ??
    (
      await db
        .insert(schema.media)
        .values({ hash, filename: safeName, mime, bytes, width, height, size: bytes.length, alt: alt.slice(0, 500) })
        .returning()
    )[0];

  return {
    id: row.id,
    key: mediaKey(row.hash, row.mime),
    hash: row.hash,
    filename: row.filename,
    mime: row.mime,
    width: row.width,
    height: row.height,
    size: row.size,
    alt: row.alt,
  };
}

export function toRef(m: Pick<StoredMedia, "key" | "alt" | "width" | "height">): MediaRef {
  return { key: m.key, alt: m.alt, width: m.width ?? 0, height: m.height ?? 0 };
}
