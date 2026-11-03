import type { ReactNode } from "react";
import type { Site, Work } from "@/schema/site";
import { MediaImage } from "@/components/ui/MediaImage";
import { RichText } from "@/components/ui/RichText";
import { filled } from "@/lib/todo";
import { mediaUrl } from "@/lib/mediaUrl";
import { richToText } from "@/schema/rich";
import { ContactForm } from "@/components/site/ContactForm";

/*
 * Frosted-glass panels over the 3D scene. They are plain HTML in the page (search engines
 * and screen readers see everything); <PanelHost> opens them. Without JavaScript the
 * `:target` CSS rule opens them through the #about / #work / #contact links.
 */

function Panel({ id, label, close, children }: { id: string; label: string; close: string; children: ReactNode }) {
  return (
    // data-lenis-prevent: the wheel scrolls the panel's text, not the page (and the flight) behind it
    <section id={id} className="s-panel" role="dialog" aria-label={label} data-panel data-lenis-prevent>
      <div className="s-panel-head">
        <a href="#_" className="s-close" data-close>
          <span aria-hidden>←</span> {close}
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
    <p>
      {items.map((s, i) => (
        <span key={s.url}>
          <a href={s.url} className="s-link" {...external(s.url)}>
            {s.label}
          </a>
          {i < items.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
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
      {filled(richToText(p.bio)) && <RichText doc={p.bio} className="text-[15.5px]" />}
      <div className="s-cols">
        <div>
          <h3>{l.education}</h3>
          <p>
            {p.department}
            <br />
            {p.university}
            {filled(p.semester) && (
              <>
                <br />
                {p.semester}
              </>
            )}
          </p>
        </div>
        {learning.length > 0 && (
          <div>
            <h3>{l.learning}</h3>
            <p>{learning.join(", ")}</p>
          </div>
        )}
        <div>
          <h3>{l.skills}</h3>
          {groups
            .filter(([, list]) => list.length)
            .map(([label, list]) => (
              <p key={label} className="mb-1.5">
                <span className="s-label">{label}: </span>
                {list.join(", ")}
              </p>
            ))}
        </div>
        {journey.length > 0 && (
          <div>
            <h3>{l.journey}</h3>
            <ul className="space-y-1.5">
              {journey.map((j) => (
                <li key={j.id}>
                  {filled(j.date) && <span className="s-label tabular-nums">{j.date} </span>}
                  {j.title}
                  {filled(j.description) && <span className="s-label"> — {j.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {socials.length > 0 && (
          <div>
            <h3>{l.elsewhere}</h3>
            <LinkList items={socials} />
          </div>
        )}
        <div>
          <h3>{l.contact}</h3>
          <p>
            <a href="#contact" className="s-link">
              {l.sendMessage}
            </a>
            {p.cv.key && (
              <>
                <br />
                <a href={mediaUrl(p.cv)} className="s-link" download>
                  {l.downloadCv}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function WorkRow({ w }: { w: Work }) {
  return (
    <a href={`#work-${w.id}`} className="s-row">
      {w.image.key ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${mediaUrl(w.image)}?w=200`} alt="" className="s-thumb" loading="lazy" />
      ) : (
        <span className="s-thumb" aria-hidden />
      )}
      <span>
        <span className="s-row-title block">{w.title}</span>
        <span className="s-label text-[13px]">{w.category}</span>
      </span>
      <span className="s-label text-[13px] tabular-nums">{w.year}</span>
    </a>
  );
}

export const publishedWorks = (site: Site) => site.works.filter((w) => filled(w.title));

export function WorkPanel({ site }: { site: Site }) {
  const l = site.copy.panels;
  const works = publishedWorks(site);
  const featured = works.filter((w) => w.featured);
  const byYear = [...works].sort((a, b) => (b.year || "").localeCompare(a.year || ""));
  return (
    <Panel id="work" label={site.copy.top.work} close={l.close}>
      {works.length === 0 ? (
        <>
          <h2>{site.copy.flight.emptyTitle}</h2>
          <p className="s-label">{l.noWork}</p>
        </>
      ) : (
        <>
          {featured.length > 0 && (
            <>
              <h2>{l.selectedWork}</h2>
              <div className="mb-10">
                {featured.map((w) => (
                  <WorkRow key={w.id} w={w} />
                ))}
              </div>
            </>
          )}
          <h2>{l.allWork}</h2>
          <div>
            {byYear.map((w) => (
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
    <Panel id={`work-${w.id}`} label={[w.category, w.year].filter(Boolean).join(", ")} close={l.close}>
      <h2>{w.title}</h2>
      {w.status === "in-progress" && <p className="chip mb-4 !text-fg-muted">{l.inProgress}</p>}
      {filled(w.summary) && <p className="text-[16px]">{w.summary}</p>}
      {images.length > 0 && (
        <div className="mt-6 grid gap-3">
          {images.map((m) => (
            <MediaImage key={m.key} media={m} className="w-full rounded-[calc(var(--radius)*0.6)]" sizes="(max-width: 900px) 100vw, 560px" />
          ))}
        </div>
      )}
      <div className="s-cols">
        {filled(richToText(w.details)) && (
          <div className="col-span-full">
            <h3>{l.projectAbout}</h3>
            <RichText doc={w.details} />
          </div>
        )}
        {w.tags.length > 0 && (
          <div>
            <h3>{l.builtWith}</h3>
            <p>{w.tags.join(", ")}</p>
          </div>
        )}
        {(filled(w.github) || filled(w.live)) && (
          <div>
            <h3>{l.links}</h3>
            <LinkList
              items={[
                ...(filled(w.live) ? [{ label: l.live, url: w.live }] : []),
                ...(filled(w.github) ? [{ label: l.github, url: w.github }] : []),
              ]}
            />
          </div>
        )}
      </div>
      <p className="mt-8">
        <a href="#work" className="s-link">
          {l.backToWork}
        </a>
      </p>
    </Panel>
  );
}

export function ContactPanel({ site }: { site: Site }) {
  const c = site.copy.contact;
  const p = site.profile;
  const socials = site.socials.filter((s) => filled(s.url) && s.kind !== "email");
  return (
    <Panel id="contact" label={site.copy.top.contact} close={site.copy.panels.close}>
      <h2>{c.headline}</h2>
      <p className="s-label mb-6">{c.text}</p>
      <ContactForm labels={c} />
      <div className="s-cols">
        {filled(p.publicEmail) && (
          <div>
            <h3>Email</h3>
            <a href={`mailto:${p.publicEmail}`} className="s-link">
              {p.publicEmail}
            </a>
          </div>
        )}
        {socials.length > 0 && (
          <div>
            <h3>{site.copy.panels.elsewhere}</h3>
            <LinkList items={socials} />
          </div>
        )}
      </div>
    </Panel>
  );
}
