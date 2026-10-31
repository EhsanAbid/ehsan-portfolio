/*
 * Shared geometry of the scroll flight, used by the 3D scene, the HTML spacer and the
 * counter so they always agree. Scroll is measured in "screens" (scrollY / viewport height).
 *
 *   0 ─────── 1 ─── FIRST ── +perWork ── +perWork … ── end
 *   face       face fully     card 0     card 1           end screen
 *   intact     broken apart   in focus   in focus
 */
export const FLIGHT_FIRST = 1.35; // where the first card is in focus
export const FLIGHT_TAIL = 0.65; // extra scroll after the last card

export function flightEnd(count: number, perWork: number) {
  return count > 0 ? FLIGHT_FIRST + (count - 1) * perWork + FLIGHT_TAIL : FLIGHT_FIRST;
}

/** Scroll position (screens) at which card `i` is centred. */
export const cardProgress = (i: number, perWork: number) => FLIGHT_FIRST + i * perWork;

/** Height of the HTML spacer that makes the page long enough to fly (in screens). */
export const spacerScreens = (count: number, perWork: number) => Math.max(0.6, flightEnd(count, perWork) - 1 + 0.4);

/** Camera depth for a scroll position. A small push-in while the face breaks, then steady flight. */
export function cameraZ(p: number, depth: number) {
  const CAM0 = 30;
  if (p <= 1) return CAM0 - p * 8;
  return CAM0 - 8 - (p - 1) * 34 * depth;
}

/** Card z: a fixed distance in front of the camera at the moment it is in focus. */
export const CARD_AHEAD = 15;
