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
 *  • The first seconds (and those after every change) are ignored: loading always stutters.
 *  • A tier that was too slow once is never retried in this visit, so we can't cycle
 *    high → medium → high → … forever.
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

/** Ignore the first seconds after start and after a tier change (shader compile, texture upload). */
const WARMUP_MS = 3000;
/** A pause between two frames longer than this is a gap (paused loop, hidden tab), not slowness. */
const GAP_MS = 250;

export class FpsController {
  private frames = 0;
  private windowStart = 0;
  private lastFrame = 0;
  private quietUntil = 0;
  private belowFor = 0; // seconds spent under the drop threshold
  private aboveFor = 0; // seconds spent over the raise threshold
  /** Highest tier we may climb back to: a tier that was too slow once is not retried. */
  private ceiling = TIERS.length - 1;
  public fps = 60;

  constructor(
    public tier: Tier,
    private cfg: QualityConfig,
    private onChange: (t: Tier) => void,
  ) {}

  setConfig(cfg: QualityConfig) {
    this.cfg = cfg;
  }

  /** Start a fresh measurement (after a pause, or while the page is still busy loading). */
  private restart(now: number, quietMs = 0) {
    this.frames = 0;
    this.windowStart = now;
    this.quietUntil = Math.max(this.quietUntil, now + quietMs);
  }

  /** Call once per rendered frame with performance.now(). */
  tick(now: number) {
    if (!this.lastFrame) this.restart(now, WARMUP_MS);
    else if (now - this.lastFrame > GAP_MS) this.restart(now);
    this.lastFrame = now;
    if (now < this.quietUntil) {
      this.restart(now);
      return;
    }
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
    if (this.belowFor >= this.cfg.dropAfterSec && i > 0) {
      this.ceiling = i - 1;
      this.set(TIERS[i - 1], now);
    } else if (this.aboveFor >= this.cfg.raiseAfterSec && i < this.ceiling) this.set(TIERS[i + 1], now);
  }

  private set(t: Tier, now: number) {
    this.tier = t;
    this.belowFor = this.aboveFor = 0;
    this.restart(now, WARMUP_MS);
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
