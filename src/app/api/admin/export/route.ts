import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { getWorkingSite } from "@/lib/publish";
import { listMedia } from "@/lib/storage";

/** GET /api/admin/export — full backup: the site JSON (draft or live) + the media list. */
export async function GET() {
  if (!(await getSession())) return json({ error: "Not signed in" }, 401);
  const [{ site, published, hasDraft }, media] = await Promise.all([getWorkingSite(), listMedia()]);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const body = {
    format: "ehsan.exe-backup",
    exportedAt: new Date().toISOString(),
    hasDraft,
    site,
    published,
    media: media.map((m) => ({ key: m.key, filename: m.filename, mime: m.mime, alt: m.alt, width: m.width, height: m.height, size: m.size })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ehsan-exe-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
