/**
 * Smoke: Darcelle XV + Hawks PDX trusted connectors (offline, fixture-based).
 * Run: npx tsx script/smoke-trusted-new-venues.ts
 *
 * Fixtures mirror the recon shapes in shared/ingestSources.ts:
 * - Darcelle: Tribe REST `/wp-json/tribe/events/v1/events` (image.url flyers,
 *   next_rest_url pagination) + ICS ?ical=1 fallback
 * - Hawks: Squarespace `?format=json` (upcoming[].assetUrl posters,
 *   pagination.nextPageUrl, epoch-ms dates)
 */
import { parseTribeEventsJson } from "../server/ingest/parseTribe";
import { parseSquarespaceJson } from "../server/ingest/parseSquarespace";
import {
  applyDarcellePolicy,
  expandDarcelleTribeUrl,
} from "../server/ingest/adapters/darcelle";
import {
  applyHawksPolicy,
  expandHawksJsonUrl,
} from "../server/ingest/adapters/hawks";
import { getTrustedVenue, TRUSTED_VENUES } from "../shared/trustedVenues";
import { applyDeclaredVenuePolicy } from "../server/ingest/venuePolicy";
import { isRelevantScanDraft } from "../server/ingest/relevance";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

/* ── registry wiring ── */
assert(TRUSTED_VENUES.length === 10, `10 trusted venues registered (got ${TRUSTED_VENUES.length})`);
for (const sid of ["stag-eb", "sports-bra-eb", "living-room-eb", "camp-bar", "cc-slaughters"]) {
  assert(getTrustedVenue(sid)?.fetchMode === "generic", `${sid} registered as generic mode`);
}
assert(getTrustedVenue("darcelle-tribe")?.fetchMode === "darcelle_tribe", "darcelle-tribe registered with fetchMode darcelle_tribe");
assert(getTrustedVenue("hawks-json")?.fetchMode === "hawks_squarespace", "hawks-json registered with fetchMode hawks_squarespace");

/* ── URL expansion ── */
assert(
  expandDarcelleTribeUrl("https://darcellexv.com/wp-json/tribe/events/v1/events") ===
    "https://darcellexv.com/wp-json/tribe/events/v1/events?per_page=50",
  "Tribe URL gets per_page appended",
);
assert(
  expandHawksJsonUrl("https://www.hawkspdx.com/hawks-events") ===
    "https://www.hawkspdx.com/hawks-events?format=json",
  "Hawks URL gets format=json appended",
);
assert(
  expandHawksJsonUrl("https://www.hawkspdx.com/hawks-events?format=json").includes("format=json"),
  "Hawks URL with format untouched",
);

/* ── Darcelle: Tribe fixture → parse → policy ── */
const TRIBE_JSON = JSON.stringify({
  events: [
    {
      id: 101,
      title: "Darcelle XV Drag Revue",
      start_date: "2026-08-14 20:00:00",
      end_date: "2026-08-14 22:30:00",
      url: "https://darcellexv.com/event/drag-revue-aug-14/",
      description: "<p>The legendary revue. 21+ evening show.</p>",
      cost: "$35",
      image: {
        url: "https://darcellexv.com/wp-content/uploads/2026/07/revue-300x200.jpg",
        sizes: {
          full: { url: "https://darcellexv.com/wp-content/uploads/2026/07/revue.jpg", width: 1600, height: 2000 },
          medium: { url: "https://darcellexv.com/wp-content/uploads/2026/07/revue-300x200.jpg", width: 300, height: 200 },
        },
      },
      venue: { venue: "Darcelle XV Showplace", address: "208 NW 3rd Ave", city: "Portland", state: "OR" },
    },
    {
      id: 102,
      title: "Free Drag Brunch",
      start_date: "2026-08-16 11:00:00",
      description: "All ages welcome brunch show — free entry, tips appreciated!",
      image: null,
      venue: {},
    },
  ],
  total: 2,
  next_rest_url: null,
});

const darcelleDrafts = parseTribeEventsJson(TRIBE_JSON, "https://darcellexv.com/wp-json/tribe/events/v1/events").map(
  applyDarcellePolicy,
);
assert(darcelleDrafts.length === 2, "Tribe fixture parses 2 drafts");
const revue = darcelleDrafts[0];
assert(
  revue.posterImageUrl === "https://darcellexv.com/wp-content/uploads/2026/07/revue.jpg",
  "full-size flyer preferred over 300x200 derivative",
);
assert(revue.eventPageUrl === "https://darcellexv.com/event/drag-revue-aug-14/", "Tribe url → eventPageUrl");
assert(revue.ageRequirement === "21_PLUS", "Darcelle age defaults 21_PLUS");
assert(
  revue.warnings.some(w => /verify for all-ages\/brunch/i.test(w)),
  "verify-age breadcrumb present for Review",
);
assert(revue.venueName === "Darcelle XV Showplace", "venue name normalized");
assert(revue.dateStart.startsWith("2026-08-14"), "Tribe space-separated date parsed");

const brunch = darcelleDrafts[1];
assert(brunch.admission === "FREE", "explicit 'free entry' text keeps FREE (never invented)");
assert(brunch.ageRequirement === "21_PLUS", "brunch still defaults 21_PLUS pending review");
assert(brunch.address === "208 NW 3rd Ave, Portland, OR", "missing venue → directory address filled");

// Never-invent-FREE: no free text → not FREE
const noFree = applyDarcellePolicy(
  parseTribeEventsJson(
    JSON.stringify({ events: [{ title: "Ticketed Cabaret", start_date: "2026-08-20 19:00:00", venue: {} }] }),
    null,
  )[0],
);
assert(noFree.admission !== "FREE", "no free text → admission not invented as FREE");

/* ── Hawks: Squarespace fixture → parse → policy ── */
const AUG_22 = Date.UTC(2026, 7, 22, 4, 0, 0); // 2026-08-21 21:00 Pacific
const SQ_JSON = JSON.stringify({
  upcoming: [
    {
      title: "Underwear Night",
      startDate: AUG_22,
      endDate: AUG_22 + 4 * 3600_000,
      assetUrl: "https://images.squarespace-cdn.com/content/hawks/underwear-night.jpg?format=300w",
      fullUrl: "/hawks-events/underwear-night",
      excerpt: "<p>Monthly underwear party.</p>",
    },
    {
      title: "Underwear Night",
      startDate: AUG_22, // duplicate — same title+day
      assetUrl: "https://images.squarespace-cdn.com/content/hawks/underwear-night.jpg",
    },
  ],
  pagination: { nextPageUrl: null },
});

const hawksParsed = parseSquarespaceJson(SQ_JSON, "https://www.hawkspdx.com/hawks-events?format=json");
const hawksDrafts = hawksParsed.map(applyHawksPolicy);
assert(hawksDrafts.length >= 1, "SQ fixture parses");
const uw = hawksDrafts[0];
assert(uw.posterImageUrl != null && !/format=300w/.test(uw.posterImageUrl!), "SQ shrink param stripped from assetUrl poster");
assert(uw.ageRequirement === "21_PLUS", "Hawks age defaults 21_PLUS");
assert(uw.isSexPositive === true && uw.nudityOk === true, "sex-positive + nudity flags always on");
const uwTags = JSON.parse(uw.eventTypes) as string[];
assert(
  ["SEX_POSITIVE", "NUDITY_OK", "KINK"].every(t => uwTags.includes(t)),
  "sex-club tags stamped into eventTypes",
);
assert(
  uw.warnings.some(w => /verify for 18\+ nights/i.test(w)),
  "verify-age breadcrumb present for Review",
);
assert(
  uw.eventPageUrl === "https://www.hawkspdx.com/hawks-events/underwear-night",
  "relative fullUrl resolved against feed origin",
);
assert(uw.venueName === "Hawks PDX", "venue name normalized");
assert(uw.admission !== "FREE", "no free text → admission not invented as FREE");

/* ── declarative venuePolicy (the scaling path) ── */
const stag = getTrustedVenue("stag-eb")!;
const stagDraft = applyDeclaredVenuePolicy(
  { ...uw, ageRequirement: "ALL_AGES", isSexPositive: false, nudityOk: false, eventTypes: "[]", admission: "UNKNOWN", warnings: [], title: "Drag Brunch at Stag", description: "Sunday drag brunch. Tickets $25." },
  stag,
);
assert(stagDraft.ageRequirement === "21_PLUS", "declared policy forces Stag to 21_PLUS");
assert(stagDraft.warnings.some(w => /21\+ bar/i.test(w)), "declared age note breadcrumb present");
assert(stagDraft.isSexPositive === false, "no sex-positive stamp unless declared");
assert(stagDraft.admission !== "FREE", "ticketed text does not become FREE");

const bra = getTrustedVenue("sports-bra-eb")!;
const braDraft = applyDeclaredVenuePolicy(
  { ...uw, ageRequirement: "ALL_AGES", isSexPositive: false, nudityOk: false, eventTypes: "[]", admission: "UNKNOWN", warnings: [], title: "Thorns Watch Party", description: "Free entry, all welcome!" },
  bra,
);
assert(braDraft.ageRequirement === "ALL_AGES", "Sports Bra: age NOT forced (note-only policy)");
assert(braDraft.warnings.some(w => /verify age/i.test(w)), "Sports Bra verify-age note present");
assert(braDraft.admission === "FREE", "explicit free text keeps FREE via declared re-infer");

const hawksDef = getTrustedVenue("hawks-json")!;
assert(hawksDef.venuePolicy == null, "dedicated-adapter venues do not double-stamp via declarative policy");

/* ── Sports Bra venue-scope leak: generic title words must NOT scope-match ── */
const braCtx = {
  sourceId: "sports-bra-eb",
  label: "The Sports Bra",
  url: "https://www.eventbrite.com/d/or--portland/sports-bra/",
  tier: "1",
};
// Real Sports Bra event — venue field names the bar → kept.
assert(
  isRelevantScanDraft(
    { title: "Thorns Watch Party", venueName: "The Sports Bra", address: "2512 NE Broadway, Portland, OR", description: "Come watch!", sourceUrl: null, ticketUrl: null } as any,
    braCtx,
  ).keep,
  "Sports Bra: genuine event AT the bar is kept",
);
// Junk 1: church pickleball whose TITLE contains "Sports" → dropped.
assert(
  !isRelevantScanDraft(
    { title: "Kellogg Creek Ward Sports Night", venueName: "The Church of Jesus Christ of Latter-day Saints", address: "13520 SE Ruscliffe Lane, Milwaukie, OR 97222", description: "Please come join us playing pickleball.", sourceUrl: null, ticketUrl: null } as any,
    braCtx,
  ).keep,
  "Sports Bra: church 'Sports Night' (wrong venue) is dropped",
);
// Junk 2: barbell cert at a different gym → dropped.
assert(
  !isRelevantScanDraft(
    { title: "SFL StrongFirst Barbell Instructor Certification—Portland, OR, USA", venueName: "Hardstyle Strength", address: "2505 SE 36th Ave, Portland, OR 97202", description: "Dive deep into the powerlifts.", sourceUrl: null, ticketUrl: null } as any,
    braCtx,
  ).keep,
  "Sports Bra: barbell cert at Hardstyle Strength is dropped",
);
// Slug fallback: EB event slug carries the venue → kept even if venueName empty.
assert(
  isRelevantScanDraft(
    { title: "Drag Brunch", venueName: null, address: null, description: null, sourceUrl: "https://www.eventbrite.com/e/the-sports-bra-drag-brunch-tickets-123456", ticketUrl: null } as any,
    braCtx,
  ).keep,
  "Sports Bra: event whose own EB slug names the bar is kept",
);

console.log("\nAll new-venue trusted connector smoke checks passed.");
