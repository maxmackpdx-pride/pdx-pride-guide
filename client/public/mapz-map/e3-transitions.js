// E3 step transitions as phone-cheap sprite atlases. Pure functions: no DOM, no map calls.
// The atlases are cut from Codex's Blender transition clips (E3 Evolution handoff, 2026-10-27):
// 10 clips, each step in both directions, 24 frames at 12 fps, cropped and packed into one
// WebP sheet per clip. Frame index moves linearly with progress; the clips already carry the easing
// (motion is slow at both ends and peaks mid-clip).
//
// Steps: mini, waypoint, compressed, coin, vortex, stack.

export const E3_TRANSITION_STEPS = ['mini', 'waypoint', 'compressed', 'coin', 'vortex', 'stack'];

// clip name keyed by "from>to"; each clip also plays in reverse for the opposite direction.
const CLIP_BY_PAIR = {
  'mini>waypoint': '01-Mini-badge-to-waypoint',
  'waypoint>compressed': '02-Waypoint-to-compressed',
  'compressed>coin': '03-Compressed-to-logo-coin',
  'coin>vortex': '04-Logo-coin-to-single-vortex',
  'vortex>stack': '05-Single-vortex-to-double-stack',
  'stack>vortex': '06-Double-stack-to-single-vortex',
  'vortex>coin': '07-Single-vortex-to-logo-coin',
  'coin>compressed': '08-Logo-coin-to-compressed',
  'compressed>waypoint': '09-Compressed-to-waypoint',
  'waypoint>mini': '10-Waypoint-to-mini-badge',
};

/**
 * Which clip plays between two steps, and whether it plays reversed.
 * Returns {name, reverse} or null when no clip covers the pair.
 */
export function e3TransitionClip(from, to) {
  const direct = CLIP_BY_PAIR[`${from}>${to}`];
  if (direct) return {name: direct, reverse: false};
  const back = CLIP_BY_PAIR[`${to}>${from}`];
  if (back) return {name: back, reverse: true};
  return null;
}

/** Frame index for a progress value in [0, 1]. Reversed clips count down. */
export function e3TransitionFrame(frames, progress, reverse = false) {
  const t = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const index = Math.round(t * (frames - 1));
  return reverse ? frames - 1 - index : index;
}

/** Source rectangle in the atlas for one frame. */
export function e3TransitionCell(manifest, name, index) {
  const clip = manifest.transitions[name];
  if (!clip) return null;
  const [cellW, cellH] = manifest.cell;
  const col = index % clip.columns;
  const row = Math.floor(index / clip.columns);
  return {file: clip.file, sx: col * cellW, sy: row * cellH, sw: cellW, sh: cellH};
}

/**
 * Draw one transition frame. image is the loaded atlas for the clip (an HTMLImageElement or
 * ImageBitmap). The frame is drawn into (x, y, width, height), centered on the same point.
 */
export function e3DrawTransitionFrame(ctx, image, manifest, name, progress, reverse, x, y, width, height) {
  const clip = manifest.transitions[name];
  if (!clip || !image) return false;
  const cell = e3TransitionCell(manifest, name, e3TransitionFrame(clip.frames, progress, reverse));
  ctx.drawImage(image, cell.sx, cell.sy, cell.sw, cell.sh, x - width / 2, y - height / 2, width, height);
  return true;
}
