"use client";

import { useState } from "react";
import type { Site, Skill } from "@/schema/site";
import { emit } from "@/lib/events";

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
 * Hover (mouse) or tap (touch) a star for details. The full accessible list sits below it.
 */
export function Constellation({ branches, skills, labels }: { branches: Branch[]; skills: Skill[]; labels: Labels }) {
  const arms = layout(branches, skills);
  const [active, setActive] = useState<{ skill: Skill; x: number; y: number } | null>(null);

  const inspect = (s: Skill, x: number, y: number) => {
    setActive({ skill: s, x, y });
    emit("trigger", { type: "custom-event", param: "skill-inspect", key: s.id });
  };

  const statusLabel = { mastered: labels.mastered, learning: labels.learning, locked: labels.locked };

  return (
    <div className="relative mx-auto mb-10 max-w-3xl" data-reveal>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-manipulation select-none"
        role="img"
        aria-label={`${labels.listHeading}: ${skills.length}`}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      >
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
              const isActive = active?.skill.id === s.id;
              return (
                <g
                  key={s.id}
                  className={`star star-${s.status}`}
                  transform={`translate(${x} ${y})`}
                  onPointerEnter={(e) => e.pointerType === "mouse" && inspect(s, x, y)}
                  onClick={() => (isActive ? setActive(null) : inspect(s, x, y))}
                  style={{ cursor: "pointer" }}
                >
                  {/* invisible bigger hit area for fingers */}
                  <circle r={22} fill="transparent" />
                  {!locked && <circle r={16} fill="url(#star-glow)" opacity={s.status === "mastered" ? 0.55 : 0.3} />}
                  {s.status === "learning" && <circle className="unlock-ring" r={13} fill="none" stroke="var(--violet)" strokeWidth={1.5} strokeDasharray="4 4" />}
                  <circle r={s.status === "mastered" ? 6 : locked ? 4.5 : 5} fill={color} stroke={isActive ? "white" : "none"} strokeWidth={2} />
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

      {active && (
        <div
          className="glass pointer-events-none absolute z-10 w-56 -translate-x-1/2 p-3 text-sm"
          style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%`, transform: "translate(-50%, 18px)" }}
          role="status"
        >
          <p className="font-semibold text-white">{active.skill.name}</p>
          <p className="mono mt-0.5 text-xs text-cyan">
            {active.skill.status === "learning" ? labels.unlocking : statusLabel[active.skill.status]}
          </p>
          {active.skill.status === "locked" && active.skill.goal && !active.skill.goal.includes("TODO_EHSAN") && (
            <p className="mt-1 text-xs text-muted">
              {labels.goal}: {active.skill.goal}
            </p>
          )}
          {active.skill.usedIn && !active.skill.usedIn.includes("TODO_EHSAN") && (
            <p className="mt-1 text-xs text-muted">
              {labels.usedIn}: {active.skill.usedIn}
            </p>
          )}
          {active.skill.since && !active.skill.since.includes("TODO_EHSAN") && (
            <p className="text-xs text-muted">
              {labels.since} {active.skill.since}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
