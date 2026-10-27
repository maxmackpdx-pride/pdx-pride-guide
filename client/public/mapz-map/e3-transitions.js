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

// Step graph built from the clips. Every clip is a forward edge; the clips already cover both
// directions of each step pair, so no clip needs reversing at runtime.
function stepPairs() {
  return Object.keys(CLIP_BY_PAIR).map(pair => pair.split('>'));
}

/**
 * Clip sequence from one step to another, shortest first (breadth-first over the clip graph).
 * Returns [] when from === to or the steps are not connected. Each entry is {name, reverse:false}.
 */
export function e3TransitionPath(from, to) {
  if (from === to || !E3_TRANSITION_STEPS.includes(from) || !E3_TRANSITION_STEPS.includes(to)) return [];
  const edges = stepPairs();
  const previous = new Map([[from, null]]);
  const queue = [from];
  while (queue.length && !previous.has(to)) {
    const step = queue.shift();
    for (const [a, b] of edges) {
      if (a === step && !previous.has(b)) { previous.set(b, step); queue.push(b); }
    }
  }
  if (!previous.has(to)) return [];
  const steps = [];
  for (let step = to; step !== from; step = previous.get(step)) steps.unshift(step);
  const path = [];
  let at = from;
  for (const next of steps) { path.push({name: CLIP_BY_PAIR[`${at}>${next}`], reverse: false}); at = next; }
  return path;
}

/**
 * Per-venue transition state for the live map. One instance per map.
 *   update(key, level, now, enabled)  call once per frame with each venue's current level.
 *   current(key, now)                 {name, progress, reverse} while a clip plays, else null.
 *   isPlaying()                       true while any clip is still running (keep frames coming).
 * Clips that have not finished loading return null, so the swap stays hard until they are ready.
 * `base` is the URL of the e3-transitions folder; `onReady` runs when an atlas loads.
 */
export function createE3TransitionState(manifest, {base = './e3-transitions/', onReady = () => {}} = {}) {
  const last = new Map();
  const active = new Map();
  const images = new Map();
  const secondsFor = name => (manifest.transitions[name]?.frames ?? 24) / (manifest.fps ?? 12);
  // A clip plays its green twin when the venue is a same-day vortex and the clip has one.
  const fileFor = (name, green) => {
    const clip = manifest.transitions[name];
    return green && clip.greenFile ? clip.greenFile : clip.file;
  };
  function ensureImage(name, green) {
    const file = fileFor(name, green), key = `${name}|${file}`;
    if (images.has(key) || !manifest.transitions[name]) return;
    const image = new Image();
    const entry = {image, ready: false};
    image.decoding = 'async';
    image.onload = () => { entry.ready = true; onReady(); };
    images.set(key, entry);
    image.src = `${base}${file}`;
  }
  return {
    aspect: manifest.cell[1] / manifest.cell[0],
    update(key, level, now, enabled = true, green = false) {
      const prev = last.get(key);
      last.set(key, level);
      if (!enabled || prev === undefined || prev === level) return;
      const path = e3TransitionPath(prev, level);
      if (!path.length) { active.delete(key); return; }
      path.forEach(clip => ensureImage(clip.name, green));
      active.set(key, {path, green, start: now, total: path.reduce((sum, clip) => sum + secondsFor(clip.name), 0) * 1000});
    },
    current(key, now) {
      const run = active.get(key);
      if (!run) return null;
      const elapsed = now - run.start;
      if (elapsed >= run.total) { active.delete(key); return null; }
      let remaining = elapsed / 1000;
      for (const clip of run.path) {
        const seconds = secondsFor(clip.name);
        if (remaining < seconds) {
          const entry = images.get(`${clip.name}|${fileFor(clip.name, run.green)}`);
          if (!entry?.ready) return null;
          return {name: clip.name, progress: remaining / seconds, reverse: clip.reverse, image: entry.image};
        }
        remaining -= seconds;
      }
      return null;
    },
    isPlaying() { return active.size > 0; },
    // Draw one playing clip centered at (x, y), `width` px wide. One drawImage per call.
    draw(ctx, transition, x, y, width, alpha = 1) {
      const height = width * (manifest.cell[1] / manifest.cell[0]);
      ctx.save();
      ctx.globalAlpha = alpha;
      e3DrawTransitionFrame(ctx, transition.image, manifest, transition.name, transition.progress, transition.reverse, x, y, width, height);
      ctx.restore();
    },
  };
}
