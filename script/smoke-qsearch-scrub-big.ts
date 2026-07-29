/**
 * BIG offline test for the QSearch AI scrub + flyer QA. Large realistic scenario
 * matrix + robustness/failure paths, all with mocked models (no network/keys).
 *   npx tsx script/smoke-qsearch-scrub-big.ts
 */
import type { ScanCandidate, DuplicateInfo } from "../server/qsearch/analyze";
import type { IngestEventDraft } from "../server/ingest/types";
import { scrubCandidates } from "../server/qsearch/scrubLlm";
import { verifyAndRepairFlyers } from "../server/qsearch/verifyFlyer";

let failures = 0;
let total = 0;
function check(name: string, cond: boolean) {
  total++;
  if (!cond) {
    failures++;
    console.log(`✗ ${name}`);
  }
}
function section(t: string) {
  console.log(`\n── ${t} ──`);
}

function draft(o: Partial<IngestEventDraft>): IngestEventDraft {
  return {
    title: "Untitled", description: "", venueName: "TBA", address: null, neighborhood: null,
    lat: null, lng: null, dateStart: "2026-08-01T21:00", dateEnd: "2026-08-02T02:00",
    dayOfWeek: "Saturday", ageRequirement: "ALL_AGES", eventTypes: "", admission: "",
    ticketUrl: null, isPublic: true, isPrivate: false, isHouseParty: false,
    isSexPositive: false, nudityOk: false, posterImageUrl: null, sourceUrl: null,
    parseSource: "jsonld", warnings: [], ...o,
  };
}
function cand(id: string, o: Partial<IngestEventDraft>, extra: Partial<ScanCandidate> = {}): ScanCandidate {
  return {
    id, draft: draft(o), sourceId: "src", sourceLabel: "example.com",
    sourceUrl: "https://example.com/e", selected: true, recurring: null, recurringGroupId: null,
    recurringCount: 0, condensed: false, conflicts: [], duplicates: [], strongDuplicate: null,
    recurringDupAction: null, directoryBrands: [], sourceBundle: [], fieldConflicts: [],
    memberDrafts: [], ...extra,
  };
}
function dup(score: number): DuplicateInfo {
  return { eventId: 42, title: "Existing", score, confidence: "med", catalogRecurring: null, catalogRecurringStatus: "none" as any, note: "" };
}

// ── Semantic mock LLM: verdict keyed off title, honors a few control tokens ──
function scrubMock(overrides?: (title: string) => Record<string, unknown> | null): typeof fetch {
  return (async (_u: string, init: any) => {
    const snap = JSON.parse(JSON.parse(init.body).messages[1].content);
    const t = String(snap.title || "").toLowerCase();
    const o = overrides?.(t);
    if (o === null) return { ok: false, status: 500, json: async () => ({}) } as any; // simulate provider error
    let v: Record<string, unknown>;
    if (o) v = o;
    else if (/golf|wrestling|strongfirst|hoa meeting|mlm/.test(t)) v = { relevance: 0.05, isEvent: false, noiseReason: "not a queer event", category: "other" };
    else if (/play party|leather|dungeon/.test(t)) v = { relevance: 0.92, isEvent: true, category: "kink", ageFlag: "21_PLUS", sexPositive: true, kink: true };
    else if (/maybe|open mic/.test(t)) v = { relevance: 0.45, isEvent: true, category: "community" };
    else if (/tba fix/.test(t)) v = { relevance: 0.8, isEvent: true, category: "bar", cleanVenue: "The Real Bar" };
    else v = { relevance: 0.88, isEvent: true, category: "drag" };
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(v) } }] }) } as any;
  }) as unknown as typeof fetch;
}

async function run() {
  process.env.QSEARCH_SCRUB_LLM = "1";
  process.env.GROQ_API_KEY = "test";
  delete process.env.QSEARCH_SCRUB_MAX;

  section("Scrub: keep / drop / deselect matrix");
  {
    const input = [
      cand("k1", { title: "Saturday Drag Brunch" }),
      cand("k2", { title: "Queer Night Market" }),
      cand("d1", { title: "Charity Golf Scramble" }),
      cand("d2", { title: "StrongFirst Barbell Cert" }),
      cand("d3", { title: "HOA Meeting" }),
      cand("m1", { title: "Maybe Queer Open Mic" }),
      cand("p1", { title: "Leather Play Party" }),
      cand("t1", { title: "TBA Fix Night", venueName: "TBA" }),
    ];
    const r = await scrubCandidates(input, { fetchImpl: scrubMock(), allowPausedForTest: true });
    check("3 noise dropped", r.dropped.length === 3);
    check("golf/strongfirst/hoa are the drops", ["d1", "d2", "d3"].every(id => r.dropped.some(d => d.candidate.id === id)));
    check("5 kept", r.kept.length === 5);
    check("every drop has a reason", r.dropped.every(d => d.reason.length > 0));
    const m1 = r.kept.find(c => c.id === "m1")!;
    check("borderline (0.45) is deselected", m1.selected === false);
    check("borderline still kept (not dropped)", !!m1);
    const k1 = r.kept.find(c => c.id === "k1")!;
    check("good event stays selected", k1.selected === true);
    check("good event scored", k1.draft.relevanceScore === 0.88);
    const t1 = r.kept.find(c => c.id === "t1")!;
    check("TBA venue cleaned", t1.draft.venueName === "The Real Bar");
    const p1 = r.kept.find(c => c.id === "p1")!;
    check("kink flags stamped", p1.draft.ageRequirement === "21_PLUS" && p1.draft.isSexPositive && p1.draft.eventTypes.includes("KINK"));
  }

  section("Scrub: the auto-drop INVARIANT (low score but isEvent=true ⇒ NOT dropped)");
  {
    const c = cand("inv", { title: "Weird But Real" });
    const r = await scrubCandidates([c], { fetchImpl: scrubMock(() => ({ relevance: 0.1, isEvent: true, noiseReason: "odd" })), allowPausedForTest: true });
    check("low-relevance real event kept, not dropped", r.dropped.length === 0 && r.kept.length === 1);
    check("...but deselected", r.kept[0].selected === false);
  }

  section("Scrub: safety flags never override an existing stamp");
  {
    const c = cand("stamp", { title: "Sanctuary Night", ageRequirement: "21_PLUS", isSexPositive: true });
    // Model tries to say ALL_AGES / not sex-positive; must NOT downgrade.
    const r = await scrubCandidates([c], { fetchImpl: scrubMock(() => ({ relevance: 0.9, isEvent: true, ageFlag: "ALL_AGES", sexPositive: false })), allowPausedForTest: true });
    check("existing 21+ preserved", r.kept[0].draft.ageRequirement === "21_PLUS");
    check("existing sex-positive preserved", r.kept[0].draft.isSexPositive === true);
  }

  section("Scrub: dedup band boundaries (only 48–72 gets an opinion)");
  {
    const inBand = cand("band-in", { title: "Show A" }, { strongDuplicate: dup(60) });
    const above = cand("band-hi", { title: "Show B" }, { strongDuplicate: dup(85) });
    await scrubCandidates([inBand], { fetchImpl: scrubMock(() => ({ relevance: 0.8, isEvent: true, dupVerdict: "different" })), allowPausedForTest: true });
    check("in-band 'different' clears the dup flag", inBand.strongDuplicate === null);
    await scrubCandidates([above], { fetchImpl: scrubMock(() => ({ relevance: 0.8, isEvent: true, dupVerdict: "different" })), allowPausedForTest: true });
    check("above-band dup untouched by LLM", above.strongDuplicate !== null);
  }

  section("Scrub: robustness — provider errors & junk leave candidates untouched");
  {
    const c1 = cand("err1", { title: "Golf Scramble" }); // would drop, but provider 500s
    const r1 = await scrubCandidates([c1], { fetchImpl: scrubMock(() => null), allowPausedForTest: true });
    check("HTTP 500 ⇒ candidate kept (not dropped)", r1.dropped.length === 0 && r1.kept.length === 1);
    check("HTTP 500 ⇒ aiScrubbed false", r1.kept[0].draft.aiScrubbed === false);

    const junkFetch = (async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "sorry, not JSON" } }] }) })) as unknown as typeof fetch;
    const c2 = cand("err2", { title: "Golf Scramble" });
    const r2 = await scrubCandidates([c2], { fetchImpl: junkFetch, allowPausedForTest: true });
    check("unparseable reply ⇒ kept + untouched", r2.dropped.length === 0 && r2.kept[0].draft.relevanceScore == null);
  }

  section("Scrub: per-scan cap (QSEARCH_SCRUB_MAX) — overflow untouched, order preserved");
  {
    process.env.QSEARCH_SCRUB_MAX = "3";
    const many = Array.from({ length: 6 }, (_, i) => cand(`cap${i}`, { title: i < 3 ? "Golf Scramble" : "Drag Show" }));
    const r = await scrubCandidates(many, { fetchImpl: scrubMock(), allowPausedForTest: true });
    // first 3 (golf) classified → dropped; last 3 untouched & kept
    check("only capped subset classified (3 dropped)", r.dropped.length === 3);
    check("overflow kept untouched (aiScrubbed false)", r.kept.every(c => c.draft.aiScrubbed === false));
    check("overflow preserves order", r.kept.map(c => c.id).join(",") === "cap3,cap4,cap5");
    delete process.env.QSEARCH_SCRUB_MAX;
  }

  section("Scrub: disabled ⇒ byte-identical passthrough");
  {
    delete process.env.QSEARCH_SCRUB_LLM;
    const input = [cand("z1", { title: "Golf Scramble" }), cand("z2", { title: "Drag Show" })];
    const before = JSON.stringify(input);
    const r = await scrubCandidates(input, { fetchImpl: scrubMock() });
    check("disabled: nothing dropped", r.dropped.length === 0);
    check("disabled: identical bytes", JSON.stringify(r.kept) === before);
    process.env.QSEARCH_SCRUB_LLM = "1";
  }

  // ───────────────────────── FLYER QA ─────────────────────────
  process.env.QSEARCH_SCRUB_FLYER_VISION = "1";
  process.env.XAI_API_KEY = "test";

  const visionMock = (async (_u: string, init: any) => {
    const parts = JSON.parse(init.body).messages[0].content;
    const img = parts[1].image_url.url as string;
    const ev = JSON.parse(parts[0].text.slice(parts[0].text.indexOf("EVENT:") + 6));
    let v: Record<string, unknown>;
    if (/logo/.test(img)) v = { isEventFlyer: false, isLogo: true, match: 0.1, reason: "logo" };
    else if (/wrongday/.test(img)) v = { isEventFlyer: true, isLogo: false, match: 0.2, readsDate: "2099-01-01", reason: "wrong date" };
    else if (/good|alt|page-good/.test(img)) v = { isEventFlyer: true, isLogo: false, match: 0.93, readsDate: ev.date, reason: "match" };
    else v = { isEventFlyer: true, isLogo: false, match: 0.5, reason: "meh" };
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(v) } }] }) } as any;
  }) as unknown as typeof fetch;

  section("Flyer: verify — match / logo / wrong-day");
  {
    const good = cand("f-good", { posterImageUrl: "https://i/good.jpg", title: "Neon", dateStart: "2026-07-17T20:00" });
    await verifyAndRepairFlyers([good], { fetchImpl: visionMock });
    check("good poster high match + not stripped", (good.draft.flyerMatch ?? 0) >= 0.9 && good.draft.posterImageUrl === "https://i/good.jpg");

    const wrong = cand("f-wrong", { posterImageUrl: "https://i/wrongday.jpg", dateStart: "2026-07-17T20:00" });
    await verifyAndRepairFlyers([wrong], { fetchImpl: visionMock });
    check("wrong-day flagged + poster kept", wrong.draft.warnings.some(w => /mismatch/i.test(w)) && wrong.draft.posterImageUrl === "https://i/wrongday.jpg");
  }

  section("Flyer: repair — bundle, series, page; never a wrong guess");
  {
    const fromBundle = cand("r-bundle", { posterImageUrl: "https://i/logo.png" }, { sourceBundle: [{ sourceId: "b", sourceLabel: "x", sourceUrl: "u", posterImageUrl: "https://i/alt-good.jpg" }] as any });
    await verifyAndRepairFlyers([fromBundle], { fetchImpl: visionMock });
    check("logo replaced from bundle", fromBundle.draft.posterImageUrl === "https://i/alt-good.jpg");

    const fromSeries = cand("r-series", { posterImageUrl: null }, { memberDrafts: [draft({ posterImageUrl: "https://i/alt-good.jpg" })] });
    await verifyAndRepairFlyers([fromSeries], { fetchImpl: visionMock });
    check("missing acquired from series-mate", fromSeries.draft.posterImageUrl === "https://i/alt-good.jpg");

    const fromPage = cand("r-page", { posterImageUrl: null, eventPageUrl: "https://v/e" });
    await verifyAndRepairFlyers([fromPage], { fetchImpl: visionMock, pageFetch: async () => `<img src="https://v/page-good.jpg">` });
    check("acquired from event page", fromPage.draft.posterImageUrl === "https://v/page-good.jpg");

    const noGood = cand("r-none", { posterImageUrl: null }, { sourceBundle: [{ sourceId: "b", sourceLabel: "x", sourceUrl: "u", posterImageUrl: "https://i/logo.png" }] as any });
    await verifyAndRepairFlyers([noGood], { fetchImpl: visionMock });
    check("no good alt ⇒ stays flyerless", noGood.draft.posterImageUrl == null);
  }

  section("Flyer: robustness — vision error / disabled");
  {
    const errFetch = (async () => ({ ok: false, status: 429, json: async () => ({}) })) as unknown as typeof fetch;
    const c = cand("f-err", { posterImageUrl: "https://i/good.jpg" });
    const before = c.draft.posterImageUrl;
    await verifyAndRepairFlyers([c], { fetchImpl: errFetch });
    check("vision 429 ⇒ poster untouched, no crash", c.draft.posterImageUrl === before);

    delete process.env.QSEARCH_SCRUB_FLYER_VISION;
    const off = cand("f-off", { posterImageUrl: "https://i/logo.png" });
    const sum = await verifyAndRepairFlyers([off], { fetchImpl: visionMock });
    check("disabled ⇒ nothing checked", sum.checked === 0 && off.draft.flyerMatch == null);
    process.env.QSEARCH_SCRUB_FLYER_VISION = "1";
  }

  console.log(`\n${total - failures}/${total} passed`);
  console.log(failures === 0 ? "BIG TEST: ALL PASS" : `BIG TEST: ${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void run();
