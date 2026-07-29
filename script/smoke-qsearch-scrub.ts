/**
 * Offline smoke for the QSearch AI scrub (server/qsearch/scrubLlm.ts).
 * Mocks the LLM via fetchImpl — no network, no keys. Run:
 *   npx tsx script/smoke-qsearch-scrub.ts
 */
import type { ScanCandidate } from "../server/qsearch/analyze";
import type { IngestEventDraft } from "../server/ingest/types";
import { scrubCandidates } from "../server/qsearch/scrubLlm";

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

function draft(over: Partial<IngestEventDraft>): IngestEventDraft {
  return {
    title: "Untitled",
    description: "",
    venueName: "TBA",
    address: null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart: "2026-08-01T21:00",
    dateEnd: "2026-08-02T02:00",
    dayOfWeek: "Saturday",
    ageRequirement: "ALL_AGES",
    eventTypes: "",
    admission: "",
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
    ...over,
  };
}

function cand(id: string, over: Partial<IngestEventDraft>): ScanCandidate {
  return {
    id,
    draft: draft(over),
    sourceId: "src",
    sourceLabel: "example.com",
    sourceUrl: "https://example.com/events",
    selected: true,
    recurring: null,
    recurringGroupId: null,
    recurringCount: 0,
    condensed: false,
    conflicts: [],
    duplicates: [],
    strongDuplicate: null,
    recurringDupAction: null,
    directoryBrands: [],
    sourceBundle: [],
    fieldConflicts: [],
    memberDrafts: [],
  };
}

// Mock LLM: reads the candidate snapshot from the request and returns a verdict.
const mockFetch = (async (_url: string, init?: any) => {
  const body = JSON.parse(init.body);
  const snap = JSON.parse(body.messages[1].content);
  const title = String(snap.title || "").toLowerCase();
  let v: Record<string, unknown>;
  if (title.includes("golf") || title.includes("wrestling")) {
    v = { relevance: 0.05, isEvent: false, noiseReason: "not an LGBTQ+ event", category: "other" };
  } else if (title.includes("play party")) {
    v = {
      relevance: 0.9, isEvent: true, noiseReason: null, category: "kink",
      ageFlag: "21_PLUS", sexPositive: true, kink: true,
    };
  } else {
    v = { relevance: 0.85, isEvent: true, noiseReason: null, category: "drag", cleanVenue: "Real Venue" };
  }
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(v) } }] }),
  } as any;
}) as unknown as typeof fetch;

async function main() {
  const input = () => [
    cand("c1", { title: "Saturday Drag Brunch", venueName: "TBA" }),
    cand("c2", { title: "Charity Golf Scramble" }),
    cand("c3", { title: "Leather Play Party" }),
  ];

  // 1) Disabled ⇒ pure passthrough (no env). Snapshot before/after must match.
  delete process.env.QSEARCH_SCRUB_LLM;
  const before = JSON.stringify(input());
  const off = await scrubCandidates(input(), { fetchImpl: mockFetch });
  check("disabled: nothing dropped", off.dropped.length === 0);
  check("disabled: kept all 3", off.kept.length === 3);
  check("disabled: candidates untouched", JSON.stringify(off.kept) === before);

  // 2) Enabled with a fake key + mock LLM.
  process.env.QSEARCH_SCRUB_LLM = "1";
  process.env.GROQ_API_KEY = "test-key";
  const on = await scrubCandidates(input(), { fetchImpl: mockFetch, allowPausedForTest: true });

  check("enabled: golf scramble dropped", on.dropped.some(d => d.candidate.id === "c2"));
  check("enabled: drop has a reason", on.dropped[0]?.reason?.length > 0);
  check("enabled: kept the 2 real events", on.kept.length === 2 && !on.kept.some(c => c.id === "c2"));

  const brunch = on.kept.find(c => c.id === "c1")!;
  check("brunch: relevanceScore set", brunch.draft.relevanceScore === 0.85);
  check("brunch: aiScrubbed true", brunch.draft.aiScrubbed === true);
  check("brunch: weak 'TBA' venue cleaned", brunch.draft.venueName === "Real Venue");

  const party = on.kept.find(c => c.id === "c3")!;
  check("play party: 21+ stamped", party.draft.ageRequirement === "21_PLUS");
  check("play party: sex-positive stamped", party.draft.isSexPositive === true);
  check("play party: KINK type stamped", party.draft.eventTypes.includes("KINK"));
  check(
    "play party: eventTypes remains valid JSON",
    Array.isArray(JSON.parse(party.draft.eventTypes)) && JSON.parse(party.draft.eventTypes).includes("KINK"),
  );

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
