/**
 * Smoke: permanent closed-venue blacklist (strict match + Scandals address rule).
 * Run: npx tsx script/smoke-closed-venues.ts
 */
import {
  matchClosedVenue,
  isClosedPermanentScrapeUrl,
  isEventAfterVenueClose,
} from "../shared/closedVenues";
import { isRelevantScanDraft, isGenericEventbriteDumpUrl } from "../server/ingest/relevance";
import type { IngestEventDraft } from "../server/ingest/types";
import {
  sanitizeBadlandsTicketUrl,
  isBadlandsInternalUrl,
} from "../server/ingest/parseBadlands";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

const kwCtx = {
  sourceId: "eb-gay",
  label: "EB · Gay",
  url: "https://www.eventbrite.com/d/or--portland/gay/",
  tier: "eventbrite",
};

function draft(partial: Partial<IngestEventDraft>): IngestEventDraft {
  return {
    title: "Night",
    description: "Queer night",
    venueName: "Somewhere",
    address: "Portland, OR",
    dateStart: "2026-08-01T21:00:00",
    dateEnd: "2026-08-02T01:00:00",
    ageRequirement: "21_PLUS",
    admission: "DOOR_FEE",
    ...partial,
  } as IngestEventDraft;
}

// Crush blocked; Woman Crush Wednesdays at Badlands not blocked by venue
assert(matchClosedVenue({ venueName: "Crush Bar" })?.entry.id === "crush-bar", "Crush Bar blocked");
assert(
  matchClosedVenue({ venueName: "Badlands", title: "Woman Crush Wednesdays" }) == null,
  "Woman Crush at Badlands not treated as closed venue",
);
assert(
  isRelevantScanDraft(
    draft({
      title: "Woman Crush Wednesdays",
      venueName: "Badlands",
      address: "110 NW Broadway, Portland, OR",
    }),
    kwCtx,
  ).keep,
  "Woman Crush draft keepable",
);

const crushRel = isRelevantScanDraft(
  draft({ title: "Karaoke", venueName: "Crush Bar", address: "1400 SE Morrison St" }),
  kwCtx,
);
assert(!crushRel.keep && crushRel.reason?.startsWith("closed_permanent:crush-bar"), "Crush draft dropped");

// Doc Marie's
assert(matchClosedVenue({ venueName: "Doc Marie's" })?.entry.id === "doc-maries", "Doc Marie's blocked");

// Embers / Uncanny / Sissy / Misfits
for (const [name, id] of [
  ["Embers Avenue", "embers-avenue"],
  ["The Uncanny", "the-uncanny"],
  ["Sissy Bar", "sissy-bar"],
  ["Misfits Bar and Lounge", "misfits-bar"],
] as const) {
  assert(matchClosedVenue({ venueName: name })?.entry.id === id, `${name} blocked`);
}

// Scandals: NE Alberta live; old Harvey Milk blocked
assert(
  matchClosedVenue({
    venueName: "Scandals East",
    address: "827 NE Alberta St, Portland, OR",
  }) == null,
  "Scandals East Alberta allowed",
);
assert(
  matchClosedVenue({
    venueName: "Scandals",
    address: "1125 SW Harvey Milk St, Portland, OR",
  })?.entry.id === "scandals-downtown",
  "Scandals downtown Harvey Milk blocked",
);

// Scrape URL
assert(isClosedPermanentScrapeUrl("https://www.instagram.com/crushbarpdx/"), "crush IG blocked");
assert(!isClosedPermanentScrapeUrl("https://peacockpdx.com/"), "peacock not blocked");

// Post-close timing
assert(isEventAfterVenueClose("2026-08-01T21:00:00", "2025-01-01"), "after close");
assert(!isEventAfterVenueClose("2024-06-01T21:00:00", "2025-01-01"), "before close");

// The Roxy diner blocked; bare short noise
assert(matchClosedVenue({ venueName: "The Roxy" })?.entry.id === "the-roxy", "The Roxy blocked");
assert(matchClosedVenue({ venueName: "Roxy" }) == null, "bare Roxy not blocked");

// City-wide Eventbrite dumps must stay rejected forever
assert(isGenericEventbriteDumpUrl("https://www.eventbrite.com/d/local/events/"), "local dump blocked");
assert(isGenericEventbriteDumpUrl("https://www.eventbrite.com/events/"), "bare /events blocked");
assert(
  !isGenericEventbriteDumpUrl("https://www.eventbrite.com/d/or--portland/gay/"),
  "PDX keyword search allowed",
);

// Badlands ticket hygiene
assert(
  isBadlandsInternalUrl("https://badlands-events.badlandsportland.workers.dev/api/calendar?from=x"),
  "worker calendar is internal",
);
assert(
  sanitizeBadlandsTicketUrl(
    "https://badlands-events.badlandsportland.workers.dev/api/calendar?from=x",
  ) === "https://www.badlandsportland.com/calendar",
  "worker calendar → public calendar ticketUrl",
);
assert(
  sanitizeBadlandsTicketUrl(null, "https://badlandsportland.com/events/foo") ===
    "https://badlandsportland.com/events/foo",
  "real event link kept as ticketUrl",
);

console.log("\nAll closed-venue smokes passed.");
