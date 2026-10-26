import type { Site, Skill } from "@/schema/site";
import { filled } from "@/lib/todo";
import { ConstellationTip } from "./ConstellationTip";

type Labels = Site["copy"]["skills"];
type Branch = Site["skills"]["branches"][number];

const W = 720;
const H = 560;
const CX = W / 2;
const CY = H / 2;

/** Deterministic pseudo-random (same on server and client → no hydration mismatch). */
const jitter = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

function layout(branches: Branch[], skills: Skill[]) {
  const used = branches.filter((b) => skills.some((s) => s.branchId === b.id));
  return used.map((b, bi) => {
    // Each branch is an arm of the constellation, evenly spread around the centre.
    const angle = (bi / used.length) * Math.PI * 2 - Math.PI / 2;
    const items = skills.filter((s) => s.branchId === b.id);
    const stars = items.map((s, j) => {
      const r = 70 + j * (190 / Math.max(1, items.length - 1 || 1)) + jitter(bi * 31 + j) * 18;
      const a = angle + jitter(bi * 17 + j * 7) * 0.35;
      return { skill: s, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.82 };
    });
    const end = stars[stars.length - 1];
    return { branch: b, stars, label: { x: CX + Math.cos(angle) * 290, y: CY + Math.sin(angle) * 290 * 0.82 + 4 }, end };
  });
}

/**
 * Scene 4 — the Skill Constellation (SVG, so it's sharp, cheap and needs no WebGL).
 * Rendered on the server; a tiny client controller adds the hover/tap tooltip.
 * The full accessible list sits below it.
 */
export function Constellation({ branches, skills, labels }: { branches: Branch[]; skills: Skill[]; labels: Labels }) {
  const arms = layout(branches, skills);
  const statusLabel = { mastered: labels.mastered, learning: labels.unlocking, locked: labels.locked };

  return (
    <div className="relative mx-auto mb-10 max-w-3xl" data-reveal id="constellation">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-manipulation select-none" role="img" aria-label={`${labels.listHeading}: ${skills.length}`}>
        <defs>
          <radialGradient id="star-glow">
            <stop offset="0" stopColor="white" stopOpacity="0.9" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* the "you are here" core */}
        <circle cx={CX} cy={CY} r={6} fill="var(--gold)" />
        <circle cx={CX} cy={CY} r={18} fill="none" stroke="var(--gold)" strokeOpacity={0.3} />
        {arms.map(({ branch, stars, label }) => (
          <g key={branch.id}>
            {/* constellation lines: centre → first star → next star … */}
            <polyline
              points={[`${CX},${CY}`, ...stars.map((s) => `${s.x},${s.y}`)].join(" ")}
              fill="none"
              stroke={branch.color}
              strokeOpacity={0.35}
              strokeWidth={1.2}
              strokeDasharray="3 5"
            />
            <text x={label.x} y={label.y} textAnchor="middle" className="mono" fontSize="13" fill={branch.color} opacity={0.9}>
              {branch.name}
            </text>
            {stars.map(({ skill: s, x, y }) => {
              const locked = s.status === "locked";
              const color = s.status === "mastered" ? "var(--cyan)" : s.status === "learning" ? "var(--violet)" : "#64748b";
              const lines = [
                locked && filled(s.goal) ? `${labels.goal}: ${s.goal}` : "",
                filled(s.usedIn) ? `${labels.usedIn}: ${s.usedIn}` : "",
                filled(s.since) ? `${labels.since} ${s.since}` : "",
              ].filter(Boolean);
              return (
                <g
                  key={s.id}
                  className={`star star-${s.status}`}
                  transform={`translate(${x} ${y})`}
                  style={{ cursor: "pointer" }}
                  data-star={s.id}
                  data-x={(x / W) * 100}
                  data-y={(y / H) * 100}
                  data-name={s.name}
                  data-status={statusLabel[s.status]}
                  data-lines={lines.join("\n")}
                >
                  {/* invisible bigger hit area for fingers */}
                  <circle r={22} fill="transparent" />
                  {!locked && <circle r={16} fill="url(#star-glow)" opacity={s.status === "mastered" ? 0.55 : 0.3} />}
                  {s.status === "learning" && <circle className="unlock-ring" r={13} fill="none" stroke="var(--violet)" strokeWidth={1.5} strokeDasharray="4 4" />}
                  <circle className="star-core" r={s.status === "mastered" ? 6 : locked ? 4.5 : 5} fill={color} strokeWidth={2} />
                  {locked && (
                    <text y={4} textAnchor="middle" fontSize="9" fill="#0b1026" fontWeight="700">
                      ?
                    </text>
                  )}
                  <text y={-14} textAnchor="middle" fontSize="11.5" fill={locked ? "#94a3b8" : "#e5e7eb"} className="star-label">
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <ConstellationTip />
    </div>
  );
}
