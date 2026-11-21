import assert from "node:assert/strict";
import test from "node:test";
import {
  DRAWER_CATEGORY_FILTERS,
  DRAWER_FILTERS,
  DRAWER_TAG_FILTERS,
  DRAWER_TIME_FILTERS,
  collectInViewItems,
  eventDrawerTagIds,
  eventMatchesAnyTime,
  eventMatchesCategories,
  eventMatchesTags,
  isAdultPlace,
  placeMatchesCategories,
  toggleDrawerFilter,
  type DrawerFilterState,
  type InViewEvent,
  type InViewPlace,
} from "./drawerFilters";

const bounds = { west: -122.7, east: -122.6, south: 45.5, north: 45.55 };

test("shared filter config is the single list of categories, times, and tags", () => {
  const ids = DRAWER_FILTERS.map(chip => chip.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(DRAWER_CATEGORY_FILTERS.some(chip => chip.id === "eventz"));
  assert.ok(DRAWER_CATEGORY_FILTERS.some(chip => chip.label === "Bars & Clubs"));
  assert.ok(DRAWER_CATEGORY_FILTERS.some(chip => chip.label === "Restaurants"));
  assert.ok(DRAWER_CATEGORY_FILTERS.some(chip => chip.id === "venue"));
  assert.deepEqual(DRAWER_TIME_FILTERS.map(chip => chip.id), ["today", "tonight", "tomorrow", "week", "later"]);
  assert.ok(DRAWER_TAG_FILTERS.some(chip => chip.id === "21plus"));
  assert.ok(DRAWER_TAG_FILTERS.some(chip => chip.id === "drag"));
  assert.ok(DRAWER_FILTERS.every(chip => chip.accent.startsWith("var(--")));
  assert.ok(!DRAWER_FILTERS.some(chip => /#|rgb\(|hsl\(/i.test(chip.accent)));
});

test("time chips are exclusive, category and tag chips are additive", () => {
  let state: DrawerFilterState = { categories: [], times: [], tags: [] };
  const today = DRAWER_TIME_FILTERS[0];
  const week = DRAWER_TIME_FILTERS[3];
  state = toggleDrawerFilter(state, today);
  state = toggleDrawerFilter(state, week);
  assert.deepEqual(state.times, ["week"]);
  const bars = DRAWER_CATEGORY_FILTERS.find(chip => chip.id === "bar")!;
  const events = DRAWER_CATEGORY_FILTERS.find(chip => chip.id === "eventz")!;
  state = toggleDrawerFilter(state, bars);
  state = toggleDrawerFilter(state, events);
  assert.deepEqual(state.categories, ["bar", "eventz"]);
});

test("event time, tag, and category matching uses the shared rules", () => {
  const now = Date.parse("2026-11-20T20:00:00-08:00");
  const tonight = {
    dateStart: "2026-11-20T21:00:00",
    dateEnd: "2026-11-21T02:00:00",
    admission: "FREE" as const,
    ageRequirement: "21_PLUS" as const,
    isPublic: true,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    eventTypes: ["DRAG"],
  };
  assert.equal(eventMatchesAnyTime(tonight, ["tonight"], now), true);
  assert.equal(eventMatchesAnyTime(tonight, ["tomorrow"], now), false);
  assert.equal(eventMatchesTags(tonight, ["free", "21plus", "drag"]), true);
  assert.deepEqual(eventDrawerTagIds(tonight).sort(), ["21plus", "drag", "free"]);
  assert.equal(eventMatchesCategories(["eventz"], "bar"), true);
  assert.equal(eventMatchesCategories(["restaurant"], "bar"), false);
  assert.equal(eventMatchesCategories(["bar"], "bar"), true);
  assert.equal(isAdultPlace("Club", "An adult cabaret"), true);
  assert.equal(placeMatchesCategories({ type: "restaurant", name: "Diner" }, ["eventz"]), false);
  assert.equal(placeMatchesCategories({ type: "restaurant", name: "Diner" }, ["restaurant"]), true);
});

test("in-view rail mixes events and every place type on screen, and skips off-screen cards", () => {
  const now = Date.parse("2026-11-20T20:00:00-08:00");
  const places: InViewPlace[] = [
    { id: 1, name: "Sanctuary", type: "venue", lat: 45.52, lng: -122.67 },
    { id: 2, name: "Coffee Beer", type: "cafe", lat: 45.53, lng: -122.66 },
    { id: 3, name: "Far shop", type: "shop", lat: 46, lng: -122 },
    { id: 4, name: "Diner", type: "restaurant", lat: 45.525, lng: -122.665 },
  ];
  const events: InViewEvent[] = [
    {
      id: 10,
      title: "Yes Coach",
      venueName: "Sanctuary",
      dateStart: "2026-11-20T21:00:00",
      dateEnd: "2026-11-21T02:00:00",
      admission: "FREE",
      ageRequirement: "21_PLUS",
      isPublic: true,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      eventTypes: [],
    },
    {
      id: 11,
      title: "Off map dance",
      venueName: "Far shop",
      dateStart: "2026-11-20T21:00:00",
      dateEnd: "2026-11-21T02:00:00",
      admission: "FREE",
      ageRequirement: "ALL_AGES",
      isPublic: true,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      eventTypes: [],
    },
  ];
  const mixed = collectInViewItems(places, events, bounds, { categories: [], times: [], tags: [] }, now);
  const keys = mixed.map(item => `${item.kind}:${item.kind === "event" ? item.event.title : item.place.name}`);
  assert.deepEqual(keys, ["place:Coffee Beer", "place:Diner", "place:Sanctuary", "event:Yes Coach"]);
  const onlyEvents = collectInViewItems(places, events, bounds, { categories: ["eventz"], times: [], tags: [] }, now);
  assert.deepEqual(onlyEvents.map(item => item.kind), ["event"]);
  const onlyFood = collectInViewItems(places, events, bounds, { categories: ["restaurant"], times: [], tags: [] }, now);
  assert.deepEqual(onlyFood.map(item => item.kind === "place" ? item.place.type : item.kind), ["restaurant"]);
});
