import type { Site } from "@/schema/site";
import { mediaUrl } from "@/lib/mediaUrl";
import { filled } from "@/lib/todo";
import { Clock } from "./Clock";
import { initialsOf } from "./Loader";

/** Fixed top bar: logo · Currently · Based in (live time) · navigation. */
export function TopBar({ site }: { site: Site }) {
  const p = site.profile;
  const t = site.copy.top;
  return (
    <header className="s-top">
      <a href="#top" className="s-logo" aria-label={p.name}>
        {p.logo.key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(p.logo)} alt="" style={{ height: 30, width: "auto" }} />
        ) : (
          initialsOf(p.name)
        )}
      </a>
      {filled(p.currently) && (
        <p className="s-top-info">
          <span className="s-label block">{t.currently}</span>
          {p.currently}
        </p>
      )}
      {filled(p.location) && (
        <p className="s-top-info">
          <span className="s-label block">{t.based}</span>
          {p.location}
          <Clock timeZone={p.timezone} />
        </p>
      )}
      <nav aria-label={t.navigation} className="s-nav">
        <span className="s-label s-nav-label">{t.navigation}</span>
        <span>
          <a href="#work" className="s-link">
            {t.work}
          </a>
          ,{" "}
          <a href="#about" className="s-link">
            {t.about}
          </a>
          ,{" "}
          <a href="#contact" className="s-link">
            {t.contact}
          </a>
        </span>
      </nav>
    </header>
  );
}
