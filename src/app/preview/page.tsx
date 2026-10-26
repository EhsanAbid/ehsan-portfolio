import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getVersion, getWorkingSite } from "@/lib/publish";
import { SitePage } from "@/components/site/SitePage";
import "../admin/admin.css";

export const metadata: Metadata = { title: "Preview · ehsan.exe", robots: { index: false, follow: false } };

/**
 * /preview — the real website rendered from the draft (or ?version=N), for the admin only.
 * Same <SitePage> as the live site, plus a "Preview mode" badge and visible TODO hints.
 */
export default function PreviewPage({ searchParams }: PageProps<"/preview">) {
  return (
    <Suspense fallback={<p className="p-8 font-mono">loading preview…</p>}>
      <Preview searchParams={searchParams} />
    </Suspense>
  );
}

async function Preview({ searchParams }: Pick<PageProps<"/preview">, "searchParams">) {
  await requireAdmin();
  const sp = await searchParams;
  const id = Number(sp.version);
  const version = Number.isInteger(id) && id > 0 ? await getVersion(id) : null;
  const site = version ? version.site : (await getWorkingSite()).site;
  const label = version ? `Preview · version #${version.id} (${version.status})` : "Preview mode · draft";
  const embedded = sp.embed === "1"; // inside the admin's live-preview frame
  return (
    <SitePage
      site={site}
      preview
      badge={
        embedded ? null : <div className="preview-badge" role="status">
          <span>● {label}</span>
          <a href="/admin">Back to admin</a>
        </div>
      }
    />
  );
}
