import { SectionShell, Txt, type SectionProps } from "./shared";

/** Scene 7 — The Lab: a monitoring console. The oscilloscope canvas is a client enhancement. */
export function Lab({ ctx, section }: SectionProps<"lab">) {
  const l = ctx.site.copy.lab;
  return (
    <SectionShell section={section}>
      <div className="grid gap-5 md:grid-cols-2">
        {ctx.site.lab.map((t) => (
          <article key={t.id} className="glass p-5" data-reveal data-lab={t.id} data-progress={t.progress}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Txt v={t.topic} ctx={ctx} as="h3" className="text-lg font-semibold text-white" />
                <Txt v={t.note} ctx={ctx} as="p" className="mt-1 text-sm text-muted" />
              </div>
              <span className="mono text-2xl font-bold text-cyan">{Math.round(t.progress)}%</span>
            </div>
            <div className="lab-scope mt-4 h-16 overflow-hidden rounded-lg border border-white/10 bg-black/30" aria-hidden data-scope={t.progress} />
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(t.progress)}
              aria-label={`${t.topic} ${l.progress}`}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-violet to-cyan" style={{ width: `${t.progress}%` }} />
            </div>
            {t.updated && (
              <p className="mono mt-3 text-[0.7rem] text-muted">
                {l.lastUpdated}: {t.updated}
              </p>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
