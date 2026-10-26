import { loadAdmin } from "@/lib/adminData";
import { AreaEditor } from "@/components/admin/AreaEditor";

export default async function SectionsPage() {
  const { site } = await loadAdmin();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Sections</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Drag to reorder, toggle visibility, duplicate or delete. Add new sections at the bottom (About, Skills, Quests, Journey,
        Lab, Contact or a custom type). Built-in sections show the matching data from <b>Content</b>.
      </p>
      <AreaEditor area="sections" initial={site.sections} />
    </div>
  );
}
