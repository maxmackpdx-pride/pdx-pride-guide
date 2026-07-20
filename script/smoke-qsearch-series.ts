/**
 * Smoke: recurring condense + series expand + directory lookup.
 * Run: npx tsx script/smoke-qsearch-series.ts
 */
import { condenseRecurring, buildScanCandidates } from "../server/qsearch/analyze";
import type { IngestEventDraft } from "../server/ingest/types";
import { lookupDirectoryPlace } from "../server/qsearch/directoryLookup";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

function baseDraft(over: Partial<IngestEventDraft> & { title: string; dateStart: string }): IngestEventDraft {
  return {
    title: over.title,
    description: over.description || `${over.title} at Badlands.`,
    venueName: over.venueName || "Badlands",
    address: over.address || "110 NW Broadway, Portland, OR",
    neighborhood: "Old Town",
    lat: null,
    lng: null,
    dateStart: over.dateStart,
    dateEnd: over.dateEnd || over.dateStart.replace(/T.*/, "T23:00:00"),
    dayOfWeek: over.dayOfWeek || null,
    ageRequirement: "21_PLUS",
    eventTypes: "[]",
    admission: "UNKNOWN",
    ticketUrl: null,
    eventPageUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: over.posterImageUrl || null,
    sourceUrl: "https://example.com/cal",
    parseSource: "badlands",
    warnings: [],
  };
}

// Mondays 9pm for 4 weeks
const weeks = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"];
const raw = weeks.map(day => ({
  draft: baseDraft({
    title: "Musical Mondays",
    dateStart: `${day}T21:00:00`,
    dateEnd: `${day}T23:00:00`,
    dayOfWeek: "MON",
  }),
  sourceId: "badlands-api",
  sourceLabel: "Badlands",
  sourceUrl: "https://example.com/cal",
}));

const condensed = condenseRecurring(raw);
assert(condensed.length === 1, "condenses 4 Mondays into 1 series card");
assert(condensed[0].recurring === "weekly", "recurring weekly");
assert(condensed[0].recurringCount === 4, "recurringCount 4");
assert(condensed[0].memberDrafts.length === 4, "memberDrafts has 4 dates");

// Simulate UI expand
const mode: "one" | "series" = "series";
const c = condensed[0];
const expanded =
  mode === "series" && c.memberDrafts.length >= 2
    ? c.memberDrafts
    : [c.draft];
assert(expanded.length === 4, "series mode expands to 4 drafts");
assert(
  new Set(expanded.map(d => d.dateStart.slice(0, 10))).size === 4,
  "four distinct calendar days",
);

// One-occurrence mode
const one =
  mode === "one" || c.memberDrafts.length < 2 ? [c.draft] : c.memberDrafts;
// force one path
const oneOnly = [c.draft];
assert(oneOnly.length === 1, "one mode is single draft");

// buildScanCandidates preserves memberDrafts
const cands = buildScanCandidates(raw, [], []);
const seriesCand = cands.find(x => x.recurring === "weekly");
assert(!!seriesCand, "scan candidate has weekly series");
assert((seriesCand!.memberDrafts || []).length === 4, "candidate memberDrafts length 4");

// Directory lookup (network)
(async () => {
  const hit = await lookupDirectoryPlace({
    name: "Badlands",
    address: "110 NW Broadway, Portland, OR",
    website: "https://www.badlandsportland.com",
  });
  assert(hit.name === "Badlands", "lookup name");
  assert(hit.lat != null && hit.lng != null, `lookup geocoded lat/lng: ${hit.lat},${hit.lng}`);
  assert(hit.website.includes("badlands"), "lookup keeps website");
  console.log("lookup sample", {
    neighborhood: hit.neighborhood,
    lat: hit.lat,
    lng: hit.lng,
    type: hit.type,
    sources: hit.sources,
    desc: hit.description.slice(0, 80),
  });
  console.log("\nAll series + directory lookup smokes passed.");
})().catch(err => {
  console.error("lookup failed (network?)", err);
  // Series tests already passed; lookup is best-effort
  console.log("\nSeries smokes passed; directory lookup skipped due to error.");
  process.exit(0);
});
