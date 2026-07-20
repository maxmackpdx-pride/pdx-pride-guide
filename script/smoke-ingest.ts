/**
 * Offline smoke for Phase 4 event ingest parsers (no HTTP server required).
 * Run: npx tsx script/smoke-ingest.ts
 */
import { parseJsonLdFromHtml } from "../server/ingest/parseJsonLd";
import { parseIcs } from "../server/ingest/parseIcs";
import {
  expandBadlandsCalendarUrl,
  looksLikeBadlandsJson,
  parseBadlandsJson,
} from "../server/ingest/parseBadlands";
import { dayOfWeekFromStart, isPastEventListing, toPacificWallClock } from "../server/ingest/dates";
import { commitIngest, isNonEventListing } from "../server/ingest";
import { assessCatalogRecurring, buildScanCandidates } from "../server/qsearch/analyze";
import type { Event } from "../shared/schema";

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

const html = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Smoke Test Pride Night",
  "description": "A parser self-test event.",
  "startDate": "2026-08-01T21:00:00-07:00",
  "endDate": "2026-08-02T02:00:00-07:00",
  "location": {
    "@type": "Place",
    "name": "Badlands",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "223 SW Stark St",
      "addressLocality": "Portland",
      "addressRegion": "OR"
    }
  },
  "offers": { "@type": "Offer", "price": "15", "priceCurrency": "USD", "url": "https://example.com/tix" },
  "image": "https://example.com/poster.jpg"
}
</script>
</head><body></body></html>
`;

const drafts = parseJsonLdFromHtml(html, "https://example.com/event");
assert(drafts.length === 1, "JSON-LD yields 1 event");
assert(drafts[0]?.title === "Smoke Test Pride Night", "title mapped");
assert(drafts[0]?.venueName === "Badlands", "venue mapped");
assert(drafts[0]?.dateStart.startsWith("2026-08-01T21:"), `start in Pacific wall clock: ${drafts[0]?.dateStart}`);
assert(drafts[0]?.ticketUrl === "https://example.com/tix", "ticket url from offers");
assert(drafts[0]?.posterImageUrl === "https://example.com/poster.jpg", "poster image");

const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260815T200000
DTEND:20260815T230000
SUMMARY:ICS Smoke Party
LOCATION:CC Slaughters\\, Portland
DESCRIPTION:Calendar feed test
URL:https://example.com/ics-party
END:VEVENT
END:VCALENDAR
`;
const icsDrafts = parseIcs(ics, "https://example.com/cal.ics");
assert(icsDrafts.length === 1, "ICS yields 1 event");
assert(icsDrafts[0]?.title === "ICS Smoke Party", "ICS title");
assert(icsDrafts[0]?.dateStart === "2026-08-15T20:00:00", "ICS floating local start");
assert(dayOfWeekFromStart(icsDrafts[0]!.dateStart) != null, "dayOfWeek derived");

const wall = toPacificWallClock("2026-07-18T21:00:00Z");
assert(!!wall && wall.includes("2026-07-1"), `UTC converts to Pacific: ${wall}`);

const badlandsRaw = JSON.stringify({
  events: [
    {
      id: "fp-1",
      title: "Fresh Paint",
      start: "2026-08-04T21:00:00-07:00",
      end: "2026-08-05T02:00:00-07:00",
      blurb: "Monday drag showcase.",
      photoUrl: "https://example.com/fresh-paint.jpg",
      link: "https://www.badlandsportland.com/calendar",
      location: "Badlands",
    },
    {
      title: "No Start Skip",
      // missing start — should skip
      blurb: "ignored",
    },
  ],
});
assert(looksLikeBadlandsJson(badlandsRaw), "looksLikeBadlandsJson true");
const blDrafts = parseBadlandsJson(
  badlandsRaw,
  "https://badlands-events.badlandsportland.workers.dev/api/calendar",
);
assert(blDrafts.length === 1, "Badlands yields 1 (skips no-start)");
assert(blDrafts[0]?.title === "Fresh Paint", "Badlands title");
assert(blDrafts[0]?.venueName === "Badlands", "Badlands venue");
assert(blDrafts[0]?.address === "110 NW Broadway, Portland, OR", "Badlands address");
assert(blDrafts[0]?.neighborhood === "Old Town", "Badlands neighborhood");
assert(blDrafts[0]?.posterImageUrl === "https://example.com/fresh-paint.jpg", "Badlands photoUrl");
assert(blDrafts[0]?.parseSource === "badlands", "parseSource badlands");
assert(blDrafts[0]?.dateStart.startsWith("2026-08-04T21:"), `Badlands start wall: ${blDrafts[0]?.dateStart}`);
assert(dayOfWeekFromStart(blDrafts[0]!.dateStart) != null, "Badlands dayOfWeek");
const expanded = expandBadlandsCalendarUrl(
  "https://badlands-events.badlandsportland.workers.dev/api/calendar",
);
assert(/[?&]from=\d{4}-\d{2}-\d{2}/.test(expanded), `expand from: ${expanded}`);
assert(/[?&]to=\d{4}-\d{2}-\d{2}/.test(expanded), `expand to: ${expanded}`);
const already = expandBadlandsCalendarUrl(
  "https://badlands-events.badlandsportland.workers.dev/api/calendar?from=2026-07-01&to=2026-07-31",
);
assert(already.includes("from=2026-07-01") && already.includes("to=2026-07-31"), "expand leaves existing window");

let nextId = 9000;
const created: Event[] = [];
const result = await commitIngest({
  items: [{ draft: drafts[0]! }, { draft: icsDrafts[0]! }],
  status: "HIDDEN",
  skipDuplicates: true,
  existingEvents: [],
  createEvent: (data) => {
    const row = { ...data, id: nextId++, createdAt: new Date().toISOString() } as Event;
    created.push(row);
    return row;
  },
});
assert(result.ok === true, "commit ok");
if (result.ok) {
  assert(result.created.length === 2, "created 2 HIDDEN");
  assert(result.created.every(c => c.status === "HIDDEN"), "status HIDDEN");
}

const dup = await commitIngest({
  items: [{ draft: drafts[0]! }],
  status: "HIDDEN",
  skipDuplicates: true,
  existingEvents: created,
  createEvent: (data) => ({ ...data, id: nextId++, createdAt: new Date().toISOString() }) as Event,
});
assert(dup.ok === true && dup.ok && dup.created.length === 0 && dup.skipped.length === 1, "duplicate skipped");

// Recurring-aware dup assessment
const catalogEvt = {
  ...created[0]!,
  dayOfWeek: "MON",
  adminNotes: null,
} as Event;
const oneOff = assessCatalogRecurring(catalogEvt, [catalogEvt]);
assert(
  oneOff.status === "catalog_one_off_needs_recurring_update",
  "single catalog listing flagged for recurring update: " + oneOff.status,
);
const weeklyCatalog = [
  catalogEvt,
  { ...catalogEvt, id: 9001, dateStart: "2026-08-08T21:00:00", dateEnd: "2026-08-09T01:00:00" },
  { ...catalogEvt, id: 9002, dateStart: "2026-08-15T21:00:00", dateEnd: "2026-08-16T01:00:00" },
] as Event[];
const series = assessCatalogRecurring(catalogEvt, weeklyCatalog);
assert(series.status === "catalog_already_recurring", "multi-instance catalog = already recurring");

const weeklyDraft = {
  ...drafts[0]!,
  title: "Karaoke",
  venueName: "Scandals",
  dateStart: "2026-08-04T21:00:00",
  dateEnd: "2026-08-05T01:00:00",
  dayOfWeek: "MON",
};
const cands = buildScanCandidates(
  [
    { draft: weeklyDraft, sourceId: "t", sourceLabel: "T", sourceUrl: "https://x.test" },
    {
      draft: { ...weeklyDraft, dateStart: "2026-08-11T21:00:00", dateEnd: "2026-08-12T01:00:00" },
      sourceId: "t",
      sourceLabel: "T",
      sourceUrl: "https://x.test",
    },
  ],
  weeklyCatalog.map(e => ({ ...e, title: "Karaoke", venueName: "Scandals", dayOfWeek: "MON" })),
);
assert(cands[0]?.recurring === "weekly", "scan condenses weekly");
assert(!!cands[0]?.recurringDupAction || !!cands[0]?.strongDuplicate, "recurring dup action or strong dup set");

assert(isNonEventListing({ title: "Closed for the Holidays", description: "" }), "closed for holidays is not an event");
assert(isNonEventListing({ title: "Closed", description: "We are closed today" }), "closed is not an event");
assert(isNonEventListing({ title: "We're closed", description: "" }), "we're closed is not an event");
assert(isNonEventListing({ title: "Holiday Closure", description: "See you in January" }), "holiday closure filtered");
assert(isNonEventListing({ title: "Closed for Renovation", description: "" }), "closed for renovation is not an event");
assert(
  !isNonEventListing({ title: "Reopening Night", description: "We were closed for renovation — now open" }),
  "reopening night is an event",
);
assert(
  !isNonEventListing({ title: "Fresh Paint", description: "Weekly open call" }),
  "normal events not filtered",
);

assert(
  isPastEventListing({ dateStart: "2020-01-01T20:00:00", dateEnd: "2020-01-01T23:00:00" }),
  "old listing is past",
);
assert(
  !isPastEventListing({ dateStart: "2099-06-01T20:00:00", dateEnd: "2099-06-01T23:00:00" }),
  "future listing is not past",
);

const pastRaw = [
  {
    draft: {
      ...weeklyDraft,
      title: "Past Karaoke",
      dateStart: "2020-08-04T21:00:00",
      dateEnd: "2020-08-05T01:00:00",
    },
    sourceId: "t",
    sourceLabel: "T",
    sourceUrl: "https://x.test",
  },
  {
    draft: {
      ...weeklyDraft,
      title: "Future Karaoke",
      dateStart: "2099-08-11T21:00:00",
      dateEnd: "2099-08-12T01:00:00",
    },
    sourceId: "t",
    sourceLabel: "T",
    sourceUrl: "https://x.test",
  },
];
const noPast = buildScanCandidates(pastRaw as any, [], [], { includePastEvents: false });
assert(
  noPast.every(c => c.draft.title.includes("Future") || !isPastEventListing(c.draft)),
  "past filtered out when includePastEvents false",
);
const withPast = buildScanCandidates(pastRaw as any, [], [], { includePastEvents: true });
assert(withPast.length >= noPast.length, "includePast keeps more or equal candidates");

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll ingest smoke checks passed.");
