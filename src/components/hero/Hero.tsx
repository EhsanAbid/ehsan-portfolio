import type { Ctx } from "@/sections/shared";
import { findSocial, sectionAnchor } from "@/sections/shared";
import { mediaUrl } from "@/lib/mediaUrl";

/**
 * Scene 1 — the static, instantly-readable hero. This is real HTML in the prerendered
 * page: name, role and buttons are visible on the very first paint, before any JS.
 * The particle Big Bang (client, lazy) is layered on top later and never replaces it.
 */
export function Hero({ ctx, children }: { ctx: Ctx; children?: React.ReactNode }) {
  const { site } = ctx;
  const p = site.profile;
  const firstSection = site.sections.find((s) => s.enabled);
  const linkedin = findSocial(site, "linkedin");
  const hero = site.copy.hero;

  return (
    <header id="top" className="relative flex min-h-[100svh] items-center px-4 pt-24 pb-16 md:px-8">
      {children}
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <p className="eyebrow mb-5" data-hero-eyebrow>
          {hero.eyebrow}
        </p>
        <h1
          id="hero-name"
          className="max-w-4xl text-[clamp(2.6rem,9vw,6.5rem)] leading-[0.95] font-bold tracking-tight text-white"
        >
          {p.name}
        </h1>
        <p className="mono mt-6 min-h-[1.75em] text-lg text-cyan md:text-2xl" data-typewriter>
          <span data-typewriter-text>{p.taglines[0] ?? p.role}</span>
          <span aria-hidden className="ml-0.5 inline-block w-[0.6ch] animate-pulse">▍</span>
        </p>
        {p.taglines.length > 1 && (
          <p className="sr-only">{p.taglines.join(" · ")}</p>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          {firstSection && (
            <a href={`#${sectionAnchor(firstSection)}`} className="btn btn-primary" data-magnetic>
              {hero.startButton} <span aria-hidden>→</span>
            </a>
          )}
          {linkedin && (
            <a href={linkedin.url} className="btn btn-ghost" target="_blank" rel="noopener noreferrer" data-magnetic>
              {hero.linkedinButton}
            </a>
          )}
          {p.cv.key && (
            <a href={mediaUrl(p.cv)} className="btn btn-ghost" download data-magnetic>
              {hero.cvButton}
            </a>
          )}
        </div>
        <p className="mono mt-16 hidden text-xs tracking-[0.3em] text-muted uppercase md:block" aria-hidden>
          {hero.scrollHint} ↓
        </p>
      </div>
    </header>
  );
}
