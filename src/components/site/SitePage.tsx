import type { ReactNode } from "react";
import type { Site } from "@/schema/site";
import { SiteStyles } from "@/components/ui/SiteStyles";
import { World } from "@/components/world/World";
import { spacerScreens, flightEnd } from "@/components/world/layout";
import { TerminalLauncher } from "@/components/terminal/TerminalLauncher";
import { terminalData } from "@/components/terminal/terminalData";
import { personJsonLd } from "@/lib/seo";
import { filled } from "@/lib/todo";
import { Loader, initialsOf } from "./Loader";
import { TopBar } from "./TopBar";
import { Hero } from "./Hero";
import { Signature } from "./Signature";
import { FlightHud } from "./FlightHud";
import { EndScreen } from "./EndScreen";
import { WorksGrid } from "./WorksGrid";
import { AboutPanel, ContactPanel, ProjectPanel, WorkPanel, publishedWorks } from "./Panels";
import { PanelHost } from "./PanelHost";

export function Maintenance({ site }: { site: Site }) {
  const m = site.advanced.maintenance;
  return (
    <div className="s-root flex min-h-screen flex-col justify-end p-6 md:p-8">
      <SiteStyles site={site} />
      <main>
        <h1 className="s-name !translate-y-0 !whitespace-normal !text-[clamp(3rem,10vw,9rem)]">{m.title}</h1>
        <p className="s-label mt-4 max-w-xl">{m.message}</p>
      </main>
    </div>
  );
}

/**
 * The whole public website for one site document. Used by the live page (published
 * version) and by /preview (draft) — same components, so Preview is truthful.
 *
 * Layers, back to front: block portrait (WebGL, fixed) → hand-drawn lines → page content
 * (hero, a tall spacer that drives the flight, end screen) → top bar + flight counter → panels.
 */
export function SitePage({ site, preview = false, badge }: { site: Site; preview?: boolean; badge?: ReactNode }) {
  if (site.advanced.maintenance.enabled && !preview) return <Maintenance site={site} />;
  const works = publishedWorks(site);
  const fl = site.effects.flight;
  const perWork = fl.scrollPerWork;
  const socials = site.socials.filter((s) => filled(s.url)).map((s) => ({ label: s.label, url: s.url }));
  const flightOn = fl.enabled;
  const c = site.design.colors;

  return (
    <div className="s-root">
      <SiteStyles site={site} />
      <Loader site={site} />
      {!preview && (
        <script
          type="application/ld+json"
          // JSON-LD Person: tells search engines who this site is about. `<` is escaped so the JSON can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(site)).replace(/</g, "\\u003c") }}
        />
      )}
      <a className="s-skip" href="#content">
        {site.copy.a11y.skipToContent}
      </a>

      <World
        photoKey={site.profile.photo.key || null}
        imageKeys={works.flatMap((w) => [w.image, ...w.gallery]).map((m) => m.key).filter(Boolean)}
        initials={initialsOf(site.profile.name)}
        effects={site.effects}
        works={(flightOn ? works : []).map((w) => ({
          id: w.id,
          title: w.title,
          category: w.category,
          imageKey: w.image.key || null,
          aspect: w.image.width && w.image.height ? w.image.height / w.image.width : 0.75,
        }))}
        colors={{ panel: c.panel, text: c.text, muted: c.muted }}
      />
      <p className="sr-only">{site.copy.a11y.portrait}</p>
      {site.effects.signature.enabled && (
        <Signature
          path={site.effects.signature.path.trim()}
          width={site.effects.signature.width}
          opacity={site.effects.signature.opacity}
          drawSec={site.effects.signature.drawSec}
          holdSec={site.effects.signature.holdSec}
          size={site.effects.signature.size}
        />
      )}

      <TopBar site={site} />
      {badge}

      <main id="content">
        <Hero site={site} />
        {flightOn && <div className="s-flight" aria-hidden style={{ height: `${spacerScreens(works.length, perWork) * 100}svh` }} />}
        <WorksGrid site={site} />
        <EndScreen site={site} />
      </main>

      {flightOn && (
        <FlightHud
          works={works.map((w) => ({ id: w.id, title: w.title, category: w.category, year: w.year }))}
          socials={socials}
          end={flightEnd(works.length, perWork)}
          labels={site.copy.flight}
        />
      )}

      <AboutPanel site={site} />
      <WorkPanel site={site} />
      {works.map((w) => (
        <ProjectPanel key={w.id} site={site} w={w} />
      ))}
      <ContactPanel site={site} />
      <PanelHost workIds={works.map((w) => w.id)} perWork={perWork} />
      <TerminalLauncher data={terminalData(site)} />
    </div>
  );
}
