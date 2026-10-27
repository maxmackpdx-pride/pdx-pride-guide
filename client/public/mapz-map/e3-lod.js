// Event hologram level of detail. Pure functions only: no DOM, no map calls.
// river-flight.js owns drawing and wires these in.
//
// A hologram's state follows its TRUE camera-to-waypoint distance, not zoom alone.
// The distance includes pitch and where the waypoint sits on screen, so the top of a
// pitched view is farther than the bottom at the same zoom.
//
//   vortex     nearest. Same-day events show the full card with countdown, and
//              venues with several events show the master vortex stack.
//              Capped by E3_LOD_MAX_FULL, nearest first.
//   coin       middle band. Round logo coin (E3 step 3.5).
//   compressed outer middle band. Half-size logo puck (E3 step 3).
//   mini       far. One cached C1 mini badge: no per-frame artwork, no countdown.
//
// Authored from the Mapz same-day work (Claude, PR #49): eventDepthMeters, the
// hysteresis band and the density cap, rebuilt on top of the E3 steps.
import {e3CoinPlan,e3CompressedPlan,E3_COMPRESSED_SCALE,E3_COIN_ZOOM,E3_COIN_ZOOM_SPAN} from './e3-venue-stack.js';

// Distance thresholds in meters. At pitch 0 and screen center one meter bound is
// roughly: 450 m = zoom 17, 1400 m = zoom 15.5, 2800 m = zoom 14.5.
export const E3_LOD_FULL_MAX_M = 450;
export const E3_LOD_COIN_MAX_M = 1400;
export const E3_LOD_COMPRESSED_MAX_M = 2800;
// A level only changes once the distance passes the boundary by this fraction.
export const E3_LOD_BAND = .1;
// Most venues that may show the full vortex at once. Nearest first.
export const E3_LOD_MAX_FULL = 3;
// A current vortex keeps its slot against a rival this much farther away.
export const E3_LOD_KEEP_BIAS = .9;
// The mini badge shrinks smoothly from half size to this fraction at the far end.
export const E3_MINI_SCALE_NEAR = E3_COMPRESSED_SCALE;
export const E3_MINI_SCALE_FAR = .2;
export const E3_MINI_FAR_M = 9000;
// Mini badge sits this many pixels (at scale 1) straight above its anchor.
export const E3_MINI_RISE_PX = 70;
// An event is "same day" when it starts within this window, or has begun.
export const E3_SAME_DAY_MS = 24 * 3600 * 1000;

export const E3_LOD_LEVELS = ['vortex', 'coin', 'compressed', 'mini'];
const BOUNDS = () => [E3_LOD_FULL_MAX_M, E3_LOD_COIN_MAX_M, E3_LOD_COMPRESSED_MAX_M];
const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * Camera-to-ground distance in meters for a screen point.
 * target: map (getPitch, transform.cameraToCenterDistance in px).
 */
export function eventDepthMeters(target, point, viewHeight, metersPerPixel) {
  const pitch = (target.getPitch?.() ?? 0) * Math.PI / 180;
  const f = target.transform?.cameraToCenterDistance || viewHeight * 1.5;
  const dy = point.y - viewHeight / 2;
  const theta = pitch - Math.atan(dy / f);
  const distancePx = f * Math.cos(pitch) / Math.max(.05, Math.cos(theta));
  return distancePx * metersPerPixel;
}

/** Level for one distance, with hysteresis against the previous level. */
export function e3LodLevel(current, depthM, band = E3_LOD_BAND) {
  const bounds = BOUNDS();
  let rank = Math.max(0, E3_LOD_LEVELS.indexOf(current));
  if (current === undefined) rank = bounds.filter(limit => depthM > limit).length;
  while (rank < 3 && depthM > bounds[rank] * (1 + band)) rank++;
  while (rank > 0 && depthM < bounds[rank - 1] * (1 - band)) rank--;
  return E3_LOD_LEVELS[rank];
}

/**
 * Levels for a set of venue groups.
 * entries: [{key, depthM, onScreen}] one per venue (or lone event).
 * previous: Map key -> level from the last frame.
 * Cap: at most maxFull entries stay 'vortex', nearest first. The rest become 'coin'.
 */
export function assignE3Levels(entries, previous = new Map(), {maxFull = E3_LOD_MAX_FULL, band = E3_LOD_BAND} = {}) {
  const levels = new Map();
  for (const {key, depthM} of entries) levels.set(key, e3LodLevel(previous.get(key), depthM, band));
  entries
    .filter(entry => entry.onScreen && levels.get(entry.key) === 'vortex')
    .sort((a, b) => a.depthM * (previous.get(a.key) === 'vortex' ? E3_LOD_KEEP_BIAS : 1) - b.depthM * (previous.get(b.key) === 'vortex' ? E3_LOD_KEEP_BIAS : 1))
    .slice(maxFull)
    .forEach(entry => levels.set(entry.key, 'coin'));
  return levels;
}

/** Smooth shrink of the mini badge from half size to E3_MINI_SCALE_FAR. */
export function e3MiniScale(depthM) {
  const t = clamp01((depthM - E3_LOD_COMPRESSED_MAX_M) / (E3_MINI_FAR_M - E3_LOD_COMPRESSED_MAX_M));
  const eased = t * t * (3 - 2 * t);
  return E3_MINI_SCALE_NEAR + (E3_MINI_SCALE_FAR - E3_MINI_SCALE_NEAR) * eased;
}

export function e3IsSameDay(startsAtMs, nowMs) {
  return Number.isFinite(startsAtMs) && startsAtMs - nowMs <= E3_SAME_DAY_MS;
}

/** Plan for one lone event at a level. Venues with several events use the vortex stack instead. */
export function e3LodPlan(level, {hasLogo = false, sameDay = false, depthM = E3_LOD_COIN_MAX_M, zoom = E3_COIN_ZOOM + E3_COIN_ZOOM_SPAN} = {}) {
  if (level === 'mini') {
    const scale = e3MiniScale(depthM);
    return {step: 'mini', shape: 'badge', scale, diameterPx: 0, logoOnly: true, countdown: false, maxPerVenue: 1};
  }
  if (level === 'vortex' && sameDay) {
    // Full same-day card with its countdown (E3 step 4, one event).
    return {step: 'vortex', shape: 'puck', scale: 1, diameterPx: 0, logoOnly: false, countdown: true, maxPerVenue: 1};
  }
  if ((level === 'vortex' || level === 'coin') && hasLogo) return e3CoinPlan({zoom});
  return e3CompressedPlan();
}
