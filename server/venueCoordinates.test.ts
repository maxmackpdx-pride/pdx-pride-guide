import test from "node:test";
import assert from "node:assert/strict";
import { eventMatchesBusiness } from "./venueCoordinates";

test("matches an event on a venue calendar to that exact venue", () => {
  assert.equal(eventMatchesBusiness(
    { venueName: "The Eagle", address: "1 Test Venue St, Portland, OR 97201" },
    { name: "Eagle Portland", address: "1 Test Venue St, Portland, OR 97201" },
  ), true);
});

test("does not turn an organizer into the event venue", () => {
  const event = { venueName: "Nova PDX", address: "722 E Burnside St, Portland, OR 97214" };
  assert.equal(eventMatchesBusiness(event, { name: "Nova PDX", address: event.address }), true);
  assert.equal(eventMatchesBusiness(event, { name: "Bearracuda", address: event.address }), false);
});

test("rejects a name match with a conflicting physical address", () => {
  assert.equal(eventMatchesBusiness(
    { venueName: "The Sports Bra", address: "1 Test Venue St, Portland, OR 97201" },
    { name: "The Sports Bra", address: "2 Other St, Portland, OR 97201" },
  ), false);
  assert.equal(eventMatchesBusiness(
    { venueName: "Scandals East", address: "827 NE Alberta St, Portland, OR 97211" },
    { name: "Scandals East", address: "1125 SW Harvey Milk St, Portland, OR 97205" },
  ), false);
});

test("rejects shared-word and shared-address identity joins", () => {
  assert.equal(eventMatchesBusiness(
    { venueName: "Darcelle Plaza" },
    { name: "Darcelle XV Showplace" },
  ), false);
  assert.equal(eventMatchesBusiness(
    { venueName: "Ballroom Night" },
    { name: "The Ballroom" },
  ), false);
  assert.equal(eventMatchesBusiness(
    { venueName: "Badlands", address: "123 Main St, Portland, OR 97201" },
    { name: "Portland Leather Alliance", address: "123 Main St, Portland, OR 97201" },
  ), false);
});
