import { loadAdmin } from "@/lib/adminData";
import { DesignStudio } from "./DesignStudio";

export default async function DesignPage() {
  const { site } = await loadAdmin();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Design</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Colours, fonts, corner radius, glass and button/cursor styles. Changes save to the draft and the preview reloads; press
        Publish to make them live. Text contrast below 4.5 : 1 is flagged.
      </p>
      <DesignStudio initial={site.design} />
    </div>
  );
}
