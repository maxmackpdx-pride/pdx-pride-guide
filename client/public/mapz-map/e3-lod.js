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

// Distance thresholds in meters, scaled x10 by Tucker's approved retune.
// Keep these named bounds independent of the far/near presentation policy.
// Product question for Tucker: is the same-day vortex the far overview state too?
// false (default) = vortex only inside the distance bands. true = every same-day venue on screen is a vortex.
export const E3_SAME_DAY_VORTEX_FAR_OVERVIEW = false;
export const E3_LOD_FULL_MAX_M = 4500;
export const E3_LOD_COIN_MAX_M = 14000;
export const E3_LOD_COMPRESSED_MAX_M = 28000;
// A level only changes once the distance passes the boundary by this fraction.
export const E3_LOD_BAND = .1;
// Most venues that may show the full vortex at once. Nearest first.
export const E3_LOD_MAX_FULL = 3;
// A current vortex keeps its slot against a rival this much farther away.
export const E3_LOD_KEEP_BIAS = .9;
// The mini badge is full size at E3_MINI_FULL_ZOOM and closer, and shrinks smoothly to
// E3_MINI_SCALE_FAR at E3_MINI_FAR_ZOOM and farther. Zoom-driven by design (Tucker, 2026-10-26).
export const E3_MINI_FULL_ZOOM = 15.5;
export const E3_MINI_FAR_ZOOM = 12;
export const E3_MINI_SCALE_FAR = .2;
// The mini badge floats this many screen pixels straight above its beam anchor, so it clears the
// venue's own waypoint head (about 68 px tall) and the beam always lands on the pin.
export const E3_MINI_RISE_PX = 76;
// An event is "same day" when it starts within this window, or has begun.
export const E3_SAME_DAY_MS = 24 * 3600 * 1000;

// Same-day vortexes and their beams are green (E3-Lifecycle board, #39FF14). Other levels keep the venue color.
export const E3_SAME_DAY_GREEN = '#39FF14';

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
  if (E3_SAME_DAY_VORTEX_FAR_OVERVIEW) for (const entry of entries) if (entry.sameDay && entry.onScreen) levels.set(entry.key, 'vortex');
  entries
    .filter(entry => entry.onScreen && levels.get(entry.key) === 'vortex')
    .sort((a, b) => a.depthM * (previous.get(a.key) === 'vortex' ? E3_LOD_KEEP_BIAS : 1) - b.depthM * (previous.get(b.key) === 'vortex' ? E3_LOD_KEEP_BIAS : 1))
    .slice(maxFull)
    .forEach(entry => levels.set(entry.key, 'coin'));
  return levels;
}

/** Smoothstep shrink of the mini badge: 1 at E3_MINI_FULL_ZOOM, E3_MINI_SCALE_FAR at E3_MINI_FAR_ZOOM. */
export function e3MiniScale(zoom) {
  const t = clamp01((zoom - E3_MINI_FAR_ZOOM) / (E3_MINI_FULL_ZOOM - E3_MINI_FAR_ZOOM));
  const eased = t * t * (3 - 2 * t);
  return E3_MINI_SCALE_FAR + (1 - E3_MINI_SCALE_FAR) * eased;
}

export function e3IsSameDay(startsAtMs, nowMs) {
  return Number.isFinite(startsAtMs) && startsAtMs - nowMs <= E3_SAME_DAY_MS;
}

/** Plan for one lone event at a level. Venues with several events use the vortex stack instead. */
export function e3LodPlan(level, {hasLogo = false, sameDay = false, zoom = E3_COIN_ZOOM + E3_COIN_ZOOM_SPAN} = {}) {
  if (level === 'mini') {
    const scale = e3MiniScale(zoom);
    return {step: 'mini', shape: 'badge', scale, diameterPx: 0, logoOnly: true, countdown: false, maxPerVenue: 1};
  }
  if (level === 'vortex' && sameDay) {
    // Full same-day card with its countdown (E3 step 4, one event).
    return {step: 'vortex', shape: 'puck', scale: 1, diameterPx: 0, logoOnly: false, countdown: true, maxPerVenue: 1};
  }
  if ((level === 'vortex' || level === 'coin') && hasLogo) return e3CoinPlan({zoom});
  return e3CompressedPlan();
}

// ---------------------------------------------------------------------------
// 3D Blender hologram: size, anchor and hand-over rules. Pure, so they are unit tested.
// ---------------------------------------------------------------------------

// World size of the 3D hologram, in meters per model unit. At close zoom it is E3_BLENDER_SCALE_CLOSE_M (24 m,
// the sensible baseline; Tucker: big and eye-catching, never absurd). Zooming out the world size grows a little
// slower than the map shrinks (E3_BLENDER_ZOOM_OUT_GROWTH < 1), so the hologram eases down on screen, and
// Tucker's size rule applies on top: 20% of full size at zoom 12, full size at zoom 15.5, smooth between.
// A viewport cap keeps the tallest stage (the double stack) under E3_BLENDER_MAX_SCREEN_FRACTION of the
// screen height, so it never swallows its neighbours or clips off the top, however close the camera is.
export const E3_BLENDER_SCALE_CLOSE_M = 24;
export const E3_BLENDER_SCALE_CLOSE_ZOOM = 17.5;
export const E3_BLENDER_ZOOM_OUT_GROWTH = .8;
export const E3_BLENDER_MAX_SCREEN_FRACTION = .30;
export const E3_BLENDER_TALLEST_UNITS = 5.2;
export const E3_BLENDER_SIZE_FULL_ZOOM = 15.5;
export const E3_BLENDER_SIZE_FAR_ZOOM = 12;
export const E3_BLENDER_SIZE_FAR = .2;
// The 3D layer only takes a venue over once the model is at least compressed (stage 2) and tall enough to
// read. The far mini badge, and anything too small, stays on the 2D path.
export const E3_BLENDER_MIN_STAGE = 2;
export const E3_BLENDER_MIN_SCREEN_PX = 40;
// Approximate model height in model units per stage 0..5 (beam top), used for the on-screen size test.
export const E3_BLENDER_STAGE_HEIGHT_UNITS = [1, 1.4, 4, 4.6, 4.8, 5.2];
// While a leaving venue's stage tween is still above this value the 3D layer keeps drawing it, so the
// hand-back to the 2D mini badge is not a pop.
export const E3_BLENDER_RELEASE_STAGE = 1.02;
// The pin hovers this many meters above a roof (matches the waypoint pin in river-flight.js).
export const PLACEZ_HOVER_METERS = 3;
export const PLACEZ_ROOF_CLEARANCE_METERS = 4;

/** Smooth 0.2..1 size factor: E3_BLENDER_SIZE_FAR at the far zoom, 1 at the full zoom. */
export function e3BlenderSizeFactor(zoom) {
  const t = clamp01((zoom - E3_BLENDER_SIZE_FAR_ZOOM) / (E3_BLENDER_SIZE_FULL_ZOOM - E3_BLENDER_SIZE_FAR_ZOOM));
  const eased = t * t * (3 - 2 * t);
  return E3_BLENDER_SIZE_FAR + (1 - E3_BLENDER_SIZE_FAR) * eased;
}

const metersPerPixelAt = (zoom, latitude) => 40075016.686 * Math.cos(latitude * Math.PI / 180) / (512 * Math.pow(2, zoom));
const pitchFactor = pitch => Math.max(.35, Math.sin(pitch * Math.PI / 180));

/**
 * World scale in meters for the 3D model at a zoom. With a viewHeight (CSS px) the scale is also capped so the
 * tallest stage stays under E3_BLENDER_MAX_SCREEN_FRACTION of the screen.
 */
export function e3BlenderScaleMeters(zoom, {viewHeight = 0, latitude = 45.5, pitch = 50} = {}) {
  const zoomOut = Math.max(0, E3_BLENDER_SCALE_CLOSE_ZOOM - zoom);
  const base = E3_BLENDER_SCALE_CLOSE_M * Math.pow(2, zoomOut * E3_BLENDER_ZOOM_OUT_GROWTH) * e3BlenderSizeFactor(zoom);
  if (!(viewHeight > 0)) return base;
  const capped = E3_BLENDER_MAX_SCREEN_FRACTION * viewHeight * metersPerPixelAt(zoom, latitude) / (E3_BLENDER_TALLEST_UNITS * pitchFactor(pitch));
  return Math.min(base, capped);
}

/** Approximate on-screen height of the model, in CSS pixels. */
export function e3BlenderScreenHeightPx(stage, zoom, latitude = 45.5, pitch = 50, viewHeight = 0) {
  const index = Math.max(0, Math.min(5, stage)), low = Math.floor(index);
  const units = E3_BLENDER_STAGE_HEIGHT_UNITS[low] + ((E3_BLENDER_STAGE_HEIGHT_UNITS[Math.min(5, low + 1)] - E3_BLENDER_STAGE_HEIGHT_UNITS[low]) * (index - low));
  return units * e3BlenderScaleMeters(zoom, {viewHeight, latitude, pitch}) / metersPerPixelAt(zoom, latitude) * pitchFactor(pitch);
}

/**
 * Whether the 3D layer draws this venue (and so the 2D card, beam and clip are skipped).
 * targetStage: stage the LOD asks for. shownStage: where its tween currently is.
 */
export function e3BlenderTakesOver({targetStage, shownStage = targetStage, zoom, latitude = 45.5, pitch = 50, viewHeight = 0}) {
  if (e3BlenderScreenHeightPx(Math.max(targetStage, shownStage, E3_BLENDER_MIN_STAGE), zoom, latitude, pitch, viewHeight) < E3_BLENDER_MIN_SCREEN_PX) return false;
  return targetStage >= E3_BLENDER_MIN_STAGE || shownStage > E3_BLENDER_RELEASE_STAGE;
}

/** Same key the venue snap table uses (mapz-roof-boot.js coordKey). */
export function e3CoordKey(coordinates) {
  return `${Number(coordinates[0]).toFixed(6)},${Number(coordinates[1]).toFixed(6)}`;
}

/** The lng/lat the 2D waypoint pin is drawn at: the snapped building center when there is one, else the raw point. */
export function e3AnchorCoordinates(coordinates, snaps) {
  const snapped = snaps?.get?.(e3CoordKey(coordinates));
  return Array.isArray(snapped) && snapped.length >= 2 && snapped.every(Number.isFinite) ? [snapped[0], snapped[1]] : coordinates;
}

/** Meters the waypoint pin hovers above ground: the same rule the 2D pin uses, at the current extrusion. */
export function placezHoverMeters(roofMeters, extrusion, hover = PLACEZ_HOVER_METERS, clearance = PLACEZ_ROOF_CLEARANCE_METERS) {
  const roofHeight = Math.max(hover, roofMeters + clearance);
  return hover + (roofHeight - hover) * extrusion;
}

// ---------------------------------------------------------------------------
// Crowd-aware size: holograms that would overlap on screen shrink a little, together, and grow back when
// there is room again. Isolated venues stay at full size.
// ---------------------------------------------------------------------------
// Smallest crowd factor (fraction of normal size). Never goes below this.
export const E3_CROWD_MIN_SCALE = .65;
// A hologram shrunk for crowding is never made smaller than this many CSS px tall, when it started larger.
export const E3_CROWD_READABLE_PX = 56;
// Widest part of the model (rings), in model units, for the overlap test. The screen is about 1.4 wide.
export const E3_CROWD_WIDTH_UNITS = 1.6;
// Hysteresis: a shrunk hologram only starts growing back once its neighbor is this far beyond touching.
export const E3_CROWD_RELEASE = 1.15;
// Ease rate per second (higher is quicker). About 0.5 s to settle.
export const E3_CROWD_EASE_RATE = 6;

/** On-screen footprint of a model at a stage and world scale, in CSS px. */
export function e3BlenderFootprintPx(stage, scaleMeters, zoom, latitude = 45.5, pitch = 50) {
  const index = Math.max(0, Math.min(5, stage)), low = Math.floor(index);
  const units = E3_BLENDER_STAGE_HEIGHT_UNITS[low] + ((E3_BLENDER_STAGE_HEIGHT_UNITS[Math.min(5, low + 1)] - E3_BLENDER_STAGE_HEIGHT_UNITS[low]) * (index - low));
  const perUnit = scaleMeters / metersPerPixelAt(zoom, latitude);
  return {widthPx: E3_CROWD_WIDTH_UNITS * perUnit, heightPx: units * perUnit * pitchFactor(pitch)};
}

/**
 * Target crowd factor per hologram.
 * items: [{key, x, y, widthPx, heightPx}] anchors in screen px and their normal-size footprint.
 * current: Map key -> factor now (below 1 means already shrunk, which engages the release hysteresis).
 */
export function e3CrowdTargets(items, current = new Map()) {
  const targets = new Map(items.map(item => [item.key, 1]));
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const reach = (a.widthPx + b.widthPx) / 2;
      if (reach <= 0) continue;
      // Already shrunk pairs only release once clear by the hysteresis margin.
      const margin = (current.get(a.key) ?? 1) < .999 || (current.get(b.key) ?? 1) < .999 ? E3_CROWD_RELEASE : 1;
      const ratio = distance / (reach * margin);
      if (ratio >= 1) continue;
      // Scaling both by the ratio makes them just touch; the floor stops it going further.
      const factor = Math.max(E3_CROWD_MIN_SCALE, ratio);
      targets.set(a.key, Math.min(targets.get(a.key), factor));
      targets.set(b.key, Math.min(targets.get(b.key), factor));
    }
  }
  for (const item of items) {
    // Readable floor: a small hologram is not shrunk below E3_CROWD_READABLE_PX.
    const readable = item.heightPx > 0 ? Math.min(1, E3_CROWD_READABLE_PX / item.heightPx) : 1;
    targets.set(item.key, Math.max(targets.get(item.key), E3_CROWD_MIN_SCALE, readable));
  }
  return targets;
}

/** Eased approach toward the target, frame-rate independent. */
export function e3CrowdEase(current, target, dt, rate = E3_CROWD_EASE_RATE) {
  const next = current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));
  return Math.abs(next - target) < .002 ? target : next;
}
