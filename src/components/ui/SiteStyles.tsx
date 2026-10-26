import type { Site } from "@/schema/site";
import { FONT_VARS } from "@/lib/fonts";
import { rgba } from "@/lib/color";

/** Turns the published design tokens into CSS variables (spec §7: no rebuild for a colour change). */
export function designCss(site: Site) {
  const d = site.design;
  const c = d.colors;
  const sky = site.effects.sky.themes.find((t) => t.id === "night") ?? site.effects.sky.themes[0];
  const vars: Record<string, string> = {
    "--bg-deep": c.bgDeep,
    "--panel": rgba(c.panel, d.glassOpacity),
    "--panel-border": rgba(c.panel, Math.min(0.25, d.glassOpacity * 2 + 0.04)),
    "--cyan": c.cyan,
    "--violet": c.violet,
    "--pink": c.pink,
    "--gold": c.gold,
    "--text": c.text,
    "--muted": c.muted,
    "--radius": `${d.radius}px`,
    "--blur": `${d.glassBlur}px`,
    "--space": String(d.spacing),
    "--font-heading": `var(${FONT_VARS[d.fonts.heading] ?? "--f-space-grotesk"}), ui-sans-serif, system-ui, sans-serif`,
    "--font-body": `var(${FONT_VARS[d.fonts.body] ?? "--f-inter"}), ui-sans-serif, system-ui, sans-serif`,
    "--font-code": `var(${FONT_VARS[d.fonts.mono] ?? "--f-jetbrains"}), ui-monospace, monospace`,
    "--reveal-ms": `${site.effects.motion.revealMs}ms`,
  };
  if (sky) {
    vars["--sky-top"] = sky.top;
    vars["--sky-bottom"] = sky.bottom;
    vars["--sky-glow"] = sky.glow;
  }
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
}

/** Prevent admin-entered CSS from closing the <style> tag and injecting HTML. */
const escapeStyle = (css: string) => css.replace(/<\/?style/gi, "").replace(/<!--|-->/g, "");

export function SiteStyles({ site }: { site: Site }) {
  return (
    <>
      <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designCss(site) }} />
      {site.advanced.customCss.trim() && (
        <style id="custom-css" dangerouslySetInnerHTML={{ __html: escapeStyle(site.advanced.customCss) }} />
      )}
    </>
  );
}
