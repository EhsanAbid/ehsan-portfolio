import type { ReactNode } from "react";
import type { Section, Site } from "@/schema/site";
import { filled, todoHint } from "@/lib/todo";

/** Everything a section needs to render. `preview` = admin draft preview (shows TODO hints). */
export type Ctx = { site: Site; preview: boolean };
export type SectionProps<T extends Section["type"] = Section["type"]> = {
  ctx: Ctx;
  section: Extract<Section, { type: T }>;
};

/**
 * Shows real content, hides TODO_EHSAN placeholders on the live site, and shows them
 * as dashed gold hints in Preview so Ehsan can see what is still missing.
 */
export function Txt({ v, ctx, as: As = "span", className = "" }: { v: string; ctx: Ctx; as?: "span" | "p" | "h3" | "div"; className?: string }) {
  if (filled(v)) return <As className={className}>{v}</As>;
  if (ctx.preview && v) return <As className={`${className} todo text-gold`}>✎ {todoHint(v)}</As>;
  return null;
}

export const sectionAnchor = (s: Section) => s.anchor || s.id;

export function SectionShell({ section, children, wide = false }: { section: Section; children: ReactNode; wide?: boolean }) {
  return (
    <section
      id={sectionAnchor(section)}
      aria-labelledby={`${section.id}-title`}
      data-section={section.type}
      data-mood={section.mood}
      data-planet={section.planet.color}
      className="section"
    >
      <div className="mood" aria-hidden />
      <div
        data-planet-el
        aria-hidden
        className={`planet ${section.planet.ring ? "has-ring" : ""}`}
        style={{ "--p": section.planet.color, "--ring": section.planet.ringColor, "--s": section.planet.size } as React.CSSProperties}
      />
      <div className={`section-inner relative ${wide ? "max-w-6xl" : ""}`}>
        <header className="mb-10 md:mb-14" data-reveal>
          {section.navLabel && <p className="eyebrow mb-3">{`// ${section.navLabel}`}</p>}
          <h2 id={`${section.id}-title`} className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            {section.title}
          </h2>
          {section.subtitle && <p className="mt-3 max-w-2xl text-base text-muted md:text-lg">{section.subtitle}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function findSocial(site: Site, kind: string) {
  return site.socials.find((s) => s.kind === kind && filled(s.url));
}
