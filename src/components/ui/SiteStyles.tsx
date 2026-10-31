import type { Site } from "@/schema/site";
import { FONT_VARS } from "@/lib/fonts";
import { luminance, rgba } from "@/lib/color";

/** Turns the published design settings into CSS variables (no rebuild for a colour change). */
export function designCss(site: Site) {
  const d = site.design;
  const c = d.colors;
  const light = luminance(c.bg) > 0.5;
  const vars: Record<string, string> = {
    "--bg": c.bg,
    "--fg": c.text,
    "--fg-muted": c.muted,
    "--accent": c.accent,
    "--line": c.lines,
    "--panel-bg": rgba(c.panel, d.glassOpacity),
    "--panel-border": light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.09)",
    "--radius": `${d.radius}px`,
    "--blur": `${d.glassBlur}px`,
    "--name-scale": String(d.nameSize),
    "--font-display": `var(${FONT_VARS[d.fonts.display] ?? "--f-instrument"}), "Times New Roman", serif`,
    "--display-style": d.fonts.displayItalic ? "italic" : "normal",
    "--font-body": `var(${FONT_VARS[d.fonts.body] ?? "--f-inter-tight"}), ui-sans-serif, system-ui, sans-serif`,
  };
  const scheme = light ? "html{color-scheme:light}" : "";
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}${scheme}`;
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
