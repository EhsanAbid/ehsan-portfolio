import { loadAdmin } from "@/lib/adminData";
import { KEEP_VERSIONS, listVersions } from "@/lib/publish";
import { HistoryList } from "./HistoryList";

export default async function HistoryPage() {
  await loadAdmin();
  const versions = (await listVersions()).map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
  }));
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">History</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Every publish is saved (the last {KEEP_VERSIONS} are kept). Preview any version, restore it with one click, or load it into
        the draft to edit first. Backups contain the full site JSON plus the media list.
      </p>
      <HistoryList versions={versions} />
    </div>
  );
}
