"use client";

import { useState } from "react";
import type { Site } from "@/schema/site";
import { DESIGN_PRESETS } from "@/schema/presets";
import { contrast, hexToRgb } from "@/lib/color";
import { AreaEditor } from "@/components/admin/AreaEditor";
import { LivePreview } from "@/components/admin/LivePreview";

type Design = Site["design"];

/** Blend the glass tint over the background, the way the browser composites the panel. */
function panelOver(bg: string, tint: string, alpha: number) {
  const [a, b] = [hexToRgb(bg), hexToRgb(tint)];
  return "#" + a.map((v, i) => Math.round(v * (1 - alpha) + b[i] * alpha).toString(16).padStart(2, "0")).join("");
}

function ContrastChecker({ d }: { d: Design }) {
  const c = d.colors;
  const panel = panelOver(c.bg, c.panel, d.glassOpacity);
  const pairs: [string, string, string][] = [
    ["Text on background", c.text, c.bg],
    ["Text on panel sheets", c.panelText, panel],
    ["Secondary text on background", c.muted, c.bg],
    ["Secondary text on panels", c.muted, panel],
    ["Accent on background", c.accent, c.bg],
  ];
  return (
    <div className="a-card p-4">
      <p className="mb-2 text-xs font-semibold text-white">Contrast checker (WCAG AA needs ≥ 4.5 : 1 for text)</p>
      <ul className="grid gap-1.5 text-xs">
        {pairs.map(([label, fg, bg]) => {
          const r = contrast(fg, bg);
          const ok = r >= 4.5;
          return (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 font-semibold" style={{ color: fg, background: bg }}>
                  Aa
                </span>
                {label}
              </span>
              <span className={ok ? "text-emerald-300" : "font-semibold text-amber-300"}>
                {r.toFixed(2)} {ok ? "✓" : "⚠ too low"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DesignStudio({ initial }: { initial: Design }) {
  const [live, setLive] = useState(initial);
  const [version, setVersion] = useState(0);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <AreaEditor
        area="design"
        initial={initial}
        onValue={setLive}
        onSaved={() => setVersion((v) => v + 1)}
        toolbar={(value, change) => (
          <div className="a-card mb-4 p-4">
            <p className="mb-2 text-xs font-semibold text-white">Theme presets</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DESIGN_PRESETS).map(([id, p]) => (
                <button
                  key={id}
                  type="button"
                  className={`a-btn ${value.preset === id ? "!border-cyan" : ""}`}
                  onClick={() => change({ ...value, preset: id as Design["preset"], colors: { ...p.colors } })}
                >
                  <span className="flex gap-0.5" aria-hidden>
                    {[p.colors.bg, p.colors.text, p.colors.accent, p.colors.panel].map((c) => (
                      <span key={c} className="size-3 rounded-full border border-white/20" style={{ background: c }} />
                    ))}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      />
      <div className="grid content-start gap-4 xl:sticky xl:top-16">
        <ContrastChecker d={live} />
        <LivePreview version={version} />
      </div>
    </div>
  );
}
