import type { Site } from "@/schema/site";

/** After the last project (or right after the face if there are none yet). */
export function EndScreen({ site }: { site: Site }) {
  const f = site.copy.flight;
  const empty = site.works.length === 0;
  return (
    <section className="s-end" aria-labelledby="end-title">
      <h2 id="end-title">{empty ? f.emptyTitle : f.endTitle}</h2>
      <p className="s-label mt-5 max-w-md text-[15px]">{empty ? f.emptyText : f.endText}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#contact" className="s-btn">
          {f.sayHello}
        </a>
        <a href="#top" className="s-btn s-btn-ghost">
          {f.backHome}
        </a>
      </div>
    </section>
  );
}
