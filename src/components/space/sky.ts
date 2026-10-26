import type { SkyTheme } from "@/schema/site";

/** Which sky theme covers this hour? Ranges may wrap past midnight (e.g. 20 → 5). */
export function themeForHour(themes: SkyTheme[], hour: number): SkyTheme | undefined {
  return themes.find((t) =>
    t.startHour <= t.endHour ? hour >= t.startHour && hour < t.endHour : hour >= t.startHour || hour < t.endHour,
  );
}

export const SKY_KEY = "ehsan.sky";

/** Only the background changes — text colours are never touched, so contrast stays the same. */
export function applySky(theme: SkyTheme) {
  const s = document.documentElement.style;
  s.setProperty("--sky-top", theme.top);
  s.setProperty("--sky-bottom", theme.bottom);
  s.setProperty("--sky-glow", theme.glow);
  document.documentElement.dataset.sky = theme.id;
}

export function readSavedSky(): string | null {
  try {
    return localStorage.getItem(SKY_KEY);
  } catch {
    return null;
  }
}

export function saveSky(id: string | null) {
  try {
    if (id) localStorage.setItem(SKY_KEY, id);
    else localStorage.removeItem(SKY_KEY);
  } catch {
    /* private mode — fine */
  }
}
