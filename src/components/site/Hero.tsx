import type { Site } from "@/schema/site";
import { filled } from "@/lib/todo";
import { cardProgress } from "@/components/world/layout";
import { ScrollLink } from "./ScrollLink";

/**
 * The big name. Each letter is its own span so the CSS can lift them in one after another
 * (the delay is `--i` × 38 ms, starting when the loader ends). Screen readers get the plain name.
 */
function BigName({ name }: { name: string }) {
  let i = 0;
  // Fit the name to the screen width: fewer letters → bigger type (italic serif ≈ 0.45 em per letter).
  const fit = Math.min(15.8, 215 / Math.max(6, name.length));
  return (
    <h1 className="s-name" style={{ "--fit": `${fit}vw` } as React.CSSProperties}>
      <span className="sr-only">{name}</span>
      <span aria-hidden>
        {name.split(/\s+/).map((word, w) => (
          <span key={w} className="w">
            {[...word].map((ch, c) => (
              <span key={c} className="ch" style={{ "--i": i++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}

/** Hero text: real HTML, readable on the first paint; the block face is drawn behind it. */
export function Hero({ site }: { site: Site }) {
  const p = site.profile;
  const firstStop = site.works.length ? cardProgress(0, site.effects.flight.scrollPerWork) : 1.2;
  return (
    <section id="top" className="s-hero" aria-label={p.name}>
      <div className="s-hero-inner">
        <div className="s-hero-row">
          <p className="s-intro">
            {filled(p.intro) && <>{p.intro} </>}
            <ScrollLink to={firstStop}>{site.copy.hero.scrollLink}</ScrollLink>
          </p>
          <ScrollLink to={firstStop} className="s-explore">
            {site.copy.hero.explore}
            <span className="s-explore-icon" aria-hidden>
              ↓
            </span>
          </ScrollLink>
        </div>
        <BigName name={p.name} />
      </div>
    </section>
  );
}
