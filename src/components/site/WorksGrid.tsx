import type { Site } from "@/schema/site";
import { MediaImage } from "@/components/ui/MediaImage";
import { publishedWorks } from "./Panels";

/** Projects as a plain grid: shown instead of the 3D flight for reduced motion, no WebGL or no JS. */
export function WorksGrid({ site }: { site: Site }) {
  const works = publishedWorks(site);
  if (!works.length) return null;
  return (
    <section className="s-grid" aria-labelledby="grid-title">
      <h2 id="grid-title" className="mb-8 font-heading text-5xl" style={{ fontStyle: "var(--display-style)" }}>
        {site.copy.panels.allWork}
      </h2>
      <ul>
        {works.map((w) => (
          <li key={w.id}>
            <a href={`#work-${w.id}`} className="group block">
              {w.image.key ? (
                <MediaImage media={w.image} className="aspect-[4/3] w-full rounded-[var(--radius)] object-cover" sizes="(max-width: 900px) 100vw, 33vw" />
              ) : (
                <span className="flex aspect-[4/3] items-end rounded-[var(--radius)] bg-[var(--panel-bg)] p-5 font-heading text-3xl" style={{ fontStyle: "var(--display-style)" }}>
                  {w.title}
                </span>
              )}
              <span className="mt-3 block group-hover:underline">{w.title}</span>
              <span className="s-label text-[13px]">{[w.category, w.year].filter(Boolean).join(", ")}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
