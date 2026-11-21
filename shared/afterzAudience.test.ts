import assert from "node:assert/strict";
import test from "node:test";
import {
  AFTERZ_AUDIENCES,
  AFTERZ_BLAST_RADIUS_OPTIONS_M,
  DEFAULT_EVENT_RADIUS_M,
  afterzAudienceAllows,
  afterzRequestAutoAccepts,
  formatBlastRadius,
  parseAfterzAudience,
  parseAfterzRadiusM,
} from "./afterzAudience";

test("Afterz audience has four blast options and open join auto-accepts", () => {
  assert.deepEqual(AFTERZ_AUDIENCES.map(option => option.value), ["open", "request", "friends", "fof"]);
  assert.equal(parseAfterzAudience("open"), "open");
  assert.equal(parseAfterzAudience("request"), "request");
  assert.equal(parseAfterzAudience("nope"), null);
  assert.equal(afterzRequestAutoAccepts("open"), true);
  assert.equal(afterzRequestAutoAccepts("request"), false);
  assert.equal(afterzRequestAutoAccepts("friends"), false);
  assert.equal(afterzAudienceAllows("friends", "everybody"), false);
  assert.equal(afterzAudienceAllows("friends", "friend"), true);
  assert.equal(afterzAudienceAllows("fof", "fof"), true);
  assert.equal(afterzAudienceAllows("fof", "everybody"), false);
  assert.equal(afterzAudienceAllows("request", "everybody"), true);
});

test("blast radius defaults to the normal event radius and only accepts listed sizes", () => {
  assert.equal(DEFAULT_EVENT_RADIUS_M, 800);
  assert.ok((AFTERZ_BLAST_RADIUS_OPTIONS_M as readonly number[]).includes(DEFAULT_EVENT_RADIUS_M));
  assert.equal(parseAfterzRadiusM(undefined), 800);
  assert.equal(parseAfterzRadiusM(1600), 1600);
  assert.equal(parseAfterzRadiusM(1234), null);
  assert.equal(formatBlastRadius(800), "0.5 mi");
  assert.equal(formatBlastRadius(400), "0.25 mi");
  assert.equal(formatBlastRadius(1600), "1 mi");
});
