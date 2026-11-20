import assert from "node:assert/strict";
import test from "node:test";
import jsQR from "jsqr";
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

test("a second QR implementation decodes the actual guest token", () => {
  const token = "Ab3dEf6hIjKlMnOpQrStUvWxYz012345";
  const modules = qrMatrix(token);
  const side = (modules.length + 8) * 5;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (modules[Math.floor(y / 5) - 4]?.[Math.floor(x / 5) - 4]) {
        const offset = (y * side + x) * 4;
        pixels.fill(0, offset, offset + 3);
      }
    }
  }
  assert.equal(jsQR(pixels, side, side)?.data, token);
});
