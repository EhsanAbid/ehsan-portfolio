import type { Ctx } from "@/sections/shared";
import { findSocial, sectionAnchor } from "@/sections/shared";
import { mediaUrl } from "@/lib/mediaUrl";
import { computeLevel } from "@/lib/level";
import { Typewriter } from "./Typewriter";
import { Hud } from "./Hud";

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
  const lvl = computeLevel(site);
  const hud = site.game.hud;
  const initials = p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3);

  return (
    <header id="top" className="relative flex min-h-[100svh] items-center px-4 pt-24 pb-16 md:px-8">
      {children}
      <Hud
        show={hud.enabled}
        avatarUrl={p.photo.key ? mediaUrl(p.photo) : null}
        initials={initials}
        levelText={`${hud.levelPrefix} ${lvl.level}${lvl.title ? ` · ${lvl.title}` : ""}`}
        progress={lvl.progress}
        xpLabel={`XP ${lvl.xpIntoLevel}/${lvl.levelSize}`}
        achievementsLabel={hud.achievementsLabel}
        achievementIds={site.game.achievements.filter((a) => a.enabled).map((a) => a.id)}
        soundDefault={site.effects.sound.defaultOn}
        terminalEnabled={site.game.terminal.enabled}
        labels={{
          soundOn: site.copy.nav.soundOn,
          soundOff: site.copy.nav.soundOff,
          sky: site.copy.nav.skyToggle,
          terminal: site.copy.nav.terminalButton,
        }}
      />
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
          <Typewriter lines={p.taglines.length ? p.taglines : [p.role]} />
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
