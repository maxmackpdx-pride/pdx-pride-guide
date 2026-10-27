// E3 lifecycle, venue steps 3, 3.5 and 6. Pure functions only: no DOM, no map
// calls, no imports. river-flight.js owns drawing and wires these in.
//
// Step 3   Compressed  : half-size logo puck, no countdown, one per venue.
// Step 3.5 Logo Coin   : camera closer, round venue logo coin, no countdown, one per venue.
// Step 6   Nearby      : two or more venues close on screen. Never mix. Each beam is a
//                        single straight segment from its own ground point. Holograms
//                        shift sideways to clear each other and never cross another beam.

// Same-day puck is 92px (E3c CSS). Compressed is half that.
export const E3_PUCK_PX = 92;
export const E3_COMPRESSED_SCALE = .5;
export const E3_COMPRESSED_PX = E3_PUCK_PX * E3_COMPRESSED_SCALE;
// Coin sits at the puck's full diameter, then grows slightly as the camera closes in.
export const E3_COIN_PX = E3_PUCK_PX;
export const E3_COIN_MAX_GROWTH = .18;
// Zoom thresholds are starting values. The lead should tune them against the artboards.
export const E3_COIN_ZOOM = 14.6;
export const E3_COIN_ZOOM_SPAN = 1.2;
export const E3_NEARBY_MIN_VENUES = 2;
export const E3_NEARBY_RISE_PX = 150;
export const E3_NEARBY_GAP_PX = 12;
export const E3_NEARBY_MAX_SHIFT_PX = 180;

const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * Which E3 step a venue group is in.
 * @param {{zoom?:number, hasLogo?:boolean, nearbyVenues?:number}} state
 *   nearbyVenues: count of distinct venues whose holograms overlap on screen.
 * @returns {'compressed'|'logo-coin'|'nearby'}
 */
export function e3StepFor({zoom = 13, hasLogo = false, nearbyVenues = 1} = {}) {
  if (nearbyVenues >= E3_NEARBY_MIN_VENUES) return 'nearby';
  if (hasLogo && zoom >= E3_COIN_ZOOM) return 'logo-coin';
  return 'compressed';
}

/** Step 3 plan. Logo only, never a countdown, one hologram per venue. */
export function e3CompressedPlan() {
  return {
    step: 'compressed',
    shape: 'puck',
    scale: E3_COMPRESSED_SCALE,
    diameterPx: E3_COMPRESSED_PX,
    logoOnly: true,
    countdown: false,
    maxPerVenue: 1,
  };
}

/** Step 3.5 plan. Round venue logo coin, camera closer, no countdown. */
export function e3CoinPlan({zoom = E3_COIN_ZOOM} = {}) {
  const closeness = clamp01((zoom - E3_COIN_ZOOM) / E3_COIN_ZOOM_SPAN);
  const scale = 1 + E3_COIN_MAX_GROWTH * closeness;
  return {
    step: 'logo-coin',
    shape: 'coin',
    scale,
    diameterPx: E3_COIN_PX * scale,
    logoOnly: true,
    countdown: false,
    maxPerVenue: 1,
  };
}

/** The plan for a single venue's hologram in steps 3 and 3.5. */
export function e3SinglePlan(state = {}) {
  return e3StepFor(state) === 'logo-coin' ? e3CoinPlan(state) : e3CompressedPlan();
}

/** Round logo coins and puck logos stay still when reduced motion is on. */
export function e3Bob(time, phase = 0, reduced = false) {
  return reduced ? 0 : Math.sin(time * .0016 + phase) * 4;
}

/** One straight beam: a single segment from the ground point to the hologram base. */
export function e3BeamSegment(ground, hologramCenter, halfHeight = 0) {
  return {
    from: {x: ground.x, y: ground.y},
    to: {x: hologramCenter.x, y: hologramCenter.y + halfHeight},
    straight: true,
  };
}

function rectOverlap(a, b, pad = 0) {
  return Math.abs(a.x - b.x) < a.halfWidth + b.halfWidth + pad
    && Math.abs(a.y - b.y) < a.halfHeight + b.halfHeight + pad;
}

function segmentHitsRect(seg, rect, pad = 0) {
  // Sample the segment. Good enough at hologram scale, and it stays cheap.
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = seg.from.x + (seg.to.x - seg.from.x) * t;
    const y = seg.from.y + (seg.to.y - seg.from.y) * t;
    if (Math.abs(x - rect.x) < rect.halfWidth + pad && Math.abs(y - rect.y) < rect.halfHeight + pad) return true;
  }
  return false;
}

/**
 * Step 6 placement. Each item is one venue's hologram.
 * Input item: {key, p:{x,y} ground point, halfWidth, halfHeight, attention?}
 * Output: Map key -> {x, y, beam:{from,to,straight:true}, shift, hidden}
 *
 * Rules:
 *  - a hologram always rises above its own ground point
 *  - no two holograms overlap
 *  - no beam passes through another hologram
 *  - beams are always straight segments, so nothing bends
 *  - when no clean slot exists the venue is hidden (hidden:true), never mixed
 */
export function e3NearbyPlacement(items, {width = 1200, height = 800, rise = E3_NEARBY_RISE_PX, gap = E3_NEARBY_GAP_PX, maxShift = E3_NEARBY_MAX_SHIFT_PX} = {}) {
  const ordered = items.slice().sort((a, b) => (b.p.y - a.p.y) || (b.attention ?? 0) - (a.attention ?? 0));
  const placed = [];
  const beams = [];
  const result = new Map();
  // Fixed items (vortex stacks) keep their current box and become obstacles for everyone else.
  for (const item of ordered.filter(entry => entry.fixed)) {
    const x = item.x ?? item.p.x;
    const y = item.y ?? item.p.y;
    placed.push({x, y, halfWidth: item.halfWidth, halfHeight: item.halfHeight});
    result.set(item.key, {x, y, beam: null, shift: 0, hidden: false});
  }
  for (const item of ordered) {
    if (item.fixed) continue;
    const step = item.halfWidth * 2 + gap;
    const offsets = [0];
    for (let n = 1; n * step <= maxShift + step; n++) offsets.push(n * step, -n * step);
    // Try the normal rise first, then climb in steps so a crowded column can clear.
    const levels = [];
    for (let k = 0; k < 6; k++) levels.push(rise + k * (item.halfHeight * 2 + gap));
    let chosen = null;
    let bestCost = Infinity;
    for (const lift of levels) {
      const y = item.p.y - lift - item.halfHeight;
      if (y - item.halfHeight < 20) continue;
      for (const off of offsets) {
        const candidate = {x: item.p.x + off, y, halfWidth: item.halfWidth, halfHeight: item.halfHeight};
        if (candidate.x - candidate.halfWidth < 0 || candidate.x + candidate.halfWidth > width) continue;
        const cost = Math.abs(off) + lift * 2;
        if (cost >= bestCost) continue;
        if (placed.some(other => rectOverlap(candidate, other, gap))) continue;
        const beam = e3BeamSegment(item.p, candidate, item.halfHeight);
        if (placed.some(other => segmentHitsRect(beam, other, gap))) continue;
        if (beams.some(other => segmentHitsRect(other, candidate, gap))) continue;
        bestCost = cost;
        chosen = {candidate, beam, shift: off};
      }
    }
    if (chosen) {
      placed.push(chosen.candidate);
      beams.push(chosen.beam);
      result.set(item.key, {x: chosen.candidate.x, y: chosen.candidate.y, beam: chosen.beam, shift: chosen.shift, hidden: false});
    } else {
      result.set(item.key, {x: item.p.x, y: item.p.y, beam: null, shift: 0, hidden: true});
    }
  }
  return result;
}

/**
 * Number of distinct venues whose hologram boxes touch another venue's box on screen.
 * Feed the result to e3StepFor as nearbyVenues. Items use the same shape as e3NearbyPlacement.
 */
export function e3NearbyCount(items, gap = E3_NEARBY_GAP_PX) {
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    const near = items.some((b, j) => j !== i
      && Math.abs(a.p.x - b.p.x) < a.halfWidth + b.halfWidth + gap + E3_NEARBY_MAX_SHIFT_PX / 2
      && Math.abs(a.p.y - b.p.y) < a.halfHeight + b.halfHeight + gap + E3_NEARBY_RISE_PX);
    if (near) count++;
  }
  return count;
}
