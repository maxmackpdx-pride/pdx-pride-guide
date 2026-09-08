import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { hashPassword, verifyPassword, isLegacyPasswordHash } from "./passwords";

test("extracted password helpers retain modern and legacy compatibility", () => {
  const password = "test-only password";
  const hash = hashPassword(password);
  assert.equal(isLegacyPasswordHash(hash), false);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword("wrong", hash), false);
  const legacy = crypto.createHash("sha256").update(password + "pdxpride_salt").digest("hex");
  assert.equal(isLegacyPasswordHash(legacy), true);
  assert.equal(verifyPassword(password, legacy), true);
  assert.equal(verifyPassword("wrong", legacy), false);
  assert.equal(verifyPassword(password, "$scrypt$malformed"), false);
});
