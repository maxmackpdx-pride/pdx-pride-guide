import test from "node:test";
import assert from "node:assert/strict";
import { buildWaypoints, resourceClosed, hoursSayClosed, venueClosed, validatePlacement } from "./boardMapPlacement";
import { RESOURCE_MAP_ENTRIES } from "../client/src/lib/resourceMap";
import { RESOURCE_CATEGORIES } from "../client/src/lib/resourcesData";
import { NEEDZ_ACCENT } from "../client/src/lib/needzAccent";

const loc = (lat: number, lng: number, name = "Main", address = "1 A St") => ({ name, address, lat, lng });
const resources = [
  { org: { name: "Clinic", desc: "Care." }, categories: [{ id: "health" }, { id: "legal" }], locations: [loc(45.5, -122.6)] },
  { org: { name: "Coin Co-op", hours: "Mon–Fri 9–5" }, categories: [{ id: "money" }], locations: [loc(45.51, -122.61)] },
  { org: { name: "Gone Org", desc: "Gone Org has closed. See other groups." }, categories: [{ id: "community" }], locations: [loc(45.52, -122.62)] },
  { org: { name: "Winter Pantry", locations: [{ name: "Winter Pantry", address: "5 B St", hours: "Closed for the season" }, { name: "Open Site", address: "6 C St", hours: "Mon 9–5" }] }, categories: [{ id: "safety" }],
    locations: [loc(45.53, -122.63, "Winter Pantry", "5 B St"), loc(45.54, -122.64, "Open Site", "6 C St")] },
  { org: { name: "Mystery" }, categories: [{ id: "not-a-real-category" }], locations: [loc(45.55, -122.65)] },
  { org: { name: "NoCats" }, categories: [], locations: [loc(45.56, -122.66)] },
];
const businesses = [
  { id: 7, name: "Hawks PDX", active: true, status: "OPEN", hours: "Daily 4pm–2am", type: "bar", address: "1 Main", lat: 45.52, lng: -122.67 },
  { id: 8, name: "Pool House", active: true, status: "OPEN", hours: "Closed for the season", type: "venue", address: "2 Main", lat: 45.53, lng: -122.68 },
  { id: 9, name: "Old Bar", active: true, status: "CLOSED", hours: null, type: "bar", address: "3 Main", lat: 45.54, lng: -122.69 },
  { id: 10, name: "Hidden", active: false, status: "OPEN", hours: null, type: "bar", address: "4 Main", lat: 45.55, lng: -122.7 },
];
const events = [
  { lat: 45.52, lng: -122.67, title: "Bi Sundays", venueName: "  HAWKS pdx ", isPublic: true },
  { lat: 45.6, lng: -122.7, title: "Pop-up", venueName: "Unknown Hall", isPublic: true },
  { lat: 45.6, lng: -122.7, title: "Private", venueName: "Hawks PDX", isPublic: true, isPrivate: true },
  { lat: NaN, lng: -122.7, title: "Bad coords", venueName: "Hawks PDX", isPublic: true },
];
const out = buildWaypoints({ resources: resources as any, businesses: businesses as any, events });
const by = (name: string) => out.filter(w => w.name === name);

test("resources carry category id (first catalog category) and its accent token", () => {
  const clinic = by("Clinic")[0];
  assert.equal(clinic.category, "health");
  assert.equal(clinic.secondary, NEEDZ_ACCENT.health);
  assert.equal(clinic.kind, "resource");
  assert.equal(by("Coin Co-op")[0].secondary, "var(--green-acid)");
  assert.equal(by("Winter Pantry")[0].category, "safety");
});
test("unmappable or missing categories omit category and secondary instead of guessing", () => {
  for (const name of ["Mystery", "NoCats"]) { const w = by(name)[0]; assert.ok(w); assert.equal("category" in w, false); assert.equal("secondary" in w, false); }
});
test("closed comes only from real records; absent otherwise", () => {
  assert.equal(by("Clinic")[0].closed, undefined);
  assert.equal("closed" in by("Clinic")[0], false);
  assert.equal(by("Gone Org")[0].closed, true);
  assert.equal(out.find(w => w.lat === 45.53 && w.name === "Winter Pantry")!.closed, true, "location hours say closed for the season");
  assert.equal(out.find(w => w.lat === 45.54 && w.name === "Winter Pantry")!.closed, undefined, "sibling location stays open");
  assert.equal(by("Hawks PDX").find(w => w.kind === "venue")!.closed, undefined);
  assert.equal(by("Pool House")[0].closed, true);
  assert.equal(by("Old Bar")[0].closed, true);
});
test("hours parser flags closed/seasonal but not partial-day closures", () => {
  for (const h of ["Closed", "Temporarily closed", "closed for the season", "Seasonally closed", "Closed until spring", "Closed for winter."]) assert.equal(hoursSayClosed(h), true, h);
  for (const h of ["Mon–Thu 10am–4pm · Fri closed", "Closed noon–1pm daily", "Closed Mondays", "", null, undefined, "Daily 9–5"]) assert.equal(hoursSayClosed(h as any), false, String(h));
  assert.equal(venueClosed({ status: "closed" }), true);
});
test("event waypoints carry the venue record id; inactive/private/invalid events handled as before", () => {
  const ev = out.filter(w => w.kind === "event");
  assert.equal(ev.length, 2);
  assert.equal(ev[0].venueId, 7);
  assert.equal(ev[1].venueId, undefined);
  assert.equal("venueId" in ev[1], false);
  assert.equal(out.some(w => w.name === "Hidden"), false);
});
test("original fields are unchanged and extras are additive", () => {
  const hawks = by("Hawks PDX").find(w => w.kind === "venue")!;
  assert.equal(hawks.venueId, 7); assert.equal(hawks.lat, 45.52); assert.equal(hawks.lng, -122.67);
  for (const w of out) { assert.equal(typeof w.lat, "number"); assert.equal(typeof w.name, "string"); }
  JSON.parse(JSON.stringify(out));
});
test("event points never satisfy a venue-linked placement; the venue's own point does", () => {
  const venue = out.find(w => w.kind === "venue" && w.venueId === 7)!;
  const eventPoint = { ...out.find(w => w.kind === "event" && w.venueId === 7)!, lat: 45.5213 };
  assert.throws(() => validatePlacement({ lat: eventPoint.lat, lng: eventPoint.lng, days: 3, venueId: 7 }, [eventPoint], 7), /linked venue/);
  assert.equal(validatePlacement({ lat: venue.lat, lng: venue.lng, days: 3, venueId: 7 }, out, 7)?.venueId, 7);
});
test("real resource data: every mapped category has an accent and the shape holds", () => {
  const real = buildWaypoints({ resources: RESOURCE_MAP_ENTRIES, businesses: [], events: [] });
  assert.ok(real.length > 20);
  for (const w of real) { assert.ok(w.category, w.name); assert.equal(w.secondary, NEEDZ_ACCENT[w.category!]); }
  const rac = RESOURCE_CATEGORIES.flatMap(c => c.orgs).find(o => o.name.startsWith("Rogue Action Center"))!;
  assert.equal(resourceClosed({ org: rac, categories: [], locations: [] }), true, "Rogue Action Center is recorded as closed");
});
