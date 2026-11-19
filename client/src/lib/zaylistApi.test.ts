import assert from "node:assert/strict";
import test from "node:test";
import { pushAllowance, pushRemaining, pushTierFor } from "./zaylistApi";
import { qrMatrix } from "../components/zaylist/qr";

test("push tiers follow the Nov 19 policy", () => {
  assert.equal(pushTierFor({ isPrimaryOwner: true }), "owner");
  assert.equal(pushTierFor({ isPaidMember: true }), "paid");
  assert.equal(pushTierFor({}), "standard");
});

test("push allowances match ask 67", () => {
  assert.equal(pushAllowance("owner", "everyone").limit, Number.POSITIVE_INFINITY);
  assert.deepEqual(pushAllowance("standard", "followers"), { limit: 1, windowDays: 5 });
  assert.deepEqual(pushAllowance("standard", "rsvps"), { limit: 1, windowDays: 1 });
  assert.deepEqual(pushAllowance("paid", "followers"), { limit: 1, windowDays: 2 });
  assert.deepEqual(pushAllowance("paid", "rsvps"), { limit: 3, windowDays: 1 });
  assert.equal(pushAllowance("standard", "everyone").limit, 0);
  assert.equal(pushAllowance("paid", "everyone").limit, 0);
});

test("push remaining counts sends inside the window only", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const recent = "2026-11-19T00:00:00Z";
  const stale = "2026-11-10T12:00:00Z";
  assert.equal(pushRemaining("standard", "followers", [recent], now), 0);
  assert.equal(pushRemaining("standard", "followers", [stale], now), 1);
  assert.equal(pushRemaining("paid", "rsvps", [recent, recent], now), 1);
  assert.equal(pushRemaining("owner", "everyone", [recent, recent, recent], now), Number.POSITIVE_INFINITY);
});

test("qr matrix encodes a guest token at a plausible size", () => {
  const token = "Ab3dEf6hIjKlMnOpQrStUvWxYz012345"; // 32 chars, like a real token
  const m = qrMatrix(token);
  const n = m.length;
  assert.ok(n >= 21 && (n - 17) % 4 === 0, `size ${n}`);
  // Finder patterns: dark corners of the top-left finder.
  assert.equal(m[0][0], true);
  assert.equal(m[0][6], true);
  assert.equal(m[6][0], true);
  assert.equal(m[0][n - 1], true);
  assert.equal(m[n - 1][0], true);
  // Deterministic.
  assert.deepEqual(qrMatrix(token), m);
  assert.throws(() => qrMatrix("x".repeat(400)));
});
