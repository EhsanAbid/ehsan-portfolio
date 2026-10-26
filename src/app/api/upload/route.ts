import { getSession } from "@/lib/auth";
import { json, sameOrigin } from "@/lib/http";
import { IMAGE_MAX_BYTES, MediaError, PDF_MAX_BYTES, storeUpload } from "@/lib/media";

/** POST /api/upload (admin only) — multipart form with `file` and required `alt`. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  if (!(await getSession())) return json({ error: "Not signed in" }, 401);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > PDF_MAX_BYTES + 64 * 1024) return json({ error: "File too large (max 4 MB images, 5 MB PDFs)." }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Invalid upload" }, 400);
  }
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "").trim();
  if (!(file instanceof File)) return json({ error: "No file" }, 400);
  if (!alt) return json({ error: "Alt text is required (describe the file for screen readers)." }, 400);
  if (file.size > Math.max(IMAGE_MAX_BYTES, PDF_MAX_BYTES)) return json({ error: "File too large." }, 413);

  try {
    const m = await storeUpload(Buffer.from(await file.arrayBuffer()), file.name, alt);
    return json({ ok: true, media: m });
  } catch (err) {
    if (err instanceof MediaError) return json({ error: err.message }, 400);
    console.error("[upload]", err);
    return json({ error: "Could not process that file." }, 500);
  }
}
