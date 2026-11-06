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
  return (
    <h1 className="s-name">
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
        <BigName name={p.name} />
        <div className="s-hero-foot">
          {filled(p.intro) && <p className="s-intro">{p.intro}</p>}
          <div className="s-actions">
            <ScrollLink to={firstStop} className="s-btn">
              {site.copy.hero.explore}
            </ScrollLink>
            <a href="#contact" className="s-btn s-btn-ghost">
              {site.copy.hero.contact}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
