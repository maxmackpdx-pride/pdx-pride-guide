import assert from "node:assert/strict";
import test from "node:test";
import type { Business } from "@shared/schema";
import { promotersForBusinesses, type PromoterCatalogEvent, type PromoterCatalogUser } from "./directoryPromoters";

function place(id: number, name: string, address = "1 SW Main St"): Business {
  return { id, name, address, lat: 45.52, lng: -122.68 } as Business;
}

const events: PromoterCatalogEvent[] = [
  {
    id: 1,
    venueName: "Badlands",
    address: "1 SW Main St",
    claimedBy: "sam",
    submittedBy: "ada@example.test",
  },
  {
    id: 2,
    venueName: "Crush",
    address: "2 SW Main St",
    claimedBy: "not-a-user",
    submittedBy: "rio@example.test",
  },
];

const users: PromoterCatalogUser[] = [
  { id: 10, username: "sam", displayName: "Sam", email: "sam@example.test" },
  { id: 11, username: "email-only", displayName: null, email: "sam" },
  { id: 12, username: "rio", displayName: "Rio", email: "rio@example.test" },
  { id: 13, username: "ada", displayName: "Ada", email: "ada@example.test" },
];

test("directory promoters are matched once per place and deduped", () => {
  const hosts = new Map<number, number[]>([[1, [10, 99]], [2, [12]]]);
  const result = promotersForBusinesses(
    [place(1, "Badlands"), place(2, "Crush Bar", "2 SW Main St"), place(3, "Somewhere Else", "9 NW Other Ave")],
    events,
    hosts,
    users,
  );

  assert.deepEqual(result.get(1), [
    { id: 10, username: "sam", displayName: "Sam" },
    { id: 13, username: "ada", displayName: "Ada" },
  ]);
  assert.deepEqual(result.get(2), [{ id: 12, username: "rio", displayName: "Rio" }]);
  assert.deepEqual(result.get(3), []);
});

test("a username match wins over a different user with that email", () => {
  const result = promotersForBusinesses(
    [place(1, "Badlands")],
    [{ id: 8, venueName: "Badlands Portland", address: "1 SW Main St", claimedBy: "sam" }],
    new Map(),
    users,
  );
  assert.equal(result.get(1)?.[0]?.id, 10);
});
