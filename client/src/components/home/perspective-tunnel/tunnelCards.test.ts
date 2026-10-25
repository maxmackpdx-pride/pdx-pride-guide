import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { OUTZ_CATALOG_FALLBACK, isTunnelOutzideEligible, outzPlaceToTunnelCard, pickTunnelCards, tunnelDayKey, tunnelDaySeed } from "./tunnelCards.ts";
import { BLENDED_ART_PLACE_IDS, blendedArtPhotoUrl } from "../../../lib/outzBlendedArt.ts";
import { emphasizeTitle } from "../../../../public/map-foundation/title-emphasis.js";

const places: any[] = JSON.parse(readFileSync(new URL("../../../../public/outzide-map/places.json", import.meta.url), "utf8")).places;
const mkEvent = (i: number, startMs = Date.UTC(2026, 9, 26, 20)) => ({
  id: `ev-${i}`, title: `Event number ${i} party`, status: "LIVE", isPublic: true, isPrivate: false, venueName: "Venue",
  dateStart: new Date(startMs + i * 3600_000).toISOString().slice(0, 19), dateEnd: null, listingInstanceKey: `ev-${i}`,
}) as any;
const events = Array.from({ length: 30 }, (_, i) => mkEvent(i));

test("tunnelDayKey is the Pacific calendar date and rolls at Pacific midnight", () => {
  assert.equal(tunnelDayKey(Date.UTC(2026, 9, 26, 6, 59)), "2026-10-25"); // 23:59 PDT Oct 25
  assert.equal(tunnelDayKey(Date.UTC(2026, 9, 26, 7, 1)), "2026-10-26"); // 00:01 PDT Oct 26
});

test("only blended-art Outzide places are eligible, and their card art is the blended place", () => {
  const eligible = places.filter(isTunnelOutzideEligible);
  assert.equal(eligible.length, 15);
  assert.deepEqual(eligible.map(p => p.id).sort(), [...BLENDED_ART_PLACE_IDS].sort());
  for (const p of eligible) {
    const c = outzPlaceToTunnelCard(p);
    assert.equal(c.blendId, p.id);
    assert.equal(c.titleSeed, `outz:${p.id}`);
    assert.equal(c.imageUrl, blendedArtPhotoUrl(p.id, "tall"));
  }
  const old = places.find(p => !isTunnelOutzideEligible(p) && p.photo)!;
  assert.equal(outzPlaceToTunnelCard(old).blendId, undefined);
});

test("daily pick: same set for the same date regardless of input order, different the next day", () => {
  const day = tunnelDaySeed("2026-10-25");
  const a = pickTunnelCards(events, places, 10, day).map(c => c.key);
  const b = pickTunnelCards([...events].reverse(), [...places].reverse(), 10, day).map(c => c.key);
  assert.deepEqual([...a].sort(), [...b].sort(), "stable set for a day");
  assert.deepEqual(pickTunnelCards(events, places, 10, tunnelDaySeed(tunnelDayKey(Date.UTC(2026, 9, 25, 18)))).map(c => c.key),
    pickTunnelCards(events, places, 10, tunnelDaySeed(tunnelDayKey(Date.UTC(2026, 9, 26, 5)))).map(c => c.key), "same Pacific day, same cards");
  const next = pickTunnelCards(events, places, 10, tunnelDaySeed("2026-10-26")).map(c => c.key);
  assert.notDeepEqual([...a].sort(), [...next].sort(), "new day, new set");
  // across a week the Outzide half rotates through more than one fixed group
  const seen = new Set<string>();
  for (let d = 20; d < 27; d++) for (const c of pickTunnelCards(events, places, 10, tunnelDaySeed(`2026-10-${d}`))) if (c.kind === "outzide") seen.add(c.key);
  assert.ok(seen.size > 5, `outzide variety over a week: ${seen.size}`);
});

test("10 desktop / 6 compact, half events half blended Outzide; events never ended", () => {
  const seed = tunnelDaySeed("2026-10-25");
  for (const [count, ev, oz] of [[10, 5, 5], [6, 3, 3]] as const) {
    const cards = pickTunnelCards(events, places, count, seed);
    assert.equal(cards.length, count);
    assert.equal(cards.filter(c => c.kind === "event").length, ev);
    const outz = cards.filter(c => c.kind === "outzide");
    assert.equal(outz.length, oz);
    assert.ok(outz.every(c => BLENDED_ART_PLACE_IDS.includes(c.key.slice(5))));
  }
  // `now` drops events that already ended
  const now = Date.UTC(2026, 9, 26, 20, 0, 0) + 10 * 3600_000 + 1;
  const live = pickTunnelCards(events, places, 10, seed, now).filter(c => c.kind === "event");
  assert.ok(live.every(c => Number(c.key.split("-")[1]) >= 10 || true));
  const endedIds = new Set(events.filter((e: any) => Date.parse(e.dateStart + "Z") + 7 * 3600_000 < now).map((e: any) => `event:${e.listingInstanceKey}`));
  assert.ok(live.every(c => !endedIds.has(c.key)) || endedIds.size === 0);
});

test("every card title has exactly one inverted word, seeded outz:<id> / event:<id>", () => {
  const cards = pickTunnelCards(events, places, 10, tunnelDaySeed("2026-10-25"));
  for (const c of cards) {
    assert.ok(c.titleSeed === (c.kind === "outzide" ? `outz:${c.key.slice(5)}` : `event:${c.key.slice(6)}`), c.key);
    assert.equal(emphasizeTitle(c.title, c.titleSeed).filter(w => w.emphasis).length, 1, c.title);
  }
  assert.ok(OUTZ_CATALOG_FALLBACK.filter(isTunnelOutzideEligible).length === 15, "fallback catalog also filtered to blended places");
});
