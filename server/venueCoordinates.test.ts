import test from "node:test";
import assert from "node:assert/strict";
import { buildGeocodeQueries, eventMatchesBusiness, geocodePortlandLocation } from "./venueCoordinates";

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

test("geocode tries the venue name before the street, then the bare street", () => {
  assert.deepEqual(buildGeocodeQueries("110 NW Broadway, Portland, OR", "Badlands"), [
    "Badlands, 110 NW Broadway, Portland, OR",
    "110 NW Broadway, Portland, OR",
  ]);
  assert.deepEqual(buildGeocodeQueries("208 NW 3rd Ave", "Darcelle XV"), [
    "Darcelle XV, 208 NW 3rd Ave, Portland, OR",
    "208 NW 3rd Ave, Portland, OR",
  ]);
  assert.deepEqual(buildGeocodeQueries("Badlands, 110 NW Broadway", "Badlands"), ["Badlands, 110 NW Broadway, Portland, OR"]);
  assert.deepEqual(buildGeocodeQueries(null, "Badlands"), ["Badlands, Portland, OR"]);
  assert.deepEqual(buildGeocodeQueries(" ", ""), []);
});

function fakeNominatim(answers: Record<string, Array<{ lat: string; lon: string }>>, status = 200) {
  const asked: string[] = [];
  const fetchImpl = (async (url: URL) => {
    const q = url.searchParams.get("q") || "";
    asked.push(q);
    return new Response(JSON.stringify(answers[q] ?? []), { status });
  }) as unknown as typeof fetch;
  return { asked, fetchImpl };
}

test("an unknown venue name falls back to the street address, paced for Nominatim", async () => {
  const { asked, fetchImpl } = fakeNominatim({ "110 NW Broadway, Portland, OR": [{ lat: "45.5236", lon: "-122.6765" }] });
  const waits: number[] = [];
  const coords = await geocodePortlandLocation("110 NW Broadway, Portland, OR", "Brand New Bar", {
    fetchImpl, wait: async ms => { waits.push(ms); },
  });
  assert.deepEqual(coords, { lat: 45.5236, lng: -122.6765 });
  assert.deepEqual(asked, ["Brand New Bar, 110 NW Broadway, Portland, OR", "110 NW Broadway, Portland, OR"]);
  assert.ok(waits.length === 1 && waits[0] >= 1000, "one request per second");
});

test("geocode stops on the first Portland hit and never retries a refused request", async () => {
  const hit = fakeNominatim({ "Badlands, 110 NW Broadway, Portland, OR": [{ lat: "45.5236", lon: "-122.6765" }] });
  assert.deepEqual(await geocodePortlandLocation("110 NW Broadway", "Badlands", { fetchImpl: hit.fetchImpl, wait: async () => {} }), { lat: 45.5236, lng: -122.6765 });
  assert.equal(hit.asked.length, 1);

  const nyc = fakeNominatim({ "Badlands, 110 NW Broadway, Portland, OR": [{ lat: "40.71", lon: "-74.0" }] });
  assert.equal(await geocodePortlandLocation("110 NW Broadway", "Badlands", { fetchImpl: nyc.fetchImpl, wait: async () => {} }), null);
  assert.equal(nyc.asked.length, 2, "an out-of-metro hit tries the next query");

  const limited = fakeNominatim({}, 429);
  assert.equal(await geocodePortlandLocation("110 NW Broadway", "Badlands", { fetchImpl: limited.fetchImpl, wait: async () => {} }), null);
  assert.equal(limited.asked.length, 1, "rate limited: do not keep asking");
});
