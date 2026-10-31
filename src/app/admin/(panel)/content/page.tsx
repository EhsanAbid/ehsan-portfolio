import Link from "next/link";
import { loadAdmin } from "@/lib/adminData";
import { AreaEditor } from "@/components/admin/AreaEditor";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "works", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "journey", label: "Journey" },
  { id: "socials", label: "Links" },
  { id: "labels", label: "Labels & micro-copy" },
] as const;

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const [{ site }, sp] = await Promise.all([loadAdmin(), searchParams]);
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "profile";

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Content</h1>
      <nav className="my-5 flex flex-wrap gap-1.5" aria-label="Content areas">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/content?tab=${t.id}`} className="a-nav-link !py-1.5 text-sm" aria-current={t.id === tab ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "profile" && (
        <>
          <p className="mb-3 text-xs text-muted">
            The portrait photo becomes the block face. A PNG with a transparent background (just you, no backdrop) looks best.
          </p>
          <AreaEditor key="profile" area="profile" initial={site.profile} />
        </>
      )}
      {tab === "works" && (
        <>
          <p className="mb-3 text-xs text-muted">
            Every project with a title flies through the 3D view in this order (drag to reorder). Add a cover image so it shows as a picture
            card; without one it appears as a title card. Tick “Selected work” to list it first in the Work panel.
          </p>
          <AreaEditor key="works" area="works" initial={site.works} />
        </>
      )}
      {tab === "skills" && (
        <>
          <p className="mb-3 text-xs text-muted">Each skill&apos;s “Group id” must match one of the group ids (programming, web, cs, tools or ones you add).</p>
          <AreaEditor key="skills" area="skills" initial={site.skills} />
        </>
      )}
      {tab === "journey" && <AreaEditor key="journey" area="journey" initial={site.journey} />}
      {tab === "socials" && <AreaEditor key="socials" area="socials" initial={site.socials} />}
      {tab === "labels" && <AreaEditor key="copy" area="copy" initial={site.copy} />}
    </div>
  );
}
