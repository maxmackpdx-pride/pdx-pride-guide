import assert from "node:assert/strict";
import test from "node:test";
import {
  centerThenOpenMapCard,
  hasMapCoordinates,
  isMapSurfacePath,
  mapCardSearch,
  type MapCardTarget,
} from "./centerThenOpen";

const yesCoach: MapCardTarget = {
  kind: "event",
  id: 10,
  title: "Yes Coach",
  lat: 45.5241,
  lng: -122.6757,
};

test("center then open pans the map before opening the existing card", async () => {
  const calls: string[] = [];
  const opened: MapCardTarget[] = [];
  await centerThenOpenMapCard(yesCoach, {
    centerMap: async (lng, lat) => {
      calls.push(`center:${lng},${lat}`);
    },
    openCard: target => {
      calls.push(`open:${target.kind}:${target.id}`);
      opened.push(target);
    },
  });
  assert.deepEqual(calls, ["center:-122.6757,45.5241", "open:event:10"]);
  assert.equal(opened[0], yesCoach);
});

test("center then open skips the pan when the item has no coordinates", async () => {
  const calls: string[] = [];
  await centerThenOpenMapCard({ kind: "place", id: 9001, title: "Dining Room" }, {
    centerMap: async () => { calls.push("center"); },
    openCard: target => { calls.push(`open:${target.kind}:${target.id}`); },
  });
  assert.deepEqual(calls, ["open:place:9001"]);
  assert.equal(hasMapCoordinates(yesCoach), true);
  assert.equal(hasMapCoordinates({ kind: "event", id: 1 }), false);
});

test("map card search stays on the current map path and uses existing bookmarks", () => {
  assert.equal(mapCardSearch("/placez/map?mode=mapz", yesCoach), "/placez/map?mode=mapz&event=10");
  assert.equal(mapCardSearch("/mapz?event=3", { kind: "place", id: 9001, title: "Dining Room" }), "/mapz?place=9001");
  assert.equal(isMapSurfacePath("/placez/map"), true);
  assert.equal(isMapSurfacePath("/events"), false);
});
