/*
 * ───────────── Adaptive quality: a closed-loop controller ─────────────
 * Like a thermostat for frame rate. We *measure* the output (FPS), compare it with a target
 * and adjust the input (quality tier: how many particles/stars, pixel ratio, extras).
 *
 *  • Initial guess from the device (CPU cores, RAM, screen size, touch).
 *  • Every frame we count; every `windowSec` we compute the average FPS of that window.
 *  • If the average stays BELOW `dropBelowFps` for `dropAfterSec` → drop one tier.
 *  • Only if it stays ABOVE `raiseAboveFps` for `raiseAfterSec` → raise one tier.
 * The two thresholds are far apart (40 vs 58) and raising waits longer than dropping:
 * that gap is *hysteresis*. Without it a phone hovering around 50 fps would flip between
 * tiers every second (visible flicker); with it the quality settles.
 */

export const TIERS = ["low", "medium", "high"] as const;
export type Tier = (typeof TIERS)[number];

export type QualityConfig = {
  windowSec: number;
  dropBelowFps: number;
  dropAfterSec: number;
  raiseAboveFps: number;
  raiseAfterSec: number;
};

type NavigatorExtra = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** First guess before we have any measurements. */
export function initialTier(): Tier {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as NavigatorExtra;
  if (nav.connection?.saveData) return "low";
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4; // GB, Chrome only
  const touch = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) < 500;
  let score = 0;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  if (mem >= 8) score += 2;
  else if (mem >= 4) score += 1;
  if (touch) score -= 1;
  if (small) score -= 1;
  // Phones start on Low and earn their way up: the controller raises the tier after a few
  // smooth seconds, which is much nicer than starting high and stuttering.
  if (touch && small) return "low";
  return score >= 3 ? "high" : score >= 1 ? "medium" : "low";
}

export class FpsController {
  private frames = 0;
  private windowStart = 0;
  private belowFor = 0; // seconds spent under the drop threshold
  private aboveFor = 0; // seconds spent over the raise threshold
  public fps = 60;

  constructor(
    public tier: Tier,
    private cfg: QualityConfig,
    private onChange: (t: Tier) => void,
  ) {}

  setConfig(cfg: QualityConfig) {
    this.cfg = cfg;
  }

  /** Call once per rendered frame with performance.now(). */
  tick(now: number) {
    if (!this.windowStart) this.windowStart = now;
    this.frames++;
    const elapsed = (now - this.windowStart) / 1000;
    if (elapsed < this.cfg.windowSec) return;

    this.fps = this.frames / elapsed;
    this.frames = 0;
    this.windowStart = now;

    // A very long window means the tab was hidden/throttled — not a real measurement.
    if (elapsed > this.cfg.windowSec * 3) return;

    if (this.fps < this.cfg.dropBelowFps) {
      this.belowFor += elapsed;
      this.aboveFor = 0;
    } else if (this.fps > this.cfg.raiseAboveFps) {
      this.aboveFor += elapsed;
      this.belowFor = 0;
    } else {
      this.belowFor = this.aboveFor = 0; // in the comfortable band: hold steady
    }

    const i = TIERS.indexOf(this.tier);
    if (this.belowFor >= this.cfg.dropAfterSec && i > 0) this.set(TIERS[i - 1]);
    else if (this.aboveFor >= this.cfg.raiseAfterSec && i < TIERS.length - 1) this.set(TIERS[i + 1]);
  }

  private set(t: Tier) {
    this.tier = t;
    this.belowFor = this.aboveFor = 0;
    this.onChange(t);
  }
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
