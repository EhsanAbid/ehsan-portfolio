import type { Site } from "@/schema/site";
import { FONT_VARS } from "@/lib/fonts";
import { luminance, mixHex, rgba } from "@/lib/color";

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
    "--panel-scheme": luminance(c.panel) > 0.5 ? "light" : "dark",
    "--panel-fg": c.panelText,
    "--panel-muted": mixHex(c.panelText, c.panel, 0.28),
    "--panel-border": rgba(c.panelText, 0.16),
    "--radius": `${d.radius}px`,
    "--blur": `${d.glassBlur}px`,
    "--name-scale": String(d.nameSize),
    "--font-display": `var(${FONT_VARS[d.fonts.display] ?? "--f-big-shoulders"}), "Arial Narrow", Impact, sans-serif`,
    "--display-style": d.fonts.displayItalic ? "italic" : "normal",
    "--display-weight": d.fonts.display === "Big Shoulders" ? "800" : "400",
    "--display-case": d.fonts.displayUpper ? "uppercase" : "none",
    "--font-body": `var(${FONT_VARS[d.fonts.body] ?? "--f-plex"}), ui-sans-serif, system-ui, sans-serif`,
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
