import type { Ctx } from "./shared";

/** Scene 9 — the edge of the universe. The achievement counter is filled in on the client. */
export function Footer({ ctx }: { ctx: Ctx }) {
  const f = ctx.site.copy.footer;
  const total = ctx.site.game.achievements.filter((a) => a.enabled).length;
  return (
    <footer id="footer" className="section border-t border-white/5 text-center" data-section="footer">
      <div className="section-inner">
        <p className="font-heading text-2xl text-white md:text-3xl">{f.line}</p>
        <p className="mt-2 text-muted">{f.subline}</p>
        <p className="mono mt-8 text-sm text-gold">
          <span data-achievement-count>0</span>/{total} {f.achievements}
        </p>
        <p className="mono mt-1 text-xs text-muted">{f.secrets}</p>
        <a href="#top" className="btn btn-ghost mt-10" data-magnetic data-rocket>
          <span aria-hidden className="rocket inline-block">🚀</span> {f.backToTop}
        </a>
        <p className="mt-10 text-xs text-muted/80">{f.credit}</p>
      </div>
    </footer>
  );
}
