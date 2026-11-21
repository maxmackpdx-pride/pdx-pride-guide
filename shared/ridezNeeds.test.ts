import assert from "node:assert/strict";
import test from "node:test";
import { ridezNeedBloom, visibleRidezNeeds } from "./ridezNeeds";

const downtown = { lat: 45.5231, lng: -122.6765 };
const sameEvent: Parameters<typeof visibleRidezNeeds>[0][number] = {
  id: "n1", name: "Alex", eventId: 10, eventTitle: "Yes Coach", lat: 45.52, lng: -122.68,
};
const sameAfterz: Parameters<typeof visibleRidezNeeds>[0][number] = {
  id: "n2", name: "Riley", afterzId: "g1", afterzTitle: "Night shift", lat: 47.6, lng: -122.3,
};
const nearby: Parameters<typeof visibleRidezNeeds>[0][number] = {
  id: "n3", name: "Sam", lat: 45.53, lng: -122.67, neighborhood: "Pearl",
};
const far: Parameters<typeof visibleRidezNeeds>[0][number] = {
  id: "n4", name: "Jo", lat: 47.6, lng: -122.3, eventId: 99,
};

test("NEEDS A RIDE keeps people within 2 miles plus the same event or Afterz", () => {
  const shown = visibleRidezNeeds([sameEvent, sameAfterz, nearby, far], { ...downtown, eventId: 10, afterzId: "g1" });
  assert.deepEqual(shown.map(need => need.id), ["n1", "n2", "n3"]);
});

test("same Afterz blooms yellow, same event blooms orange", () => {
  assert.equal(ridezNeedBloom(sameAfterz, { afterzId: "g1", eventId: 10 }), "afterz");
  assert.equal(ridezNeedBloom(sameEvent, { eventId: 10 }), "event");
  assert.equal(ridezNeedBloom(nearby, { eventId: 10 }), null);
});
