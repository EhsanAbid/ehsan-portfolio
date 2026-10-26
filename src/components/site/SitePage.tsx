import type { ReactNode } from "react";
import type { Section, Site } from "@/schema/site";
import { SiteStyles } from "@/components/ui/SiteStyles";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Quests } from "@/sections/Quests";
import { Journey } from "@/sections/Journey";
import { Lab } from "@/sections/Lab";
import { Contact } from "@/sections/Contact";
import { Cta, CustomCards, CustomText, Embed, Gallery, Quote } from "@/sections/Custom";
import { Footer } from "@/sections/Footer";
import { sectionAnchor, type Ctx } from "@/sections/shared";
import { Universe } from "@/components/space/Universe";
import { Boot } from "@/components/boot/Boot";
import { ContactForm } from "@/sections/ContactForm";
import { Interactions } from "@/components/ui/Interactions";

function renderSection(ctx: Ctx, s: Section): ReactNode {
  switch (s.type) {
    case "about":
      return <About key={s.id} ctx={ctx} section={s} />;
    case "skills":
      return <Skills key={s.id} ctx={ctx} section={s} />;
    case "quests":
      return <Quests key={s.id} ctx={ctx} section={s} />;
    case "journey":
      return <Journey key={s.id} ctx={ctx} section={s} />;
    case "lab":
      return <Lab key={s.id} ctx={ctx} section={s} />;
    case "contact":
      return <Contact key={s.id} ctx={ctx} section={s} form={<ContactForm labels={ctx.site.copy.contact} />} />;
    case "text":
      return <CustomText key={s.id} ctx={ctx} section={s} />;
    case "cards":
      return <CustomCards key={s.id} ctx={ctx} section={s} />;
    case "gallery":
      return <Gallery key={s.id} ctx={ctx} section={s} />;
    case "embed":
      return <Embed key={s.id} ctx={ctx} section={s} />;
    case "quote":
      return <Quote key={s.id} ctx={ctx} section={s} />;
    case "cta":
      return <Cta key={s.id} ctx={ctx} section={s} />;
  }
}

export function Maintenance({ site }: { site: Site }) {
  const m = site.advanced.maintenance;
  return (
    <div className="site-root flex min-h-screen items-center justify-center px-6 text-center">
      <SiteStyles site={site} />
      <main>
        <p className="eyebrow mb-4">{site.copy.hero.eyebrow}</p>
        <h1 className="text-4xl font-bold text-white md:text-6xl">{m.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{m.message}</p>
      </main>
    </div>
  );
}

/**
 * The whole public website for one site document. Used by the live page (published
 * version) and by /preview (draft) — same components, so Preview is truthful.
 */
export function SitePage({ site, preview = false, badge }: { site: Site; preview?: boolean; badge?: ReactNode }) {
  const ctx: Ctx = { site, preview };
  if (site.advanced.maintenance.enabled && !preview) return <Maintenance site={site} />;
  const sections = site.sections.filter((s) => s.enabled);
  return (
    <div className="site-root" data-btn={site.design.buttonStyle} data-cursor={site.design.cursorStyle}>
      <SiteStyles site={site} />
      {!preview && <Boot site={site} />}
      <a className="skip-link" href="#content">
        {site.copy.nav.skipToContent}
      </a>
      <Universe
        effects={site.effects}
        colors={{ cyan: site.design.colors.cyan, violet: site.design.colors.violet }}
        mapLabel={site.copy.nav.miniMapLabel}
        stops={[
          { id: "top", label: site.profile.shortName, color: site.design.colors.cyan },
          ...sections.map((s) => ({ id: sectionAnchor(s), label: s.navLabel || s.title, color: s.planet.color })),
        ]}
      />
      {badge}
      <Hero ctx={ctx} />
      <main id="content">{sections.map((s) => renderSection(ctx, s))}</main>
      <Footer ctx={ctx} />
      <Interactions tilt={site.effects.motion.tilt} />
    </div>
  );
}
