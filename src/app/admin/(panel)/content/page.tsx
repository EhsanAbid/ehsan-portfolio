import Link from "next/link";
import { loadAdmin } from "@/lib/adminData";
import { AreaEditor } from "@/components/admin/AreaEditor";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "socials", label: "Socials" },
  { id: "skills", label: "Skills" },
  { id: "quests", label: "Quests" },
  { id: "journey", label: "Journey" },
  { id: "lab", label: "Lab" },
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
      {tab === "profile" && <AreaEditor key="profile" area="profile" initial={site.profile} />}
      {tab === "socials" && <AreaEditor key="socials" area="socials" initial={site.socials} />}
      {tab === "skills" && (
        <>
          <p className="mb-3 text-xs text-muted">Each skill&apos;s “Branch id” must match one of the branch ids (programming, web, cs, tools, soft or ones you add).</p>
          <AreaEditor key="skills" area="skills" initial={site.skills} />
        </>
      )}
      {tab === "quests" && <AreaEditor key="quests" area="quests" initial={site.quests} />}
      {tab === "journey" && <AreaEditor key="journey" area="journey" initial={site.journey} />}
      {tab === "lab" && <AreaEditor key="lab" area="lab" initial={site.lab} />}
      {tab === "labels" && <AreaEditor key="copy" area="copy" initial={site.copy} />}
    </div>
  );
}
