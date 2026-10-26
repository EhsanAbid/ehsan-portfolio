import type { ReactNode } from "react";
import type { Site } from "@/schema/site";
import { loadAdmin } from "@/lib/adminData";
import { AreaEditor } from "@/components/admin/AreaEditor";
import { AreaWithPreview } from "@/components/admin/AreaWithPreview";

/** A whole admin page that is just one schema-driven area editor. */
export async function AreaPage({ area, title, intro, preview, children }: { area: keyof Site; title: string; intro?: ReactNode; preview?: boolean; children?: ReactNode }) {
  const { site } = await loadAdmin();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {intro && <p className="mt-1 mb-6 text-sm text-muted">{intro}</p>}
      {children}
      {preview ? <AreaWithPreview area={area} initial={site[area]} /> : <AreaEditor area={area} initial={site[area]} />}
    </div>
  );
}
