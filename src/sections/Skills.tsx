import type { Skill } from "@/schema/site";
import { filled } from "@/lib/todo";
import { SectionShell, type SectionProps } from "./shared";
import { Constellation } from "./Constellation";

const STATUS_STYLE: Record<Skill["status"], string> = {
  mastered: "border-cyan/50 text-cyan",
  learning: "border-violet/60 text-violet",
  locked: "border-white/15 text-muted",
};

/**
 * Scene 4 — Skill Constellation. This server-rendered list is the accessible, always-readable
 * version; the interactive star map (Phase 5) is drawn above it as decoration.
 */
export function Skills({ ctx, section }: SectionProps<"skills">) {
  const { site } = ctx;
  const l = site.copy.skills;
  const label = { mastered: l.mastered, learning: l.learning, locked: l.locked };

  return (
    <SectionShell section={section}>
      <Constellation branches={site.skills.branches} skills={site.skills.items} labels={l} />
      <h3 className="mono mb-4 text-xs tracking-widest text-muted uppercase">{l.listHeading}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-skill-list>
        {site.skills.branches.map((b) => {
          const items = site.skills.items.filter((s) => s.branchId === b.id);
          if (!items.length) return null;
          return (
            <div key={b.id} className="glass p-5" data-reveal>
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="size-2.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 12px ${b.color}` }} aria-hidden />
                {b.name}
              </h4>
              <ul className="space-y-2.5">
                {items.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" data-skill-id={s.id}>
                    <span className={s.status === "locked" ? "text-muted" : "text-text"}>
                      {s.status === "locked" ? "? " : ""}
                      {s.name}
                    </span>
                    <span className={`chip ${STATUS_STYLE[s.status]}`}>
                      {s.status === "learning" ? l.unlocking : label[s.status]}
                    </span>
                    {(filled(s.usedIn) || filled(s.since) || (s.status === "locked" && filled(s.goal))) && (
                      <span className="w-full text-xs text-muted">
                        {s.status === "locked" && filled(s.goal) && `${l.goal}: ${s.goal}`}
                        {filled(s.usedIn) && `${l.usedIn}: ${s.usedIn}`}
                        {filled(s.since) && ` · ${l.since} ${s.since}`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
