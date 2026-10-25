import { strict as assert } from "node:assert";
import { test } from "node:test";
import { TUNNEL, computePose, createPose, hashKey, makeSlots, projectX, projectY } from "./tunnelMath.ts";

const W = 600, H = 400;
const pose = createPose();

test("p=0: every card starts deep, behind the globe, near the globe, small", () => {
  for (const s of makeSlots(22, 7)) {
    computePose(pose, s, 0, W, H);
    assert.equal(pose.z, TUNNEL.zStart);
    assert.ok(Math.hypot(projectX(pose), projectY(pose)) < 0.32 * Math.hypot(W, H));
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
  for (const s of makeSlots(22, 7)) {
    computePose(pose, s, 1, W, H);
    assert.ok(Math.abs(projectX(pose)) > W * 1.5 || Math.abs(projectY(pose)) > H * 1.5, `${projectX(pose)},${projectY(pose)}`);
  }
});

test("outward travel is monotonic in progress: no rim clamp, no turn-back", () => {
  for (const s of makeSlots(22, 11)) {
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
  for (const s of makeSlots(22, 3)) {
    computePose(pose, s, 1, W, H);
    assert.equal(pose.opacity, 1);
  }
});

test("hashKey/seed: stable per (seed,id), different across seeds", () => {
  assert.equal(hashKey(1, "a"), hashKey(1, "a"));
  assert.notEqual(hashKey(1, "a"), hashKey(2, "a"));
});
