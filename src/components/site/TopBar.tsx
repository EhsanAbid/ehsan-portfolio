import type { Site } from "@/schema/site";
import { mediaUrl } from "@/lib/mediaUrl";
import { filled } from "@/lib/todo";
import { Clock } from "./Clock";
import { initialsOf } from "./Loader";

/** Fixed top bar: logo block, where Ehsan is right now (with the local time), navigation. */
export function TopBar({ site }: { site: Site }) {
  const p = site.profile;
  const t = site.copy.top;
  return (
    <header className="s-top">
      <a href="#top" className={p.logo.key ? "s-logo-img" : "s-logo"} aria-label={p.name}>
        {p.logo.key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(p.logo)} alt="" style={{ height: 40, width: "auto" }} />
        ) : (
          initialsOf(p.name)
        )}
      </a>
      <p className="s-top-info">
        {filled(p.currently) && <span>{p.currently}</span>}
        {filled(p.location) && (
          <span>
            {p.location}
            <Clock timeZone={p.timezone} />
          </span>
        )}
      </p>
      <nav aria-label={t.navigation} className="s-nav">
        <a href="#work" className="s-link">
          {t.work}
        </a>
        <a href="#about" className="s-link">
          {t.about}
        </a>
        <a href="#contact" className="s-link">
          {t.contact}
        </a>
      </nav>
    </header>
  );
}
