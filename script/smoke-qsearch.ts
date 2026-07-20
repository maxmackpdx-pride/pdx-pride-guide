/**
 * QSearch smoke / bug checks (offline + live API if server on :5050).
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

// --- Live API (optional) ---
const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
async function liveApi() {
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "tucker_pdmax", password: "smoketest" }),
  });
  if (!login.ok) {
    console.log("skip live API (login failed — is dev server up?)");
    return;
  }
  const cookie = login.headers.getSetCookie?.()?.join("; ") || "";
  // cookie jar for node fetch
  const setCookie = login.headers.get("set-cookie") || "";
  const cookieHeader = setCookie.split(",").map(c => c.split(";")[0]).join("; ");

  const dash = await fetch(`${BASE}/api/admin/qsearch/dashboard`, {
    headers: { Cookie: cookieHeader },
  });
  assert(dash.ok, `dashboard ${dash.status}`);
  const dashJson = await dash.json();
  assert(dashJson.stats?.urlCount > 0, `urlCount=${dashJson.stats?.urlCount}`);
  assert(Array.isArray(dashJson.sources), "sources array");
  assert(Array.isArray(dashJson.health), "health array");

  // Tiny scan: only one high-yield curated source if present
  const darcelle = (dashJson.sources as any[]).find((s: any) => s.id === "darcelle-tribe");
  const sourceIds = darcelle ? [darcelle.id] : [(dashJson.sources as any[])[0]?.id].filter(Boolean);

  const scan = await fetch(`${BASE}/api/admin/qsearch/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      sourceIds,
      tryVision: false,
      includePastEvents: false,
    }),
  });
  const scanBody = await scan.json();
  if (!scan.ok) {
    // Concurrent scan is ok in parallel runs
    assert(
      String(scanBody.error || "").includes("already running") || scan.ok,
      `scan start: ${scan.status} ${JSON.stringify(scanBody).slice(0, 120)}`,
    );
    if (!scan.ok) return;
  } else {
    assert(scanBody.jobId, "jobId returned");
    const jobId = scanBody.jobId as string;
    let done = false;
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const st = await fetch(`${BASE}/api/admin/qsearch/scan/${jobId}`, {
        headers: { Cookie: cookieHeader },
      });
      const j = await st.json();
      if (j.status === "done" || j.status === "cancelled" || j.status === "failed") {
        assert(j.status === "done" || j.status === "cancelled", `job finished status=${j.status}`);
        assert(typeof j.progress === "number", "progress number");
        // Past filter: no candidate should be fully past
        const cands = j.candidates || [];
        for (const c of cands) {
          if (c.draft && isPastEventListing(c.draft)) {
            assert(false, `candidate past slipped through: ${c.draft.title}`);
          }
        }
        console.log(`ok: live scan job ${jobId} candidates=${cands.length}`);
        done = true;
        break;
      }
    }
    assert(done, "scan completed within timeout");
  }

  const queue = await fetch(`${BASE}/api/admin/qsearch/queue?status=pending&limit=50`, {
    headers: { Cookie: cookieHeader },
  });
  assert(queue.ok, `queue ${queue.status}`);
}

await liveApi();

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nQSearch smoke checks passed.");
