/**
 * Regression guard: Sports Bra scraping stays disabled.
 *
 * Their schedule technology is not reliable enough for QSearch. Events found
 * through another trustworthy source qualify because The Sports Bra is a
 * founder-locked dedicated lesbian/LGBTQ+ venue; this only prevents a direct
 * scraper/source from being registered.
 */
import { INGEST_SOURCES, isSportsBraScrapeSource } from "../shared/ingestSources";
import { getTrustedVenue, isTrustedLaneSource } from "../shared/trustedVenues";
import { isDedicatedQueerVenueListing } from "../server/ingest/relevance";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

assert(
  !INGEST_SOURCES.some(source => /sports[-_ ]?bra/i.test(`${source.id} ${source.label}`)),
  "Sports Bra is absent from QSearch scan sources",
);
assert(getTrustedVenue("sports-bra-eb") == null, "Sports Bra is absent from trusted sync");
assert(
  isDedicatedQueerVenueListing({
    venueName: "The Sports Bra",
    sourceUrl: "https://thesportsbraofficial.com/pages/portland",
    eventPageUrl: null,
  }),
  "Sports Bra is permanently classified as a dedicated lesbian/LGBTQ+ venue",
);
assert(
  isSportsBraScrapeSource({
    id: "custom-sports-bra",
    label: "The Sports Bra schedule",
    url: "https://thesportsbraofficial.com/pages/portland",
  }),
  "an old/custom Sports Bra source is blocked too",
);
assert(
  !isTrustedLaneSource({
    id: "sports-bra-eb",
    url: "https://www.eventbrite.com/d/or--portland/sports-bra/",
  }),
  "old Sports Bra Eventbrite source is not routed to a scraper lane",
);

console.log("\nSports Bra scraping is intentionally disabled.");
