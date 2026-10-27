import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {e3TransitionClip,e3TransitionFrame,e3TransitionCell,e3TransitionPath,E3_TRANSITION_STEPS} from '../client/public/mapz-map/e3-transitions.js';

const dir = new URL('../client/public/mapz-map/e3-transitions/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));

test('every adjacent step pair has a clip, in one direction or the other', () => {
  const order = ['mini', 'waypoint', 'compressed', 'coin', 'vortex', 'stack'];
  for (let i = 0; i < order.length - 1; i++) {
    const clip = e3TransitionClip(order[i], order[i + 1]);
    assert.ok(clip, `${order[i]} to ${order[i + 1]}`);
    assert.equal(clip.reverse, false);
    // Each direction has its own clip, so neither needs reversing.
    const back = e3TransitionClip(order[i + 1], order[i]);
    assert.ok(back, `${order[i + 1]} to ${order[i]}`);
    assert.equal(back.reverse, false);
  }
  assert.equal(e3TransitionClip('mini', 'stack'), null);
  assert.equal(e3TransitionClip('mini', 'mini'), null);
  assert.equal(E3_TRANSITION_STEPS.length, 6);
});

test('frame index is clamped, monotonic, and reverses for reversed clips', () => {
  assert.equal(e3TransitionFrame(24, 0), 0);
  assert.equal(e3TransitionFrame(24, 1), 23);
  assert.equal(e3TransitionFrame(24, -5), 0);
  assert.equal(e3TransitionFrame(24, 9), 23);
  let last = -1;
  for (let p = 0; p <= 1; p += .02) { const f = e3TransitionFrame(24, p); assert.ok(f >= last); last = f; }
  assert.equal(e3TransitionFrame(24, 0, true), 23);
  assert.equal(e3TransitionFrame(24, 1, true), 0);
});

test('the atlas manifest matches the files on disk and every frame has a cell', () => {
  for (const [name, clip] of Object.entries(manifest.transitions)) {
    assert.ok(existsSync(new URL(clip.file, dir)), clip.file);
    assert.equal(clip.frames, 24, name);
    assert.ok(clip.columns * clip.rows >= clip.frames, name);
    const last = e3TransitionCell(manifest, name, clip.frames - 1);
    assert.ok(last.sx + last.sw <= clip.columns * manifest.cell[0]);
    assert.ok(last.sy + last.sh <= clip.rows * manifest.cell[1]);
  }
  assert.equal(Object.keys(manifest.transitions).length, 10);
});

test('every LOD step change has a clip path, both directions, and no-op pairs have none', () => {
  const names = path => path.map(clip => clip.name);
  assert.deepEqual(names(e3TransitionPath('coin', 'vortex')), ['04-Logo-coin-to-single-vortex']);
  assert.deepEqual(names(e3TransitionPath('vortex', 'coin')), ['07-Single-vortex-to-logo-coin']);
  assert.deepEqual(names(e3TransitionPath('compressed', 'coin')), ['03-Compressed-to-logo-coin']);
  assert.deepEqual(names(e3TransitionPath('coin', 'compressed')), ['08-Logo-coin-to-compressed']);
  // Mini has no direct clip to compressed or coin, so the path walks through the waypoint.
  assert.deepEqual(names(e3TransitionPath('mini', 'compressed')), ['01-Mini-badge-to-waypoint', '02-Waypoint-to-compressed']);
  assert.deepEqual(names(e3TransitionPath('compressed', 'mini')), ['09-Compressed-to-waypoint', '10-Waypoint-to-mini-badge']);
  assert.equal(e3TransitionPath('vortex', 'mini').length, 4);
  assert.deepEqual(e3TransitionPath('coin', 'coin'), []);
  assert.deepEqual(e3TransitionPath('nope', 'coin'), []);
});
