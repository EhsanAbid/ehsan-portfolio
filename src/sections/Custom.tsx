import { MediaImage } from "@/components/ui/MediaImage";
import { RichText } from "@/components/ui/RichText";
import { filled } from "@/lib/todo";
import { SectionShell, type SectionProps } from "./shared";

/* Custom section types the admin can add (spec §6.1 Sections). */

export function CustomText({ section }: SectionProps<"text">) {
  return (
    <SectionShell section={section}>
      <div className="glass max-w-3xl p-6 text-lg leading-relaxed md:p-8" data-reveal>
        <RichText doc={section.data.body} />
      </div>
    </SectionShell>
  );
}

export function CustomCards({ section }: SectionProps<"cards">) {
  return (
    <SectionShell section={section}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {section.data.cards.map((c) => {
          const inner = (
            <>
              <span className="text-3xl" aria-hidden>{c.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{c.title}</h3>
              {c.body && <p className="mt-2 text-sm text-muted">{c.body}</p>}
            </>
          );
          return filled(c.link) ? (
            <a key={c.id} href={c.link} className="glass block p-5 transition hover:border-cyan/50" data-reveal>
              {inner}
            </a>
          ) : (
            <div key={c.id} className="glass p-5" data-reveal>
              {inner}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function Gallery({ section }: SectionProps<"gallery">) {
  return (
    <SectionShell section={section}>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {section.data.images.filter((m) => m.key).map((m) => (
          <figure key={m.key} className="glass mb-4 break-inside-avoid overflow-hidden" data-reveal>
            <MediaImage media={m} className="w-full" sizes="(max-width: 640px) 100vw, 33vw" />
            {m.alt && <figcaption className="px-4 py-2 text-xs text-muted">{m.alt}</figcaption>}
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}

/** Turns YouTube / Vimeo links into privacy-friendly embed URLs; anything else stays a link. */
function embedSrc(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function Embed({ section }: SectionProps<"embed">) {
  const { url, caption } = section.data;
  if (!filled(url)) return null;
  const src = embedSrc(url);
  return (
    <SectionShell section={section}>
      <div className="max-w-4xl" data-reveal>
        {src ? (
          <div className="glass aspect-video overflow-hidden">
            <iframe
              src={src}
              title={caption || section.title}
              loading="lazy"
              className="size-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" className="glass block p-6 hover:border-cyan/50">
            <span className="mono text-sm text-cyan">{url}</span>
          </a>
        )}
        {caption && <p className="mt-3 text-sm text-muted">{caption}</p>}
      </div>
    </SectionShell>
  );
}

export function Quote({ section }: SectionProps<"quote">) {
  return (
    <SectionShell section={section}>
      <figure className="max-w-3xl" data-reveal>
        <blockquote className="font-heading text-2xl leading-snug text-white md:text-4xl">“{section.data.text}”</blockquote>
        {section.data.author && <figcaption className="mono mt-4 text-sm text-cyan">— {section.data.author}</figcaption>}
      </figure>
    </SectionShell>
  );
}

export function Cta({ section }: SectionProps<"cta">) {
  const d = section.data;
  return (
    <SectionShell section={section}>
      <div className="glass flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8" data-reveal>
        {d.text && <p className="max-w-2xl text-lg text-text/90">{d.text}</p>}
        {filled(d.buttonUrl) && (
          <a href={d.buttonUrl} className="btn btn-primary shrink-0" data-magnetic>
            {d.buttonLabel}
          </a>
        )}
      </div>
    </SectionShell>
  );
}
