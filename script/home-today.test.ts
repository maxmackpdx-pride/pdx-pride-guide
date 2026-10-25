import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dailyPicks, outzideDailyPicks, todaysUpcomingEvents } from "../client/src/lib/homeToday";
import { BLENDED_ART_PLACE_IDS, BLEND_PHOTO_FILES, blendedArtPhotoUrl, blendedArtPlaces, isBlendedArtPlace, splitBlendedArt } from "../client/src/lib/outzBlendedArt";

const publicDir = new URL("../client/public/", import.meta.url);
const places: { id: string; kind: string; photo?: unknown }[] = JSON.parse(readFileSync(new URL("outzide-map/places.json", publicDir), "utf8")).places;
const engine = readFileSync(new URL("outzide-map/assets/blend-art.js", publicDir), "utf8");

const rows = Array.from({ length: 40 }, (_, i) => ({ id: `row-${i}` }));

test("daily picks are stable within a Pacific day and rotate on the next", () => {
  const a = dailyPicks(rows, "2026-10-25", r => r.id).map(r => r.id);
  assert.deepEqual(a, dailyPicks([...rows].reverse(), "2026-10-25", r => r.id).map(r => r.id));
  assert.equal(a.length, 3);
  assert.notDeepEqual(a, dailyPicks(rows, "2026-10-26", r => r.id).map(r => r.id));
});

test("today's events drop off once they end, use the Pacific day, and sort by start", () => {
  // 2026-10-25 14:00 Pacific (PDT, UTC-7)
  const now = Date.parse("2026-10-25T21:00:00Z");
  const events = [
    { id: "late", dateStart: "2026-10-25T20:00:00", dateEnd: "2026-10-26T02:00:00" },
    { id: "ended", dateStart: "2026-10-25T10:00:00", dateEnd: "2026-10-25T12:00:00" },
    { id: "now", dateStart: "2026-10-25T13:00:00", dateEnd: "2026-10-25T16:00:00" },
    { id: "tomorrow", dateStart: "2026-10-26T09:00:00", dateEnd: "2026-10-26T11:00:00" },
    // 00:30 UTC on the 26th is 17:30 Pacific on the 25th: still today in Portland.
    { id: "utc-rollover", dateStart: "2026-10-26T00:30:00Z", dateEnd: "2026-10-26T03:00:00Z" },
  ];
  assert.deepEqual(todaysUpcomingEvents(events, now, "2026-10-25").map(e => e.id), ["now", "utc-rollover", "late"]);
  assert.deepEqual(todaysUpcomingEvents(events, now + 3 * 3600_000, "2026-10-25").map(e => e.id), ["utc-rollover", "late"]);
});

test("blended art registry matches the blend engine recipes and its photo assets", () => {
  const keys = engine.match(/const BLEND_KEYS=(\{.*?\});\n/s)![1];
  const photos = engine.match(/const BLEND_PHOTO=(\{.*?\});\n/s)![1];
  const toObj = (src: string) => new Function(`return (${src})`)() as Record<string, any>;
  const blendKeys = toObj(keys), blendPhoto = toObj(photos);
  const expected: Record<string, Record<string, string>> = {};
  for (const [id, variants] of Object.entries<Record<string, string>>(blendKeys)) {
    expected[id] = Object.fromEntries(Object.entries(variants).map(([variant, key]) => [variant, blendPhoto[key]]));
  }
  assert.deepEqual(BLEND_PHOTO_FILES, expected);
  assert.deepEqual([...BLENDED_ART_PLACE_IDS].sort(), Object.keys(blendKeys).sort());
  for (const id of BLENDED_ART_PLACE_IDS) {
    assert.ok(existsSync(new URL(`.${blendedArtPhotoUrl(id)!.replace("/outzide-map/", "/outzide-map/")}`, new URL("./", publicDir))), id);
  }
});

test("every registry place passes the Xerox cinematic style check, and no qualifying place is missing", async () => {
  const engineMod = await import("../client/public/outzide-map/assets/blend-art.js") as any;
  const { BLEND_PLACES } = await import("../client/src/lib/outzBlend");
  for (const [id, variants] of Object.entries(BLEND_PLACES)) {
    for (const v of variants) {
      const c = engineMod.checkBlend(id, v);
      assert.ok(c.recipe && c.photo, `${id}/${v}: recipe + halftone photo`);
      assert.ok(c.cutouts >= 5, `${id}/${v}: photo cutouts ${c.cutouts}`);
      assert.ok(c.contour > 0, `${id}/${v}: orange contour source`);
      assert.ok(c.route, `${id}/${v}: route overlay`);
      assert.equal(engineMod.hasBlend(id, v), true, `${id}/${v}: engine accepts it`);
    }
  }
  assert.deepEqual(engineMod.blendPlaces().sort(), Object.keys(BLEND_PLACES).sort());
  // The one variant that fails the check is not registered and is refused by the engine.
  assert.equal(engineMod.blendQualifies("usfs-7682.004621", "wide"), false);
  assert.equal(engineMod.hasBlend("usfs-7682.004621", "wide"), false);
  // Rooster Rock's wide art now has its route overlay.
  assert.equal(engineMod.checkBlend("rooster-rock", "wide").route, true);
});

test("only places with blended art qualify; older photo and motif places are excluded", () => {
  const blended = blendedArtPlaces(places);
  assert.equal(places.length, 385);
  assert.equal(blended.length, 15);
  // Places with a layered v3 photo but no recipe are the older style.
  const olderWithPhoto = places.filter(p => p.photo && !isBlendedArtPlace(p));
  assert.ok(olderWithPhoto.length > 100);
  assert.equal(isBlendedArtPlace("forest-park"), false);
  assert.equal(isBlendedArtPlace("silver-falls"), true);
  assert.equal(isBlendedArtPlace("silver-falls", "wide"), false);
  assert.equal(isBlendedArtPlace({ id: "rooster-rock" }, "wide"), true);
  assert.deepEqual(blendedArtPlaces(null), []);
  assert.equal(blendedArtPhotoUrl("bc-garibaldi", "wide"), "/outzide-map/assets/photos/blend/hero.webp");
  assert.equal(blendedArtPhotoUrl("forest-park"), null);
});

test("Outzide daily picks come only from blended places, rotate by date, and never fall back to old art", () => {
  const dates = ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"];
  const seen = new Set<string>();
  const sets = dates.map(date => {
    const picks = outzideDailyPicks(places, date);
    assert.equal(picks.length, 3);
    for (const pick of picks) { assert.ok(isBlendedArtPlace(pick), pick.id); seen.add(pick.id); }
    return picks.map(p => p.id).join();
  });
  assert.ok(new Set(sets).size > 1, "picks rotate");
  assert.ok(seen.size > 3);
  assert.deepEqual(outzideDailyPicks(places, "2026-10-25").map(p => p.id), outzideDailyPicks([...places].reverse(), "2026-10-25").map(p => p.id));
  // Nothing qualifies, or catalog not loaded: empty, not older art.
  assert.deepEqual(outzideDailyPicks(places.filter(p => !isBlendedArtPlace(p)), "2026-10-25"), []);
  assert.deepEqual(outzideDailyPicks(undefined, "2026-10-25"), []);
  // A pool smaller than three returns what it has.
  assert.equal(outzideDailyPicks(places.filter(p => p.id === "silver-falls"), "2026-10-25").length, 1);
});

test("places page split: blended places feature on top, the rest stay small, order and filters preserved", () => {
  const all = places.slice().sort((a, b) => (a as any).name.localeCompare((b as any).name));
  const { featured, rest } = splitBlendedArt(all);
  assert.equal(featured.length, 15);
  assert.equal(featured.length + rest.length, all.length);
  assert.ok(featured.every(p => isBlendedArtPlace(p)) && rest.every(p => !isBlendedArtPlace(p)));
  assert.deepEqual(featured.map(p => p.id), all.filter(p => isBlendedArtPlace(p)).map(p => p.id), "order preserved");
  // a narrowing filter (name search) keeps matching blended places in the featured list and drops the rest
  const falls = all.filter(p => /falls/i.test((p as any).name));
  const s = splitBlendedArt(falls);
  assert.ok(s.featured.length > 0 && s.featured.length < 15 && s.rest.length > 0);
  assert.ok(s.featured.every(p => /falls/i.test((p as any).name)));
  assert.deepEqual(splitBlendedArt([]), { featured: [], rest: [] });
  assert.equal(splitBlendedArt(rest).featured.length, 0, "no blended places -> no featured section");
});
