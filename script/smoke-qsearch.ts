/**
 * QSearch smoke / bug checks (offline).
 * Run: npx tsx script/smoke-qsearch.ts
 */
import { isNonEventListing } from "../server/ingest";
import { isPastEventListing } from "../server/ingest/dates";
import { matchDirectoryBrands } from "../server/qsearch/directoryBrands";
import { assessCatalogRecurring, buildScanCandidates } from "../server/qsearch/analyze";
import { storage } from "../server/storage";
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

// --- Offline unit checks ---
assert(isNonEventListing({ title: "Closed", description: "" }), "filter Closed");
assert(isNonEventListing({ title: "Closed for the Holidays", description: "" }), "filter Closed for Holidays");
assert(!isNonEventListing({ title: "Fresh Paint", description: "open call" }), "keep real events");
assert(isPastEventListing({ dateStart: "2020-01-01T12:00:00", dateEnd: "2020-01-01T14:00:00" }), "past detect");
assert(!isPastEventListing({ dateStart: "2099-01-01T12:00:00", dateEnd: "2099-01-01T14:00:00" }), "future detect");

const businesses = storage.getBusinesses({});
const brands = matchDirectoryBrands(
  {
    title: "Night with Pink Ponies",
    description: "special",
    venueName: "Badlands",
    address: "110 NW Broadway",
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart: "2099-08-01T21:00:00",
    dateEnd: "2099-08-02T02:00:00",
    dayOfWeek: "FRI",
    ageRequirement: "ALL_AGES",
    eventTypes: "[]",
    admission: "FREE",
    ticketUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    sourceUrl: null,
    parseSource: "jsonld",
    warnings: [],
  },
  businesses,
);
assert(brands.some(b => /badlands/i.test(b.name)), "directory venue match Badlands");
assert(brands.some(b => b.role === "group" || /ponies/i.test(b.name)), "directory group match Pink Ponies");

const base: Event = {
  id: 1,
  title: "Karaoke",
  description: "x",
  venueName: "Scandals",
  address: null,
  neighborhood: null,
  lat: null,
  lng: null,
  dateStart: "2099-08-04T21:00:00",
  dateEnd: "2099-08-05T01:00:00",
  dayOfWeek: "MON",
  ageRequirement: "ALL_AGES",
  eventTypes: "[]",
  admission: "FREE",
  ticketUrl: null,
  isPublic: true,
  isPrivate: false,
  isHouseParty: false,
  isSexPositive: false,
  nudityOk: false,
  posterImageUrl: null,
  status: "LIVE",
  source: "admin_seeded",
  isClaimable: true,
  claimedBy: null,
  submittedBy: null,
  adminNotes: null,
  createdAt: "",
};

const one = assessCatalogRecurring(base, [base]);
assert(one.status === "catalog_one_off_needs_recurring_update", "one-off needs recurring update");

const series = assessCatalogRecurring(base, [
  base,
  { ...base, id: 2, dateStart: "2099-08-11T21:00:00", dateEnd: "2099-08-12T01:00:00" },
  { ...base, id: 3, dateStart: "2099-08-18T21:00:00", dateEnd: "2099-08-19T01:00:00" },
]);
assert(series.status === "catalog_already_recurring", "multi-week = already recurring");

const draftA = {
  ...base,
  title: "Karaoke",
  venueName: "Scandals",
  dateStart: "2099-08-04T21:00:00",
  dateEnd: "2099-08-05T01:00:00",
  dayOfWeek: "MON",
  parseSource: "jsonld" as const,
  warnings: [] as string[],
  sourceUrl: null,
};
const draftPast = {
  ...draftA,
  title: "Old Night",
  dateStart: "2020-01-01T21:00:00",
  dateEnd: "2020-01-02T01:00:00",
};
const draftFuture = {
  ...draftA,
  title: "New Night",
  dateStart: "2099-09-01T21:00:00",
  dateEnd: "2099-09-02T01:00:00",
};

const noPast = buildScanCandidates(
  [
    { draft: draftPast as any, sourceId: "a", sourceLabel: "A", sourceUrl: "https://x.test" },
    { draft: draftFuture as any, sourceId: "a", sourceLabel: "A", sourceUrl: "https://x.test" },
  ],
  [],
  businesses,
  { includePastEvents: false },
);
assert(noPast.length === 1 && noPast[0]!.draft.title === "New Night", "default drops past events");

const withPast = buildScanCandidates(
  [
    { draft: draftPast as any, sourceId: "a", sourceLabel: "A", sourceUrl: "https://x.test" },
    { draft: draftFuture as any, sourceId: "a", sourceLabel: "A", sourceUrl: "https://x.test" },
  ],
  [],
  businesses,
  { includePastEvents: true },
);
assert(withPast.length === 2, "includePastEvents keeps past + future");

// The live /api/admin/qsearch API was archived on 2026-08-30 and answers 410;
// its end-to-end checks were retired with it. These offline checks still guard
// the shared ingest and analyze code.

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nQSearch smoke checks passed.");
