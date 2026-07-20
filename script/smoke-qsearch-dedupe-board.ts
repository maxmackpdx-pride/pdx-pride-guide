/**
 * Smoke: main-board de-dupe for QSearch Review.
 * - One-offs already LIVE/HIDDEN never enter the queue
 * - Series keeps only dates not already on the board
 * Run: npx tsx script/smoke-qsearch-dedupe-board.ts
 */
import { buildScanCandidates, applyCatalogCoverage, strongCatalogDuplicate } from "../server/qsearch/analyze";
import type { IngestEventDraft } from "../server/ingest/types";
import type { Event } from "@shared/schema";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

function draft(over: Partial<IngestEventDraft> & { title: string; dateStart: string }): IngestEventDraft {
  return {
    title: over.title,
    description: over.description || `${over.title} at Eagle.`,
    venueName: over.venueName || "Eagle Portland",
    address: over.address || "835 N Lombard St, Portland, OR 97217",
    neighborhood: "North Portland",
    lat: null,
    lng: null,
    dateStart: over.dateStart,
    dateEnd: over.dateEnd || over.dateStart.replace(/T.*/, "T23:00:00"),
    dayOfWeek: over.dayOfWeek || null,
    ageRequirement: "21_PLUS",
    eventTypes: "[]",
    admission: "UNKNOWN",
    ticketUrl: over.ticketUrl || null,
    eventPageUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    sourceUrl: "https://www.eagleportland.com/what-s-happening",
    parseSource: "wix",
    warnings: [],
  };
}

function fakeEvent(id: number, title: string, dateStart: string, status: string = "LIVE"): Event {
  return {
    id,
    title,
    description: title,
    venueName: "Eagle Portland",
    address: "835 N Lombard St, Portland, OR 97217",
    neighborhood: "North Portland",
    lat: null,
    lng: null,
    dateStart,
    dateEnd: dateStart.replace(/T.*/, "T23:00:00"),
    dayOfWeek: null,
    ageRequirement: "21_PLUS",
    eventTypes: "[]",
    admission: "UNKNOWN",
    ticketUrl: null,
    posterImageUrl: null,
    status,
    source: "url_ingest",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    createdAt: new Date().toISOString(),
  } as Event;
}

// --- strong match helper ---
const karaoke = draft({ title: "Karaoke", dateStart: "2026-07-22T20:00:00" });
const board = [fakeEvent(132, "Karaoke", "2026-07-22T20:00:00")];
assert(!!strongCatalogDuplicate(karaoke, board), "Karaoke matches LIVE #132");
assert(!strongCatalogDuplicate(draft({ title: "Brand New Night", dateStart: "2026-09-01T21:00:00" }), board), "new title not a dup");

// --- one-off already on board → not queued ---
const rawOne = [
  {
    draft: karaoke,
    sourceId: "eagle-events",
    sourceLabel: "Trusted · Eagle Portland",
    sourceUrl: "https://www.eagleportland.com/what-s-happening",
  },
  {
    draft: draft({ title: "Brand New Night", dateStart: "2026-09-01T21:00:00" }),
    sourceId: "eagle-events",
    sourceLabel: "Trusted · Eagle Portland",
    sourceUrl: "https://www.eagleportland.com/what-s-happening",
  },
];
const cands = buildScanCandidates(rawOne, board, []);
assert(cands.length === 1, `only new one-off queued (got ${cands.length})`);
assert(cands[0].draft.title === "Brand New Night", "queued card is the new night");

// --- series: 4 Mondays, 2 already on board → only 2 new dates ---
const weeks = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"];
const seriesRaw = weeks.map(day => ({
  draft: draft({
    title: "Musical Mondays",
    venueName: "Badlands",
    address: "110 NW Broadway, Portland, OR",
    dateStart: `${day}T21:00:00`,
    dateEnd: `${day}T23:00:00`,
    dayOfWeek: "MON",
  }),
  sourceId: "badlands-api",
  sourceLabel: "Badlands",
  sourceUrl: "https://example.com/cal",
}));
const seriesBoard: Event[] = [
  fakeEvent(200, "Musical Mondays", "2026-08-03T21:00:00", "LIVE"),
  fakeEvent(201, "Musical Mondays", "2026-08-10T21:00:00", "HIDDEN"),
];
// fix venue on board
seriesBoard[0].venueName = "Badlands";
seriesBoard[0].address = "110 NW Broadway, Portland, OR";
seriesBoard[1].venueName = "Badlands";
seriesBoard[1].address = "110 NW Broadway, Portland, OR";

const seriesCands = buildScanCandidates(seriesRaw, seriesBoard, []);
assert(seriesCands.length === 1, "one series card after prune");
assert(seriesCands[0].memberDrafts.length === 2, `2 new series nights (got ${seriesCands[0].memberDrafts.length})`);
assert(
  seriesCands[0].memberDrafts.every(m => !m.dateStart.startsWith("2026-08-03") && !m.dateStart.startsWith("2026-08-10")),
  "kept only Aug 17 + Aug 24",
);
assert(seriesCands[0].alreadyOnBoard?.length === 2, "reports 2 already on board");

// --- fully covered series → nothing queued ---
const allCoveredBoard: Event[] = weeks.map((day, i) => {
  const e = fakeEvent(300 + i, "Musical Mondays", `${day}T21:00:00`);
  e.venueName = "Badlands";
  e.address = "110 NW Broadway, Portland, OR";
  return e;
});
const none = buildScanCandidates(seriesRaw, allCoveredBoard, []);
assert(none.length === 0, "fully covered series does not enter Review");

// applyCatalogCoverage null for pure dup
const pureDup = buildScanCandidates(
  [
    {
      draft: karaoke,
      sourceId: "eagle-events",
      sourceLabel: "Eagle",
      sourceUrl: "https://x",
    },
  ],
  [],
  [],
)[0];
// force coverage against board
const dropped = applyCatalogCoverage(pureDup, board);
assert(dropped === null, "applyCatalogCoverage drops pure dup");

console.log("\nAll main-board de-dupe smokes passed.");
