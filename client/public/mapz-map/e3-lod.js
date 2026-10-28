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
import {eventCountdown} from './event-countdown.js';
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
// The double stack is taller (the spacing between its two stacks, plus the countdown and face stack on top), so it
// gets its own cap height. The scale blends from the single to the stack value as the stage goes 4 to 5, which
// shrinks the pair a little instead of letting it run off the screen.
export const E3_BLENDER_STACK_TALLEST_UNITS = 6.8;
export const E3_BLENDER_SIZE_FULL_ZOOM = 15.5;
export const E3_BLENDER_SIZE_FAR_ZOOM = 12;
export const E3_BLENDER_SIZE_FAR = .2;
// The 3D layer only takes a venue over once the model is at least compressed (stage 2) and tall enough to
// read. The far mini badge, and anything too small, stays on the 2D path.
export const E3_BLENDER_MIN_STAGE = 2;
export const E3_BLENDER_MIN_SCREEN_PX = 40;
// Approximate model height in model units per stage 0..5 (beam top), used for the on-screen size test.
export const E3_BLENDER_STAGE_HEIGHT_UNITS = [1, 1.4, 4, 4.6, 4.8, 6.8];
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

/** Cap height in model units: the single vortex value, blending to the double stack value between stages 4 and 5. */
export function e3BlenderTallestUnits(stage = 0) {
  const open = clamp01(stage - 4);
  return E3_BLENDER_TALLEST_UNITS + (E3_BLENDER_STACK_TALLEST_UNITS - E3_BLENDER_TALLEST_UNITS) * open;
}

/**
 * World scale in meters for the 3D model at a zoom. With a viewHeight (CSS px) the scale is also capped so the
 * tallest stage stays under E3_BLENDER_MAX_SCREEN_FRACTION of the screen.
 */
export function e3BlenderScaleMeters(zoom, {viewHeight = 0, latitude = 45.5, pitch = 50, stage = 0} = {}) {
  const zoomOut = Math.max(0, E3_BLENDER_SCALE_CLOSE_ZOOM - zoom);
  const base = E3_BLENDER_SCALE_CLOSE_M * Math.pow(2, zoomOut * E3_BLENDER_ZOOM_OUT_GROWTH) * e3BlenderSizeFactor(zoom);
  if (!(viewHeight > 0)) return base;
  const capped = E3_BLENDER_MAX_SCREEN_FRACTION * viewHeight * metersPerPixelAt(zoom, latitude) / (e3BlenderTallestUnits(stage) * pitchFactor(pitch));
  return Math.min(base, capped);
}

/** Approximate on-screen height of the model, in CSS pixels. */
export function e3BlenderScreenHeightPx(stage, zoom, latitude = 45.5, pitch = 50, viewHeight = 0) {
  const index = Math.max(0, Math.min(5, stage)), low = Math.floor(index);
  const units = E3_BLENDER_STAGE_HEIGHT_UNITS[low] + ((E3_BLENDER_STAGE_HEIGHT_UNITS[Math.min(5, low + 1)] - E3_BLENDER_STAGE_HEIGHT_UNITS[low]) * (index - low));
  return units * e3BlenderScaleMeters(zoom, {viewHeight, latitude, pitch, stage: index}) / metersPerPixelAt(zoom, latitude) * pitchFactor(pitch);
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

// ---------------------------------------------------------------------------
// Same-day vortex copy: the text ring and the countdown. Pure, so they are unit tested.
// ---------------------------------------------------------------------------
// Longest text ring, in characters. The ring is repeated around the band, so a short line just repeats.
export const E3_RING_TEXT_MAX_CHARS = 56;
export const E3_RING_SEPARATOR = ' \u00b7 ';

/**
 * Words lettered around the vortex rings, uppercase, like the 2D clip: the venue name, then the event title(s),
 * then the start time when it still fits. Middle dots separate them. No em dashes.
 */
export function e3RingText({venueName = '', eventNames = [], time = ''} = {}) {
  const seen = new Set(), parts = [];
  for (const raw of [venueName, ...eventNames, time]) {
    const part = String(raw || '').replace(/[\u2012-\u2015]/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!part || seen.has(part)) continue;
    const next = [...parts, part].join(E3_RING_SEPARATOR);
    // The first part always stays (a long venue name is cut at the limit); later ones only if they fit.
    if (parts.length && next.length > E3_RING_TEXT_MAX_CHARS) continue;
    seen.add(part);
    parts.push(part.length > E3_RING_TEXT_MAX_CHARS ? part.slice(0, E3_RING_TEXT_MAX_CHARS).trim() : part);
  }
  return parts.join(E3_RING_SEPARATOR);
}

/**
 * Countdown shown on top of a same-day vortex, in the 2D label's digital form: "02h : 44m : 47s", or "LIVE".
 * Built from eventCountdown(), so it follows the same clock and rules as the 2D card.
 */
export function e3CountdownText(startsAtMs, nowMs) {
  const status = eventCountdown(startsAtMs, nowMs, true);
  if (!status) return '';
  if (status === 'STARTED') return 'LIVE';
  const parts = [...String(status).matchAll(/(\d+)\s*(D|H|M|S)/g)];
  if (!parts.length) return '';
  return parts.map(part => `${part[1].padStart(2, '0')}${part[2].toLowerCase()}`).join(' : ');
}

/** The nearest same-day event of a venue group: the soonest upcoming one, else the latest that has already begun. */
export function e3NearestSameDayEvent(events, nowMs) {
  let upcoming = null, begun = null;
  for (const event of events || []) {
    if (!e3IsSameDay(event.startsAtMs, nowMs)) continue;
    if (event.startsAtMs >= nowMs) { if (!upcoming || event.startsAtMs < upcoming.startsAtMs) upcoming = event; }
    else if (!begun || event.startsAtMs > begun.startsAtMs) begun = event;
  }
  return upcoming || begun;
}

// ---------------------------------------------------------------------------
// Vortex v2 copy and timing: ring lines, screen slides, countdown parts, accents, face stack. All pure.
// ---------------------------------------------------------------------------
/** Uppercase, one line, never an em or en dash. */
export function e3CleanCopy(value) {
  return String(value || '').replace(/[\u2012-\u2015]/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
}

/**
 * The two ring lines of one event: the first ring is the event name, the second is the DJs (performers);
 * with no performers it falls back to the host or group, then to the venue name.
 * source tells the caller which data answered ('performers' | 'host' | 'venue' | 'none').
 */
export function e3RingLines({eventName = '', performers = [], hostName = '', venueName = ''} = {}) {
  const name = e3CleanCopy(eventName) || e3CleanCopy(venueName);
  const djs = [...new Set((performers || []).map(e3CleanCopy).filter(Boolean))].slice(0, 4);
  const clip = text => text.length > E3_RING_TEXT_MAX_CHARS ? text.slice(0, E3_RING_TEXT_MAX_CHARS).trim() : text;
  if (djs.length) return {name: clip(name), sub: clip(djs.join(E3_RING_SEPARATOR)), source: 'performers'};
  const host = e3CleanCopy(hostName);
  if (host) return {name: clip(name), sub: clip(host), source: 'host'};
  const venue = e3CleanCopy(venueName);
  return {name: clip(name), sub: venue && venue !== name ? clip(venue) : '', source: venue && venue !== name ? 'venue' : 'none'};
}

/** "9:00 PM" -> "9PM", "9:30 PM" -> "9:30PM", "21:00" -> "9PM". Anything unreadable stays as typed, without dashes. */
export function e3TimeLabel(time) {
  const text = String(time || '').replace(/[\u2012-\u2015]/g, '-').trim();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m?\.?$/i) || text.match(/^(\d{1,2}):(\d{2})()$/);
  if (!match) return text.toUpperCase();
  let hour = Number(match[1]);
  const minute = match[2] || '00', suffix = match[3] ? (match[3].toLowerCase() === 'p' ? 'PM' : 'AM') : (hour >= 12 ? 'PM' : 'AM');
  if (!match[3]) hour = hour % 12 || 12;
  return `${hour}${minute === '00' ? '' : `:${minute}`}${suffix}`;
}

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  const n = m ? parseInt(m[1], 16) : 0xff00cc;
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return {h: (h * 60 + 360) % 360, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l};
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
/** The complementary accent of a venue tint: hue turned half way round, bright and saturated so it reads on dark. */
export function e3ComplementColor(hex) {
  const {h} = hexToHsl(hex);
  return hslToHex((h + 180) % 360, 1, .62);
}

/** Adult venues stay red; every other same-day vortex keeps the same-day green. */
export const E3_ADULT_RED = '#FF0000';
export function e3VortexTint(venueColor, sameDay = true) {
  if (String(venueColor || '').toUpperCase() === E3_ADULT_RED) return E3_ADULT_RED;
  return sameDay ? E3_SAME_DAY_GREEN : venueColor;
}

// Screen art cycle: the logo owns at least 60% of the time, then the poster, then the host or group logo.
export const E3_SLIDE_WEIGHTS = {logo: 60, poster: 25, host: 15};
export const E3_SLIDE_PERIOD_SECONDS = 12;
export const E3_SLIDE_GLITCH_SECONDS = .4;
/** The cycle of one screen: logo segments interleaved with the other slides, each with its start second. */
export function e3SlideCycle(kinds, period = E3_SLIDE_PERIOD_SECONDS) {
  const others = ['poster', 'host'].filter(kind => kinds.includes(kind));
  if (!kinds.includes('logo')) return others.length ? others.map((kind, i) => ({kind, start: i * period / others.length, end: (i + 1) * period / others.length})) : [];
  if (!others.length) return [{kind: 'logo', start: 0, end: period}];
  const total = E3_SLIDE_WEIGHTS.logo + others.reduce((sum, kind) => sum + E3_SLIDE_WEIGHTS[kind], 0);
  const logoShare = E3_SLIDE_WEIGHTS.logo / total, parts = [];
  let at = 0;
  others.forEach(kind => {
    const logoLength = period * logoShare / others.length, otherLength = period * E3_SLIDE_WEIGHTS[kind] / total;
    parts.push({kind: 'logo', start: at, end: at + logoLength});
    parts.push({kind, start: at + logoLength, end: at + logoLength + otherLength});
    at += logoLength + otherLength;
  });
  return parts;
}
/**
 * Slide state at a time: which art is on, which is next, how far the swap is, and the glitch strength (0..1).
 * The glitch only runs inside a short window around each boundary. Reduced motion is the static logo.
 */
export function e3SlideState(kinds, seconds, {reduced = false, period = E3_SLIDE_PERIOD_SECONDS, glitch = E3_SLIDE_GLITCH_SECONDS} = {}) {
  const base = kinds.includes('logo') ? 'logo' : kinds[0] || '';
  if (reduced || kinds.length < 2) return {from: base, to: base, mix: 0, glitch: 0};
  const cycle = e3SlideCycle(kinds, period);
  const t = ((seconds % period) + period) % period, half = glitch / 2;
  for (let i = 0; i < cycle.length; i++) {
    const part = cycle[i], next = cycle[(i + 1) % cycle.length];
    const boundary = part.end, start = boundary - half;
    // The window may spill over the period end into the first slide.
    for (const shift of [0, period]) {
      const local = t + shift - (start);
      if (local >= 0 && local <= glitch) {
        const p = local / glitch;
        return {from: part.kind, to: next.kind, mix: p, glitch: Math.sin(Math.PI * p)};
      }
    }
  }
  const part = cycle.find(item => t >= item.start && t < item.end) || cycle[0];
  return {from: part.kind, to: part.kind, mix: 0, glitch: 0};
}

/** The countdown as big numerals with a small unit letter each: d:h when a day or more away, else h:m:s or m:s. */
export function e3CountdownParts(startsAtMs, nowMs) {
  const status = eventCountdown(startsAtMs, nowMs, true);
  if (!status) return [];
  if (status === 'STARTED') return [{live: true, value: 'LIVE', unit: ''}];
  const groups = [...String(status).matchAll(/(\d+)\s*(D|H|M|S)/g)].map(match => ({value: match[1].padStart(2, '0'), unit: match[2].toLowerCase()}));
  const days = groups.find(group => group.unit === 'd');
  return days ? groups.slice(0, 2) : groups;
}

/** Face stack: initials of the people who RSVP'd, friends first when the host marks them. Nothing when nobody did. */
export const E3_FACE_MAX = 4;
export function e3FaceStack(avatars, total) {
  const list = Array.isArray(avatars) ? avatars.filter(Boolean) : [];
  const friends = list.filter(person => person.friend === true);
  const shown = (friends.length ? friends : list).slice(0, E3_FACE_MAX);
  const count = Number.isFinite(total) && total > 0 ? Math.max(total, shown.length) : shown.length;
  if (!shown.length) return {people: [], more: 0};
  return {people: shown.map(person => String(person.initial || person.initials || '?').slice(0, 3).toUpperCase()), more: Math.max(0, count - shown.length)};
}

/** Same-day events of a venue, nearest first: upcoming by start, then the ones already under way (latest first). */
export function e3SameDayEventsSorted(events, nowMs, limit = 2) {
  const same = (events || []).filter(event => e3IsSameDay(event.startsAtMs, nowMs));
  const upcoming = same.filter(event => event.startsAtMs >= nowMs).sort((a, b) => a.startsAtMs - b.startsAtMs);
  const begun = same.filter(event => event.startsAtMs < nowMs).sort((a, b) => b.startsAtMs - a.startsAtMs);
  return [...upcoming, ...begun].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Time-to-start energy: ring spin, ring tilt rate and the beam light pulses ramp up as the event approaches and
// peak when it opens (start time reached, then LIVE). Driven by the same startsAtMs and view clock as the countdown.
// ---------------------------------------------------------------------------
/** The ramp covers the last three hours before the start. Before that everything sits at its gentle baseline. */
export const E3_URGENCY_RAMP_MS = 3 * 3600 * 1000;
// Ring turn period in seconds at baseline and at the peak (the 2D ring and the first 3D build turned once in 24 s).
export const E3_RING_TURN_SECONDS_BASE = 20;
export const E3_RING_TURN_SECONDS_PEAK = 5.5;
// Gentle counter-tilt of adjacent rings: fixed small angle (radians, about 4 degrees), oscillation rate in rad/s.
export const E3_RING_TILT_RADIANS = .07;
export const E3_RING_TILT_RATE_BASE = .9;
export const E3_RING_TILT_RATE_PEAK = 1.6;
// Beam light pulses: how many are travelling up the beam at once, and trips per second.
export const E3_BEAM_PULSES_BASE = 2;
export const E3_BEAM_PULSES_PEAK = 7;
export const E3_BEAM_PULSE_SPEED_BASE = .2;
export const E3_BEAM_PULSE_SPEED_PEAK = .85;

/** 0 at three hours or more before the start, easing smoothly up to 1 at the start, and 1 from then on (LIVE holds the peak). */
export function e3EventUrgency(startsAtMs, nowMs, rampMs = E3_URGENCY_RAMP_MS) {
  if (!Number.isFinite(startsAtMs) || !Number.isFinite(nowMs) || !(rampMs > 0)) return 0;
  const left = startsAtMs - nowMs;
  if (left <= 0) return 1;
  if (left >= rampMs) return 0;
  const t = 1 - left / rampMs;
  return t * t * (3 - 2 * t);
}

const lerp = (a, b, t) => a + (b - a) * clamp01(t);
/** Ring turns per second (a rate, so the angle can be accumulated and never jumps when the rate changes). */
export const e3RingSpinRate = urgency => lerp(1 / E3_RING_TURN_SECONDS_BASE, 1 / E3_RING_TURN_SECONDS_PEAK, urgency);
export const e3RingTiltRate = urgency => lerp(E3_RING_TILT_RATE_BASE, E3_RING_TILT_RATE_PEAK, urgency);
export const e3BeamPulseLook = urgency => ({count: lerp(E3_BEAM_PULSES_BASE, E3_BEAM_PULSES_PEAK, urgency), speed: lerp(E3_BEAM_PULSE_SPEED_BASE, E3_BEAM_PULSE_SPEED_PEAK, urgency)});

/**
 * Staged coin to vortex spin-up. f is the stage fraction between coin (3) and vortex (4). Returns each part's own
 * 0..1 progress so the sequence reads in order: the coin flips, the rings unfold, the screen slides out, the orb
 * drops in, and a soft glitch flash marks the moment it becomes the full vortex.
 */
export const E3_SPINUP_WINDOWS = {flip: [0, .4], rings: [.18, .62], screen: [.46, .9], extras: [.6, .95], orb: [.7, 1]};
const smooth = (a, b, x) => { const t = clamp01((x - a) / Math.max(1e-6, b - a)); return t * t * (3 - 2 * t); };
export function e3SpinUp(stage) {
  const f = clamp01(stage - 3), inside = stage > 3 && stage < 4;
  const w = E3_SPINUP_WINDOWS;
  return {
    active: inside,
    f,
    // The coin turns a full revolution (angle 2 pi at f=0, 0 once it has finished), ending front-facing.
    flipAngle: inside ? Math.PI * 2 * (1 - smooth(w.flip[0], w.flip[1], f)) : 0,
    rings: smooth(w.rings[0], w.rings[1], f),
    screen: smooth(w.screen[0], w.screen[1], f),
    extras: smooth(w.extras[0], w.extras[1], f),
    // The orb falls from above into place and settles with a small bounce.
    orb: smooth(w.orb[0], w.orb[1], f),
    // Soft flash that peaks just as the vortex completes.
    flash: inside ? smooth(.8, .94, f) * (1 - smooth(.94, 1, f)) : 0,
  };
}
/** Fall height factor for the orb: 1 high above, 0 in place, with one small damped bounce at the end. */
export function e3OrbDrop(progress) {
  const p = clamp01(progress);
  if (p >= 1) return 0;
  if (p <= .75) { const t = p / .75; return 1 - t * t * (3 - 2 * t); }
  return Math.sin((p - .75) / .25 * Math.PI) * .12;
}
