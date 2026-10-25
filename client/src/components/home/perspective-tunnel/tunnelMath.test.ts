import { strict as assert } from "node:assert";
import { test } from "node:test";
import { TUNNEL, computePose, createPose, hashKey, makeSlots, projectX, projectY } from "./tunnelMath.ts";

const W = 600, H = 400; // desktop 1280x800 stage half-size
const DESKTOP = 10, COMPACT = 6; // component defaults (5+5 and 3+3)
const VIEWS = [{ n: DESKTOP, w: 640, h: 400 }, { n: COMPACT, w: 195, h: 422 }];
const SEEDS = [1, 7, 42, 99, 1234, 98765];
const pose = createPose();

test("p=0: every card starts deep, behind the globe, near the globe, small", () => {
  for (const s of makeSlots(DESKTOP, 7)) {
    computePose(pose, s, 0, W, H);
    assert.equal(pose.z, TUNNEL.zStart);
    assert.ok(Math.hypot(projectX(pose), projectY(pose)) < 0.45 * Math.hypot(W, H));
    assert.ok(TUNNEL.perspective / (TUNNEL.perspective - pose.z) < 0.4);
  }
});

test("depth-first: by the time lateral spread is small, z has already advanced a lot", () => {
  const s = { angle: 0, reach: 1.5, delay: 0, rot: 0, size: 1 };
  computePose(pose, s, 0.25, W, H);
  const zFrac = (pose.z - TUNNEL.zStart) / (TUNNEL.zEnd - TUNNEL.zStart);
  const latFrac = pose.x / (W * s.reach);
  assert.ok(zFrac > 0.5, `zFrac ${zFrac}`);
  assert.ok(latFrac < TUNNEL.peek + 0.08, `latFrac ${latFrac}`);
});

test("p=1: every card is far past the viewport edge (vanished), with no clamp", () => {
  for (const s of makeSlots(DESKTOP, 7)) {
    computePose(pose, s, 1, W, H);
    assert.ok(Math.abs(projectX(pose)) > W * 1.5 || Math.abs(projectY(pose)) > H * 1.5, `${projectX(pose)},${projectY(pose)}`);
  }
});

test("outward travel is monotonic in progress: no rim clamp, no turn-back", () => {
  for (const s of makeSlots(DESKTOP, 11)) {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      computePose(pose, s, Math.min(1, p), W, H);
      const r = Math.hypot(projectX(pose), projectY(pose));
      assert.ok(r >= prev - 1e-6);
      prev = r;
    }
  }
});

test("opacity never fades out as cards leave", () => {
  for (const s of makeSlots(DESKTOP, 3)) {
    computePose(pose, s, 1, W, H);
    assert.equal(pose.opacity, 1);
  }
});

test("hashKey/seed: stable per (seed,id), different across seeds", () => {
  assert.equal(hashKey(1, "a"), hashKey(1, "a"));
  assert.notEqual(hashKey(1, "a"), hashKey(2, "a"));
});

test("evenly spread: no empty side, no clumping, for every seed and both counts", () => {
  for (const { n } of VIEWS) for (const seed of SEEDS) {
    const turn = (Math.PI * 2) / n;
    const a = makeSlots(n, seed).map(s => ((s.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((x, y) => x - y);
    for (let i = 0; i < n; i++) {
      const gap = (a[(i + 1) % n] - a[i] + Math.PI * 2) % (Math.PI * 2);
      assert.ok(gap > 0.69 * turn && gap < 1.31 * turn, `n=${n} seed=${seed} gap ${gap / turn}`);
    }
  }
});

test("stagger: evenly spaced delays in 0..maxDelay; consecutive launches are on far-apart sides", () => {
  for (const { n } of VIEWS) for (const seed of SEEDS) {
    const slots = makeSlots(n, seed);
    const byLaunch = [...slots].sort((x, y) => x.delay - y.delay);
    assert.equal(byLaunch[0].delay, 0);
    assert.ok(Math.abs(byLaunch[n - 1].delay - TUNNEL.maxDelay) < 1e-9);
    for (let i = 1; i < n; i++) {
      assert.ok(Math.abs(byLaunch[i].delay - byLaunch[i - 1].delay - TUNNEL.maxDelay / (n - 1)) < 1e-9);
      const d = Math.abs(((byLaunch[i].angle - byLaunch[i - 1].angle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      assert.ok(Math.PI - d > Math.PI / 4, `n=${n} consecutive launches only ${(Math.PI - d).toFixed(2)} rad apart`);
    }
  }
});

test("every card is on screen for a meaningful part of the scroll and all are gone at p=1 (both viewports)", () => {
  for (const { n, w, h } of VIEWS) for (const seed of SEEDS) {
    const slots = makeSlots(n, seed);
    for (const s of slots) {
      let visible = 0, steps = 0;
      for (let p = 0; p <= 1.0001; p += 0.01) {
        steps++;
        computePose(pose, s, Math.min(1, p), w, h);
        if (pose.t > 0 && Math.abs(projectX(pose)) < w && Math.abs(projectY(pose)) < h) visible++;
      }
      assert.ok(visible / steps >= 0.3, `n=${n} seed=${seed} visible only ${(visible / steps).toFixed(2)}`);
      computePose(pose, s, 1, w, h);
      assert.ok(Math.abs(projectX(pose)) > w * 1.5 || Math.abs(projectY(pose)) > h * 1.5, `n=${n} seed=${seed} not gone at p=1`);
    }
  }
});

test("at any mid-scroll progress the on-screen cards are not all on one side", () => {
  for (const { n, w, h } of VIEWS) for (const seed of SEEDS) {
    const slots = makeSlots(n, seed);
    for (const p of [0.35, 0.5, 0.65]) {
      let left = 0, right = 0, up = 0, down = 0;
      for (const s of slots) {
        computePose(pose, s, p, w, h);
        const x = projectX(pose), y = projectY(pose);
        if (pose.t <= 0 || Math.abs(x) > w * 1.2 || Math.abs(y) > h * 1.2) continue;
        if (x < 0) left++; else right++;
        if (y < 0) up++; else down++;
      }
      assert.ok(left >= 1 && right >= 1 && up >= 1 && down >= 1 || n < 8 && left + right >= 2, `n=${n} seed=${seed} p=${p} L${left} R${right} U${up} D${down}`);
    }
  }
});
