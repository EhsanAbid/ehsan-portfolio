import { MediaImage } from "@/components/ui/MediaImage";
import { RichText } from "@/components/ui/RichText";
import { filled } from "@/lib/todo";
import { richToText } from "@/schema/rich";
import { SectionShell, Txt, type SectionProps } from "./shared";

/** Scene 3 — Planet "Origin": photo in an orbit ring with interest moons, story, stat cards. */
export function About({ ctx, section }: SectionProps<"about">) {
  const { site } = ctx;
  const p = site.profile;
  const l = site.copy.about;
  const bioFilled = filled(richToText(p.bio));
  const stats = [
    [l.university, p.university],
    [l.department, p.department],
    [l.semester, p.semester],
    [l.location, p.location],
    [l.learning, p.currentlyLearning],
  ] as const;
  const moons = p.interests.slice(0, 4);
  const initials = p.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3);

  return (
    <SectionShell section={section}>
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        {/* Orbit: the ring rotates with CSS (paused for reduced motion); moons ride on it. */}
        <div className="relative mx-auto aspect-square w-full max-w-[22rem]" data-reveal>
          <div
            className="orbit-ring absolute inset-0 rounded-full border border-dashed [container-type:size]"
            style={{ borderColor: `${section.planet.ringColor}66` }}
          >
            {moons.map((m, i) => (
              <span
                key={m.id}
                className="orbit-moon glass absolute top-1/2 left-1/2 flex size-11 items-center justify-center rounded-full text-lg"
                // Move to the centre, turn by this moon's angle, then push out by the ring radius (50cqw = half the ring's width).
                style={{ transform: `translate(-50%, -50%) rotate(${(360 / moons.length) * i}deg) translateY(-50cqw) rotate(${(-360 / moons.length) * i}deg)` }}
                title={filled(m.label) ? m.label : undefined}
              >
                <span className="orbit-moon-inner" aria-hidden>{m.icon}</span>
                {filled(m.label) && <span className="sr-only">{m.label}</span>}
              </span>
            ))}
          </div>
          <button
            type="button"
            id="profile-photo"
            data-achievement-click="profile-photo"
            aria-label={p.photo.alt || p.name}
            className="absolute inset-[14%] overflow-hidden rounded-full border-2 bg-gradient-to-br from-violet/40 to-cyan/30"
            style={{ borderColor: section.planet.color, boxShadow: `0 0 60px ${section.planet.color}55` }}
          >
            {p.photo.key ? (
              <MediaImage media={p.photo} className="size-full object-cover" sizes="(max-width: 768px) 70vw, 300px" />
            ) : (
              <span className="flex size-full items-center justify-center font-heading text-5xl font-bold text-white/90">{initials}</span>
            )}
          </button>
        </div>

        <div data-reveal>
          {bioFilled ? (
            <RichText doc={p.bio} className="text-lg leading-relaxed text-text/90" />
          ) : (
            ctx.preview && <Txt v={richToText(p.bio)} ctx={ctx} as="p" className="text-lg" />
          )}
          <Txt v={p.funLine} ctx={ctx} as="p" className="mono mt-5 text-sm text-pink" />
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) =>
              filled(value) || ctx.preview ? (
                <div key={label} className="glass p-4">
                  <dt className="mono text-[0.7rem] tracking-wider text-muted uppercase">{label}</dt>
                  <dd className="mt-1 font-semibold text-white">
                    <Txt v={value} ctx={ctx} />
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      </div>
    </SectionShell>
  );
}
