/*
 * Synth sound with the Web Audio API — no audio files are downloaded.
 * A sound is built from an oscillator (a pure tone generator: sine/triangle/square wave at a
 * frequency in Hz) going through a gain node (volume). We shape the volume over time with an
 * "envelope": jump up quickly (attack) and fade out exponentially (release) so notes don't click.
 * Browsers only allow audio after a user gesture, so the AudioContext is created lazily.
 */

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.35;

export function configureSound(on: boolean, vol: number) {
  enabled = on;
  volume = vol;
  if (on) ensure();
}

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 1) {
  if (!enabled) return; // never create an AudioContext while sound is off
  const ac = ensure();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.25 * gain), t + 0.012); // attack
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur); // release
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Achievement chime: a quick rising major arpeggio (C6 – E6 – G6 – C7). */
export const chime = () => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.5, "triangle"));
/** Terminal key blip. */
export const blip = () => tone(880 + Math.random() * 120, 0, 0.05, "square", 0.25);
/** Soft UI click. */
export const tick = () => tone(660, 0, 0.06, "sine", 0.5);
/** Shooting-star sparkle: fast falling notes. */
export const sparkle = () => [2637, 2349, 1976, 1760].forEach((f, i) => tone(f, i * 0.045, 0.25, "sine", 0.6));
/** God mode: a short rainbow arpeggio up two octaves. */
export const fanfare = () => [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.35, "triangle", 0.8));
