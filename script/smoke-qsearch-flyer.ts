/**
 * Offline smoke for the QSearch vision flyer QA (server/qsearch/verifyFlyer.ts).
 * Mocks the vision endpoint via fetchImpl — no network, no keys. Run:
 *   npx tsx script/smoke-qsearch-flyer.ts
 */
import type { ScanCandidate } from "../server/qsearch/analyze";
import type { IngestEventDraft } from "../server/ingest/types";
import { verifyAndRepairFlyers } from "../server/qsearch/verifyFlyer";

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

function draft(over: Partial<IngestEventDraft>): IngestEventDraft {
  return {
    title: "Neon Bloom", description: "", venueName: "Analog Theater", address: null,
    neighborhood: null, lat: null, lng: null,
    dateStart: "2026-07-17T20:00", dateEnd: "2026-07-18T02:00", dayOfWeek: "Friday",
    ageRequirement: "ALL_AGES", eventTypes: "", admission: "", ticketUrl: null,
    isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false,
    nudityOk: false, posterImageUrl: null, sourceUrl: null, parseSource: "jsonld",
    warnings: [], ...over,
  };
}

function cand(id: string, over: Partial<IngestEventDraft>, bundlePosters: string[] = []): ScanCandidate {
  return {
    id, draft: draft(over), sourceId: "src", sourceLabel: "example.com",
    sourceUrl: "https://example.com/e", selected: true, recurring: null,
    recurringGroupId: null, recurringCount: 0, condensed: false, conflicts: [],
    duplicates: [], strongDuplicate: null, recurringDupAction: null, directoryBrands: [],
    sourceBundle: bundlePosters.map((p, i) => ({
      sourceId: `b${i}`, sourceLabel: "alt", sourceUrl: "https://alt/e", posterImageUrl: p,
    })) as any,
    fieldConflicts: [], memberDrafts: [],
  };
}

// Mock vision: verdict keyed off the image URL; echoes the event date for good flyers.
const mockFetch = (async (_url: string, init?: any) => {
  const body = JSON.parse(init.body);
  const text = body.messages[0].content[0].text as string;
  const img = body.messages[0].content[1].image_url.url as string;
  const event = JSON.parse(text.slice(text.indexOf("EVENT:") + 6));
  let v: Record<string, unknown>;
  if (/logo/.test(img)) v = { isEventFlyer: false, isLogo: true, match: 0.15, reason: "venue logo" };
  else if (/wrongday/.test(img)) v = { isEventFlyer: true, isLogo: false, match: 0.2, readsDate: "2099-01-01", reason: "date differs" };
  else if (/good|alt/.test(img)) v = { isEventFlyer: true, isLogo: false, match: 0.92, readsDate: event.date, reason: "same event" };
  else v = { isEventFlyer: true, isLogo: false, match: 0.5, reason: "unclear" };
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(v) } }] }) } as any;
}) as unknown as typeof fetch;

async function main() {
  // Disabled ⇒ passthrough (no flyerMatch set)
  delete process.env.QSEARCH_SCRUB_FLYER_VISION;
  const off = await verifyAndRepairFlyers([cand("x", { posterImageUrl: "https://img/good.jpg" })], { fetchImpl: mockFetch });
  check("disabled: nothing checked", off.checked === 0);

  process.env.QSEARCH_SCRUB_FLYER_VISION = "1";
  process.env.XAI_API_KEY = "test-key"; // makes visionConfigured() non-null

  // 1) Correct poster ⇒ high match, no repair
  const good = cand("c1", { posterImageUrl: "https://img/good.jpg" });
  await verifyAndRepairFlyers([good], { fetchImpl: mockFetch });
  check("good poster: flyerMatch high", (good.draft.flyerMatch ?? 0) >= 0.9);
  check("good poster: not repaired", good.draft.posterImageUrl === "https://img/good.jpg");

  // 2) Logo poster + a good alternative in the bundle ⇒ flagged + repaired
  const logo = cand("c2", { posterImageUrl: "https://img/logo.png" }, ["https://img/alt-good.jpg"]);
  await verifyAndRepairFlyers([logo], { fetchImpl: mockFetch });
  check("logo poster: flagged as logo", logo.draft.warnings.some(w => /logo/i.test(w)));
  check("logo poster: repaired to alternative", logo.draft.posterImageUrl === "https://img/alt-good.jpg");

  // 3) Wrong-day poster, no alternative ⇒ flagged mismatch, poster kept (never stripped)
  const wrong = cand("c3", { posterImageUrl: "https://img/wrongday.jpg" });
  await verifyAndRepairFlyers([wrong], { fetchImpl: mockFetch });
  check("wrong-day: flagged mismatch", wrong.draft.warnings.some(w => /mismatch/i.test(w)));
  check("wrong-day: poster NOT stripped", wrong.draft.posterImageUrl === "https://img/wrongday.jpg");

  // 4) No flyer + good alternative ⇒ acquired
  const missing = cand("c4", { posterImageUrl: null }, ["https://img/alt-good.jpg"]);
  await verifyAndRepairFlyers([missing], { fetchImpl: mockFetch });
  check("missing flyer: acquired from alternative", missing.draft.posterImageUrl === "https://img/alt-good.jpg");

  // 5) No flyer + only a bad (logo) alternative ⇒ stays flyerless (never a wrong guess)
  const noGood = cand("c5", { posterImageUrl: null }, ["https://img/logo.png"]);
  await verifyAndRepairFlyers([noGood], { fetchImpl: mockFetch });
  check("no good alt: stays flyerless", noGood.draft.posterImageUrl == null);

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
