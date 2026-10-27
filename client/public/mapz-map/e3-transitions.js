// E3 step transitions as phone-cheap sprite atlases. Pure functions: no DOM, no map calls.
// The atlases are cut from Codex's Blender transition clips (E3 Evolution handoff, 2026-10-27):
// 10 clips, each step in both directions, 24 frames at 12 fps, cropped and packed into one
// WebP sheet per clip. Frame index moves linearly with progress; the clips already carry the easing
// (motion is slow at both ends and peaks mid-clip).
//
// Steps: mini, waypoint, compressed, coin, vortex, stack.

import {E3_SAME_DAY_GREEN} from './e3-lod.js';

export const E3_TRANSITION_STEPS = ['mini', 'waypoint', 'compressed', 'coin', 'vortex', 'stack'];
// Tinted clip copies are cached: at most this many live at once (about 0.5 MB each on phones).
const TINT_LIMIT = 6;

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
// Clips that show a vortex: they take the same-day green and the venue color.
export function involvesVortex(name) {
  return /vortex|stack/i.test(name);
}

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
  const tints = new Map();
  // Clip -> alpha mask, built once per clip (and once per venue color). Each pixel's brightness
  // becomes its alpha, so the black background is fully transparent and the glow draws normally
  // over the map. With a color, the clip's brightness keeps its shape and shading in that color.
  function alphaCanvas(image, color) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const g = canvas.getContext('2d', {willReadFrequently: true});
    g.drawImage(image, 0, 0);
    const data = g.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    const rgb = color ? [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16)) : null;
    for (let i = 0; i < px.length; i += 4) {
      const lum = Math.max(px[i], px[i + 1], px[i + 2]);
      if (rgb) { px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; }
      px[i + 3] = lum;
    }
    g.putImageData(data, 0, 0);
    return canvas;
  }
  function tintedCanvas(entry, color) {
    const key = `${entry.image.src}|${color}`;
    if (tints.has(key)) return tints.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = entry.canvas.width;
    canvas.height = entry.canvas.height;
    const g = canvas.getContext('2d');
    g.fillStyle = color;
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(entry.canvas, 0, 0);
    g.globalCompositeOperation = 'source-over';
    if (tints.size >= TINT_LIMIT) tints.delete(tints.keys().next().value);
    tints.set(key, canvas);
    return canvas;
  }
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
    const entry = {image, canvas: null, ready: false};
    image.decoding = 'async';
    image.onload = () => { entry.canvas = alphaCanvas(image, null); entry.ready = true; onReady(); };
    images.set(key, entry);
    image.src = `${base}${file}`;
  }
  return {
    aspect: manifest.cell[1] / manifest.cell[0],
    // green: the venue group has a same-day event. color: the venue's hologram color.
    update(key, level, now, enabled = true, green = false, color = null) {
      const prev = last.get(key);
      last.set(key, level);
      if (!enabled || prev === undefined || prev === level) return;
      const path = e3TransitionPath(prev, level);
      if (!path.length) { active.delete(key); return; }
      path.forEach(clip => ensureImage(clip.name, green && involvesVortex(clip.name) && Boolean(manifest.transitions[clip.name].greenFile)));
      active.set(key, {path, green, color, start: now, total: path.reduce((sum, clip) => sum + secondsFor(clip.name), 0) * 1000});
    },
    // The venue is drawn some other way (the 3D layer): drop any clip and remember the level, so no clip plays later.
    cancel(key, level) {
      active.delete(key);
      last.set(key, level);
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
          const twin = run.green && involvesVortex(clip.name) && Boolean(manifest.transitions[clip.name].greenFile);
          const entry = images.get(`${clip.name}|${fileFor(clip.name, twin)}`);
          if (!entry?.ready) return null;
          // Same-day vortex clips use their green twin; other clips take the venue color, built once.
          let image = entry.canvas;
          if (!twin) {
            const color = run.green && involvesVortex(clip.name) ? E3_SAME_DAY_GREEN : run.color;
            if (color) image = tintedCanvas(entry, color);
          }
          return {name: clip.name, progress: remaining / seconds, reverse: clip.reverse, image};
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
      // Reset the composite mode: earlier passes (building occlusion) can leave destination-out set.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha;
      e3DrawTransitionFrame(ctx, transition.image, manifest, transition.name, transition.progress, transition.reverse, x, y, width, height);
      ctx.restore();
    },
  };
}
