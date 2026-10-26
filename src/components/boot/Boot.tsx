import type { Site } from "@/schema/site";
import { BootControl } from "./BootControl";

/**
 * Scene 0 — boot sequence.
 *
 * Built so it can never hide the site for long:
 *  • A tiny inline script runs BEFORE the first paint and decides full / mini / off
 *    (first visit, returning visitor, reduced motion) — no flash, no layout shift.
 *  • The typing, progress bar and collapse are pure CSS animations with a fixed total
 *    duration, so the overlay disappears on time even if JavaScript is slow or broken.
 *  • Without JavaScript the script never runs, `data-boot` is never set, and the CSS keeps
 *    the overlay hidden. The name underneath is real HTML the whole time.
 */
export function Boot({ site }: { site: Site }) {
  const b = site.effects.boot;
  if (!b.enabled || !b.lines.length) return null;
  const cfg = { full: b.durationMs, mini: b.miniDurationMs, once: b.showFullOnce };
  // Runs synchronously while the HTML is parsed (before the overlay below is painted).
  const script = `(function(){try{var d=document.documentElement,c=${JSON.stringify(cfg)};
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,seen=null;
try{seen=localStorage.getItem('ehsan.booted');localStorage.setItem('ehsan.booted','1')}catch(e){}
var mode=rm?'off':(seen&&c.once?(c.mini>0?'mini':'off'):'full');
d.dataset.boot=mode;d.style.setProperty('--boot-ms',(mode==='mini'?c.mini:c.full)+'ms');
var h=new Date().getHours();if(h<5)d.dataset.night='1';}catch(e){}})();`;

  const n = b.lines.length;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <div className="boot" aria-hidden="true" style={{ "--lines": n } as React.CSSProperties}>
        <div className="boot-inner mono">
          {b.lines.map((line, i) => {
            const isNight = i === b.nightLineIndex && b.nightLine;
            return (
              <p key={i} className={`boot-line ${i === n - 1 ? "boot-last" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                {isNight ? (
                  <>
                    <span className="boot-day">{line}</span>
                    <span className="boot-night">{b.nightLine}</span>
                  </>
                ) : (
                  line
                )}
              </p>
            );
          })}
          <div className="boot-bar">
            <span />
          </div>
        </div>
        <span className="boot-point" />
        <p className="boot-skip mono">{b.skipHint}</p>
      </div>
      <BootControl />
    </>
  );
}
