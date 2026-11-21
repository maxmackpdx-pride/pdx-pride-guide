import assert from "node:assert/strict";
import test from "node:test";
import { NEW_TAB, directionsLinks, rideWebsiteLinks } from "./travelLinks";

const venue = { name: "Sanctuary Club", address: "33 NW 9th Ave, Portland, OR", lat: 45.5236, lng: -122.6812 };

test("ride links are websites with the venue as destination", () => {
  const [lyft, uber, trimet] = rideWebsiteLinks(venue);
  assert.equal(lyft.href, "https://ride.lyft.com/u?destination[latitude]=45.5236&destination[longitude]=-122.6812");
  assert.ok(uber.href.startsWith("https://m.uber.com/go/product-selection?drop[0]="));
  const drop = JSON.parse(decodeURIComponent(uber.href.split("drop[0]=")[1]));
  assert.deepEqual(drop, { latitude: 45.5236, longitude: -122.6812, addressLine1: "Sanctuary Club", addressLine2: "33 NW 9th Ave, Portland, OR" });
  assert.equal(trimet.href, "https://trimet.org/home/planner?toPlace=" + encodeURIComponent("Sanctuary Club::45.5236,-122.6812"));
  for (const l of [lyft, uber, trimet]) { assert.equal(l.external, true); assert.doesNotMatch(l.href, /^(uber|lyft):|m\.uber\.com\/ul\//); }
});

test("ride links without coordinates fall back to plain web pages (Lyft/Uber) or a geocoded TriMet place", () => {
  const [lyft, uber, trimet] = rideWebsiteLinks({ name: "Sanctuary Club", address: "33 NW 9th Ave" });
  assert.equal(lyft.href, "https://ride.lyft.com/"); assert.equal(lyft.passesVenue, false);
  assert.equal(uber.href, "https://m.uber.com/go/home"); assert.equal(uber.passesVenue, false);
  assert.equal(trimet.href, "https://trimet.org/home/planner?toPlace=33%20NW%209th%20Ave");
});

test("directions: Zaylist Mapz first and in-app, then Google, Apple, Waze, Citymapper", () => {
  const links = directionsLinks(venue);
  assert.deepEqual(links.map(l => l.key), ["zaylist", "google", "apple", "waze", "citymapper"]);
  assert.equal(links[0].external, false); assert.ok(links[0].href.startsWith("/placez/map?"));
  assert.equal(links[1].href, "https://www.google.com/maps/dir/?api=1&destination=45.5236%2C-122.6812");
  assert.equal(links[2].href, "https://maps.apple.com/?daddr=45.5236%2C-122.6812&dirflg=d");
  assert.equal(links[3].href, "https://waze.com/ul?ll=45.5236,-122.6812&navigate=yes");
  assert.equal(links[4].href, "https://citymapper.com/directions?endcoord=45.5236,-122.6812&endname=Sanctuary%20Club&endaddress=33%20NW%209th%20Ave%2C%20Portland%2C%20OR");
  assert.ok(links.slice(1).every(l => l.external));
});

test("every external travel link opens in a new tab with noopener noreferrer", () => {
  assert.deepEqual(NEW_TAB, { target: "_blank", rel: "noopener noreferrer" });
});
