import type { Quest } from "@/schema/site";
import { MediaImage } from "@/components/ui/MediaImage";
import { filled } from "@/lib/todo";
import { SectionShell, Txt, type Ctx, type SectionProps } from "./shared";
import { QuestFilter } from "./QuestFilter";

export const questStatusLabel = (ctx: Ctx, s: Quest["status"]) =>
  ({ completed: ctx.site.copy.quests.completed, "in-progress": ctx.site.copy.quests.inProgress, planned: ctx.site.copy.quests.planned })[s];

const STATUS_DOT: Record<Quest["status"], string> = {
  completed: "bg-cyan",
  "in-progress": "bg-gold animate-pulse",
  planned: "bg-white/30",
};

export function QuestCard({ quest: q, ctx }: { quest: Quest; ctx: Ctx }) {
  const l = ctx.site.copy.quests;
  if (!filled(q.title) && !ctx.preview) return null;
  return (
    <article
      id={`quest-${q.id}`}
      data-quest={q.id}
      data-category={q.category}
      data-tilt
      className="quest-card glass group relative flex flex-col overflow-hidden"
    >
      {q.image.key && (
        <div className="aspect-video overflow-hidden border-b border-white/10">
          <MediaImage media={q.image} className="size-full object-cover" sizes="(max-width: 768px) 100vw, 400px" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="chip">
            <span className={`size-1.5 rounded-full ${STATUS_DOT[q.status]}`} aria-hidden />
            {questStatusLabel(ctx, q.status)}
          </span>
          <span className="mono text-xs text-gold" aria-label={`${l.difficulty} ${q.difficulty}/5`} title={`${l.difficulty} ${q.difficulty}/5`}>
            {"★".repeat(q.difficulty)}
            <span className="text-white/20">{"★".repeat(5 - q.difficulty)}</span>
          </span>
        </div>
        <Txt v={q.title} ctx={ctx} as="h3" className="text-xl font-semibold text-white" />
        <Txt v={q.summary} ctx={ctx} as="p" className="mt-2 text-sm text-muted" />
        {q.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {q.tags.map((t) => (
              <li key={t} className="chip">{t}</li>
            ))}
          </ul>
        )}
        {(filled(q.reward) || ctx.preview) && q.reward && (
          <p className="mt-4 text-sm">
            <span className="mono text-gold">{l.reward}: </span>
            <Txt v={q.reward} ctx={ctx} className="text-text/90" />
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-5">
          {filled(q.github) && (
            <a href={q.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-10 !px-4 !py-2 text-sm">
              {l.github}
            </a>
          )}
          {filled(q.live) && (
            <a href={q.live} target="_blank" rel="noopener noreferrer" className="btn btn-primary !min-h-10 !px-4 !py-2 text-sm">
              {l.live}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** Scene 5 — Quest Log. Filter tabs + tilt are progressive enhancements added on the client. */
export function Quests({ ctx, section }: SectionProps<"quests">) {
  const quests = ctx.site.quests.filter((q) => filled(q.title) || ctx.preview);
  const categories = [...new Set(quests.map((q) => q.category).filter(Boolean))];
  return (
    <SectionShell section={section}>
      <QuestFilter categories={categories} allLabel={ctx.site.copy.quests.filterAll}>
        {quests.map((q) => (
          <div key={q.id} data-reveal data-category={q.category} className="flex">
            <QuestCard quest={q} ctx={ctx} />
          </div>
        ))}
      </QuestFilter>
    </SectionShell>
  );
}
