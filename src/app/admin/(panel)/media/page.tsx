import { loadAdmin } from "@/lib/adminData";
import { findUsage, listMedia } from "@/lib/storage";
import { getPublishedRow } from "@/lib/publish";
import { parseSite } from "@/schema/site";
import { MediaLibrary } from "./MediaLibrary";

export default async function MediaPage() {
  const [{ site }, items, published] = await Promise.all([loadAdmin(), listMedia(), getPublishedRow()]);
  const live = published ? parseSite(published.data) : null;
  const rows = items.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    usedIn: [...new Set([...findUsage(site, m.key), ...(live ? findUsage(live, m.key) : [])])],
  }));
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Media</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Images are resized to max 1920 px and converted to WebP automatically. Every file needs alt text. Files are served from a
        permanent, cached URL.
      </p>
      <MediaLibrary items={rows} />
    </div>
  );
}
