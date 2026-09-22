import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { legacyOutzRedirect } from "./outzRoutes";
import { outzPlaceHref } from "./outz";
import { SHARE_CARD_FILES, shareCardDimensions, shareCardKeyForPath, shareCardUrl } from "./shareCards";

test("old Outzide links retain destinations, queries and fragments", () => {
  for (const suffix of ["", "/", "/rooster-rock", "/sauvie-island?shore=carpool#plans", "?place=usfs%2F123&signup=1", "/silver-falls--silver-falls#outz-wall-heading"]) {
    assert.equal(legacyOutzRedirect(`/outz${suffix}`), `/outzide${suffix}`);
  }
  assert.equal(legacyOutzRedirect("/OUTZ/Rooster-Rock?place=AbC"), "/outzide/Rooster-Rock?place=AbC");
});

test("Outzide redirects cannot catch the new route, assets or APIs", () => {
  for (const path of ["/outzide", "/outzide/rooster-rock", "/outzide-map/index.html", "/api/outz", "/api/outz/checkins", "/motifs/outz/grit.svg", "/outz-other", "https://example.test/outz"]) {
    assert.equal(legacyOutzRedirect(path), null, path);
  }
});

test("destination links use the new route with existing stable slugs", () => {
  assert.equal(outzPlaceHref({ id: "silver-falls", name: "Silver Falls" }), "/outzide/silver-falls--silver-falls");
});

test("Outzide and every destination share the approved art without changing other boards", () => {
  for (const path of ["/outzide", "/outzide/", "/outzide?place=silver-falls", "/outzide/rooster-rock", "/outzide/sauvie-island", "/outzide/silver-falls--silver-falls"]) {
    assert.equal(shareCardKeyForPath(path), "outzide", path);
  }
  assert.equal(shareCardKeyForPath("/"), "home");
  assert.equal(shareCardKeyForPath("/events"), "events");
  assert.equal(shareCardKeyForPath("/events/123/example"), null);
  assert.equal(shareCardKeyForPath("/outzide-other"), null);
});

test("Outzide metadata reports the actual artwork dimensions", () => {
  const image = readFileSync(new URL(`../client/public/og/${SHARE_CARD_FILES.outzide}`, import.meta.url));
  assert.equal(image.subarray(1, 4).toString(), "PNG");
  assert.deepEqual(shareCardDimensions(shareCardUrl("outzide")), { width: image.readUInt32BE(16), height: image.readUInt32BE(20) });
  assert.deepEqual(shareCardDimensions(shareCardUrl("events")), { width: 1200, height: 630 });
});
