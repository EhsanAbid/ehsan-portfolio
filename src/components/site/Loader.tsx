import type { Site } from "@/schema/site";
import { mediaUrl } from "@/lib/mediaUrl";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

/**
 * Runs before the first paint (an inline script while the HTML is parsed) and decides:
 *  • 3D flight mode (`s-fly`) unless the visitor prefers reduced motion,
 *  • the letter-rise animation (`s-anim`),
 *  • the logo loader: full on the first visit, short when returning, none for reduced motion.
 * The loader itself is a pure CSS animation with a fixed length, so it can never hang; and
 * without JavaScript none of this runs and the page simply shows its static content.
 */
export function Loader({ site }: { site: Site }) {
  const l = site.effects.loader;
  const cfg = {
    loader: l.enabled,
    full: l.durationMs,
    short: l.returningMs,
    fly: site.effects.flight.enabled || site.effects.portrait.enabled,
    rise: site.effects.motion.letterRise,
  };
  const script = `(function(){try{var d=document.documentElement,c=${JSON.stringify(cfg)};
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,seen=null;
try{seen=localStorage.getItem('s.seen');localStorage.setItem('s.seen','1')}catch(e){}
if(!rm&&c.fly)d.classList.add('s-fly');if(!rm&&c.rise)d.classList.add('s-anim');
var ms=(!rm&&c.loader)?(seen?c.short:c.full):0;
d.dataset.loader=ms>0?'on':'skip';d.style.setProperty('--loader-ms',ms+'ms');}catch(e){}})();`;
  const logo = site.profile.logo;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <div className="s-loader" aria-hidden>
        {logo.key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(logo)} alt="" style={{ height: 56, width: "auto" }} />
        ) : (
          <span>{initialsOf(site.profile.name)}</span>
        )}
      </div>
    </>
  );
}
