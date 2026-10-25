/**
 * Pure math for the Perspective Tunnel Hero. No React, no DOM, no allocation in
 * the per-frame path (computePose writes into a caller-owned pose object).
 *
 * Final spec (Tucker, supersedes earlier notes):
 *  - Cards LAUNCH FROM BEHIND the central globe/title: deep z, near the centre, small.
 *  - Depth-first: z advances first, lateral spread starts later.
 *  - Cards fly PAST the viewport edges and VANISH OFF SCREEN. There is intentionally
 *    no rim clamp, no max outward distance and no keep-visible fade-out anywhere here.
 */

export const TUNNEL = {
  /** CSS perspective distance in px. A card at depth z is drawn at perspective / (perspective - z). */
  perspective: 1000,
  /** Start depth: far behind the globe (draws at ~0.36x). */
  zStart: -1800,
  /** End depth: toward the viewer (draws at ~1.8x before lateral push takes it off screen). */
  zEnd: 450,
  /** Fraction of a card's own timeline in which z does all of its travel (depth-first). */
  zSpan: 0.85,
  /** Fraction of a card's own timeline that passes before lateral spread begins. */
  lateralDelay: 0.2,
  /** Starting offset (fraction of reach) so a sliver of each card peeks out around the globe at progress 0. */
  peek: 0.6,
  /** Latest a card can start, as a fraction of total scroll progress. */
  maxDelay: 0.3,
  /** Progress used for the reduced-motion arrangement. */
  stillProgress: 0.5,
  /** The globe canvas keeps the pointer (hover, vines) below this progress; above it the cards are clickable through it. */
  globeLiveUntil: 0.05,
} as const;

export type TunnelSlot = {
  /** Outward direction in radians. */
  angle: number;
  /** Outward distance as a multiple of the half-viewport. Always > 1 so cards leave the screen. */
  reach: number;
  /** Start delay on the 0..1 scroll progress. */
  delay: number;
  /** Resting z-rotation in degrees. */
  rot: number;
  /** Constant size multiplier. */
  size: number;
};

export type TunnelPose = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  opacity: number;
  /** Card-local progress 0..1 (0 = still behind the globe). */
  t: number;
};

export function createPose(): TunnelPose {
  return { x: 0, y: 0, z: TUNNEL.zStart, rotX: 0, rotY: 0, rotZ: 0, opacity: 0, t: 0 };
}

/** Small, fast, seedable PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of (seed, id) used to shuffle without depending on arrival order. */
export function hashKey(seed: number, id: string): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutQuad = (v: number) => 1 - (1 - v) * (1 - v);

/** Largest integer <= n/phi that is coprime with n, so a stride walk visits every slot once. */
function launchStride(n: number): number {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  for (let s = Math.max(1, Math.round(n * 0.6180339887)); s > 0; s--) if (gcd(s, n) === 1) return s;
  return 1;
}

/**
 * Directions are exactly evenly spaced around the globe (small jitter, a fraction of one slot, so no
 * two cards can clump and no side stays empty). Launch order walks the slots with a golden-ratio stride,
 * so consecutive launches land on far-apart sides and the stagger is evenly spaced rather than random.
 * Delays are spread 0..maxDelay in launch order, so every card has at least (1 - maxDelay) of the scroll.
 */
export function makeSlots(count: number, seed: number): TunnelSlot[] {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const turn = (Math.PI * 2) / Math.max(1, count);
  const spin = rand() * Math.PI * 2;
  const stride = launchStride(count);
  const slots: TunnelSlot[] = [];
  for (let i = 0; i < count; i++) {
    const order = (i * stride) % count; // launch rank of the slot at angle index i
    slots.push({
      angle: spin + i * turn + (rand() - 0.5) * turn * 0.3,
      reach: 1.2 + rand() * 0.5,
      delay: count > 1 ? TUNNEL.maxDelay * (order / (count - 1)) : 0,
      rot: (rand() - 0.5) * 14,
      size: 0.92 + rand() * 0.2,
    });
  }
  return slots;
}

/**
 * Pose of one card at scroll progress `p` (0..1). halfW/halfH are the stage half-size in px.
 * Depth first: z eases out over zSpan of the card's timeline; lateral travel only starts after
 * lateralDelay and accelerates (ease-in) so cards end far beyond the viewport edge.
 */
export function computePose(out: TunnelPose, slot: TunnelSlot, p: number, halfW: number, halfH: number): TunnelPose {
  const t = clamp01((p - slot.delay) / (1 - slot.delay));
  const zT = easeOutQuad(clamp01(t / TUNNEL.zSpan));
  const lT = clamp01((t - TUNNEL.lateralDelay) / (1 - TUNNEL.lateralDelay));
  const lateral = TUNNEL.peek + (1 - TUNNEL.peek) * lT * lT * (1.35 - 0.35 * lT);
  const cos = Math.cos(slot.angle);
  const sin = Math.sin(slot.angle);
  out.t = t;
  out.z = TUNNEL.zStart + (TUNNEL.zEnd - TUNNEL.zStart) * zT;
  out.x = cos * halfW * slot.reach * lateral;
  out.y = sin * halfH * slot.reach * lateral;
  out.rotZ = slot.rot * (1 - 0.7 * zT);
  out.rotY = cos * 16 * lT;
  out.rotX = -sin * 12 * lT;
  // Entrance only: cards fade up as they clear the globe. There is no exit fade.
  out.opacity = 0.35 + 0.65 * clamp01(t * 9);
  return out;
}

/** Projected screen-space centre offset of a pose (px), for tests and screenshots. */
export function projectX(pose: TunnelPose): number {
  return (pose.x * TUNNEL.perspective) / (TUNNEL.perspective - pose.z);
}
export function projectY(pose: TunnelPose): number {
  return (pose.y * TUNNEL.perspective) / (TUNNEL.perspective - pose.z);
}
