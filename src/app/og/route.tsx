import { ImageResponse } from "next/og";
import { getPublishedSite } from "@/lib/site";
import { computeLevel } from "@/lib/level";

/**
 * GET /og — the auto-generated 1200×630 share image (LinkedIn preview card), used when no
 * Open Graph image is uploaded in Admin → SEO. Built from the published version, so it is
 * prerendered and refreshed on Publish like the page.
 */
export async function GET() {
  const site = await getPublishedSite();
  const name = site?.profile.name ?? "ehsan.exe";
  const role = site?.profile.role ?? "";
  const c = site?.design.colors;
  const lvl = site ? computeLevel(site) : null;
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 137.5) % 1200,
    y: (i * 89.3) % 630,
    s: 1 + ((i * 7) % 3),
  }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: `radial-gradient(circle at 75% 20%, ${c?.violet ?? "#8B5CF6"}55, transparent 55%), ${c?.bgDeep ?? "#05060F"}`,
          color: c?.text ?? "#E5E7EB",
          position: "relative",
        }}
      >
        {stars.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, borderRadius: 9, background: "white", opacity: 0.6 }} />
        ))}
        <div style={{ display: "flex", fontSize: 26, color: c?.cyan ?? "#22D3EE", letterSpacing: 4 }}>{site?.copy.hero.eyebrow ?? ""}</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "white", marginTop: 18, lineHeight: 1 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 38, color: c?.cyan ?? "#22D3EE", marginTop: 26 }}>{role}</div>
        {lvl && (
          <div style={{ display: "flex", alignItems: "center", marginTop: 46, fontSize: 26, color: c?.gold ?? "#FBBF24" }}>
            {`${site!.game.hud.levelPrefix} ${lvl.level} · ${lvl.title}`}
            <div style={{ display: "flex", marginLeft: 24, width: 260, height: 12, borderRadius: 12, background: "rgba(255,255,255,0.15)" }}>
              <div style={{ width: `${Math.max(6, lvl.progress * 100)}%`, height: 12, borderRadius: 12, background: c?.gold ?? "#FBBF24" }} />
            </div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
