import { SectionShell, Txt, type SectionProps } from "./shared";
import { JourneyPath } from "./JourneyPath";

/**
 * Scene 6 — Journey Orbit. Checkpoints sit on a curved path (CSS curve on desktop,
 * straight line on phones); `.lit` is toggled while scrolling (client enhancement).
 */
export function Journey({ ctx, section }: SectionProps<"journey">) {
  const items = ctx.site.journey;
  const locked = ctx.site.copy.journey.locked;
  return (
    <SectionShell section={section}>
      <ol className="journey relative mx-auto max-w-3xl">
        <span aria-hidden className="journey-path absolute top-2 bottom-2 left-[1.15rem] w-px bg-gradient-to-b from-cyan via-violet to-transparent md:hidden" />
        <JourneyPath />
        {items.map((c, i) => (
          <li
            key={c.id}
            data-checkpoint={c.id}
            data-reveal
            className={`journey-item relative mb-8 grid grid-cols-[2.3rem_1fr] gap-4 md:grid-cols-2 md:gap-12 ${i % 2 ? "md:[&>div]:col-start-2 md:[&>div]:ml-10" : "md:[&>div]:mr-10 md:[&>div]:text-right"}`}
          >
            <span
              aria-hidden
              className={`journey-dot relative z-10 flex size-9 items-center justify-center rounded-full border text-base md:absolute md:-translate-x-1/2 ${i % 2 ? "md:left-[calc(50%+2.5rem)]" : "md:left-[calc(50%-2.5rem)]"} ${c.locked ? "border-white/15 bg-white/5 text-muted" : "border-cyan/60 bg-bg-deep"}`}
            >
              {c.locked ? "?" : c.icon}
            </span>
            <div className={`glass p-4 md:p-5 ${c.locked ? "opacity-70" : ""}`}>
              <p className="mono text-xs text-cyan">
                <Txt v={c.date} ctx={ctx} />
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{c.locked ? locked : c.title}</h3>
              <Txt v={c.description} ctx={ctx} as="p" className="mt-1 text-sm text-muted" />
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
