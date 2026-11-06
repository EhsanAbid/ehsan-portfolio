import type { ReactNode } from "react";
import type { Site, Work } from "@/schema/site";
import { MediaImage } from "@/components/ui/MediaImage";
import { RichText } from "@/components/ui/RichText";
import { filled } from "@/lib/todo";
import { mediaUrl } from "@/lib/mediaUrl";
import { richToText } from "@/schema/rich";
import { ContactForm } from "@/components/site/ContactForm";

/*
 * Paper sheets over the 3D scene. They are plain HTML in the page (search engines and screen
 * readers see everything); <PanelHost> opens them. Without JavaScript the `:target` CSS rule
 * opens them through the #about / #work / #contact links.
 */

function Panel({ id, label, close, children }: { id: string; label: string; close: string; children: ReactNode }) {
  return (
    // data-lenis-prevent: the wheel scrolls the panel's text, not the page (and the flight) behind it
    <section id={id} className="s-panel" role="dialog" aria-label={label} data-panel data-lenis-prevent>
      <div className="s-panel-head">
        <a href="#_" className="s-close" data-close>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {close}
        </a>
        <span className="s-label">{label}</span>
      </div>
      <div className="s-panel-body">{children}</div>
    </section>
  );
}

const external = (url: string) => (/^https?:/.test(url) ? { target: "_blank", rel: "noopener noreferrer" } : {});

function LinkList({ items }: { items: { label: string; url: string }[] }) {
  return (
    <span className="s-links">
      {items.map((s) => (
        <a key={s.url} href={s.url} className="s-link" {...external(s.url)}>
          {s.label}
        </a>
      ))}
    </span>
  );
}

/** One labelled row of a fact list (education, skills, links…). */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function AboutPanel({ site }: { site: Site }) {
  const p = site.profile;
  const l = site.copy.panels;
  const socials = site.socials.filter((s) => filled(s.url));
  const learning = p.currentlyLearning.filter(filled);
  const skillsBy = (status: string) => site.skills.items.filter((s) => s.status === status).map((s) => s.name);
  const groups = [
    [site.terminal.messages.mastered, skillsBy("mastered")],
    [site.terminal.messages.learning, skillsBy("learning")],
    [site.terminal.messages.locked2, skillsBy("locked")],
  ] as const;
  const journey = site.journey.filter((j) => filled(j.title));
  return (
    <Panel id="about" label={site.copy.top.about} close={l.close}>
      <h2>{p.aboutHeadline}</h2>
      {filled(richToText(p.bio)) && <RichText doc={p.bio} className="s-lead" />}
      <dl className="s-facts">
        <Fact label={l.education}>
          {p.department}, {p.university}
          {filled(p.semester) && <>. {p.semester}</>}
        </Fact>
        {learning.length > 0 && <Fact label={l.learning}>{learning.join(", ")}</Fact>}
        {groups
          .filter(([, list]) => list.length)
          .map(([label, list]) => (
            <Fact key={label} label={label}>
              {list.join(", ")}
            </Fact>
          ))}
        {journey.length > 0 && (
          <Fact label={l.journey}>
            <ol className="s-timeline">
              {journey.map((j) => (
                <li key={j.id}>
                  {filled(j.date) && <span className="tabular-nums">{j.date}</span>}
                  <span>
                    <strong>{j.title}</strong>
                    {filled(j.description) && <span className="s-label block">{j.description}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Fact>
        )}
        {socials.length > 0 && (
          <Fact label={l.elsewhere}>
            <LinkList items={socials} />
          </Fact>
        )}
      </dl>
      <div className="s-actions">
        <a href="#contact" className="s-btn">
          {l.sendMessage}
        </a>
        {p.cv.key && (
          <a href={mediaUrl(p.cv)} className="s-btn s-btn-ghost" download>
            {l.downloadCv}
          </a>
        )}
      </div>
    </Panel>
  );
}

function WorkRow({ w }: { w: Work }) {
  return (
    <a href={`#work-${w.id}`} className="s-row">
      {w.image.key && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${mediaUrl(w.image)}?w=200`} alt="" className="s-thumb" loading="lazy" />
      )}
      <span className="s-row-text">
        <span className="s-row-title">{w.title}</span>
        {filled(w.summary) && <span className="s-label block">{w.summary}</span>}
      </span>
      <span className="s-label tabular-nums">{w.year}</span>
    </a>
  );
}

export const publishedWorks = (site: Site) => site.works.filter((w) => filled(w.title));

export function WorkPanel({ site }: { site: Site }) {
  const l = site.copy.panels;
  const works = publishedWorks(site);
  // selected projects first, then the rest; each group newest first
  const sorted = [...works].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.year || "").localeCompare(a.year || ""));
  return (
    <Panel id="work" label={site.copy.top.work} close={l.close}>
      {works.length === 0 ? (
        <>
          <h2>{site.copy.flight.emptyTitle}</h2>
          <p className="s-label">{l.noWork}</p>
        </>
      ) : (
        <>
          <h2>{l.allWork}</h2>
          <div className="s-rows">
            {sorted.map((w) => (
              <WorkRow key={w.id} w={w} />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export function ProjectPanel({ site, w }: { site: Site; w: Work }) {
  const l = site.copy.panels;
  const images = [w.image, ...w.gallery].filter((m) => m.key);
  return (
    <Panel id={`work-${w.id}`} label={site.copy.top.work} close={l.close}>
      <h2>{w.title}</h2>
      {w.status === "in-progress" && <p className="s-badge">{l.inProgress}</p>}
      {filled(w.summary) && <p className="s-lead">{w.summary}</p>}
      {filled(w.live) && (
        <div className="s-actions">
          <a href={w.live} className="s-btn" {...external(w.live)}>
            {l.live}
          </a>
          {filled(w.github) && (
            <a href={w.github} className="s-btn s-btn-ghost" {...external(w.github)}>
              {l.github}
            </a>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="s-shots">
          {images.map((m) => (
            <MediaImage key={m.key} media={m} className="w-full" sizes="(max-width: 900px) 100vw, 720px" />
          ))}
        </div>
      )}
      {filled(richToText(w.details)) && (
        <>
          <h3>{l.projectAbout}</h3>
          <RichText doc={w.details} />
        </>
      )}
      <dl className="s-facts">
        {filled(w.category) && <Fact label={l.type}>{w.category}</Fact>}
        {filled(w.year) && <Fact label={l.year}>{w.year}</Fact>}
        {w.tags.length > 0 && <Fact label={l.builtWith}>{w.tags.join(", ")}</Fact>}
        {!filled(w.live) && filled(w.github) && (
          <Fact label={l.links}>
            <LinkList items={[{ label: l.github, url: w.github }]} />
          </Fact>
        )}
      </dl>
      <p className="s-back">
        <a href="#work" className="s-link">
          {l.backToWork}
        </a>
      </p>
    </Panel>
  );
}

export function ContactPanel({ site }: { site: Site }) {
  const c = site.copy.contact;
  const l = site.copy.panels;
  const p = site.profile;
  const socials = site.socials.filter((s) => filled(s.url) && s.kind !== "email");
  return (
    <Panel id="contact" label={site.copy.top.contact} close={l.close}>
      <h2>{c.headline}</h2>
      <p className="s-lead">{c.text}</p>
      <ContactForm labels={c} />
      <dl className="s-facts">
        {filled(p.publicEmail) && (
          <Fact label={l.email}>
            <a href={`mailto:${p.publicEmail}`} className="s-link">
              {p.publicEmail}
            </a>
          </Fact>
        )}
        {socials.length > 0 && (
          <Fact label={l.elsewhere}>
            <LinkList items={socials} />
          </Fact>
        )}
      </dl>
    </Panel>
  );
}
