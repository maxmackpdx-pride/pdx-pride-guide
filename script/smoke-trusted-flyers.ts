/**
 * Smoke: trusted-connector flyer hardening (offline, fixture-based).
 * Run: npx tsx script/smoke-trusted-flyers.ts
 *
 * Covers:
 * 1. Sanctuary /events/ index harvest — real WP collision-suffixed slugs +
 *    per-occurrence date paths (fixture mirrors the live site, July 2026)
 * 2. Draft ↔ real-URL matching by title tokens + occurrence day
 * 3. Wixstatic normalization (Eagle) — /v1/fill thumbnails + wix:image:// URIs
 * 4. Series flyer reuse — batch first, then cross-run board memory
 * 5. deriveTrustedHealth flyer-coverage gating
 */
import {
  extractSanctuaryEventIndex,
  extractSanctuaryIndexNextUrls,
  extractSitemapLocs,
  sitemapLocsToIndexEntries,
  matchSanctuaryIndexUrl,
  sanctuarySlugKey,
  applySeriesFlyerReuse,
  buildSeriesPosterHintMap,
  isSanctuaryLogoPoster,
} from "../server/ingest/adapters/sanctuary";
import { countFreshFlyerDrafts, isFreshFlyerDraft } from "../server/ingest/venuePolicy";
import { preferFullQualityImageUrl } from "../server/ingest/posterQuality";
import { deriveTrustedHealth } from "../shared/trustedVenues";
import type { IngestEventDraft } from "../server/ingest/types";

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
    description: over.description || `${over.title} at Sanctuary Club.`,
    venueName: over.venueName || "Sanctuary Club",
    address: over.address ?? "33 NW 9th Ave, Portland, OR 97209",
    neighborhood: over.neighborhood ?? "Pearl District",
    lat: null,
    lng: null,
    dateStart: over.dateStart,
    dateEnd: over.dateEnd || over.dateStart,
    dayOfWeek: over.dayOfWeek ?? 0,
    ageRequirement: over.ageRequirement || "21_PLUS",
    eventTypes: over.eventTypes || "[]",
    admission: over.admission || "UNKNOWN",
    ticketUrl: over.ticketUrl ?? null,
    eventPageUrl: over.eventPageUrl ?? null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: true,
    nudityOk: true,
    posterImageUrl: over.posterImageUrl ?? null,
    sourceUrl: over.sourceUrl ?? "https://pdxsanctuary.com/events/calendar/sanctuary/ics/",
    parseSource: over.parseSource || "ics",
    warnings: over.warnings || [],
  };
}

/* ── 1. index harvest (fixture mirrors live hrefs seen 2026-07) ── */
const INDEX_HTML = `
<html><body>
<a href="https://pdxsanctuary.com/events/amateur-strip-night/">Amateur Strip Night</a>
<a href="/events/game-bang-blanket-forts-3-2/2026-07-22/">Game Bang!</a>
<a href="/events/fempower-4-3-2-8/">FEMpower</a>
<a href="/events/naked-karaoke-4-3/2026-07-24/">Naked Karaoke</a>
<a href="/events/jiffy-kink-pride-2/">Jiffy Kink: Pride</a>
<a href="/events/transcendance-2-2-5-5/">TranscenDance: Fabled Freaks</a>
<a href="/events/calendar/sanctuary/ics/">ics feed</a>
<a href="/events/category/play-parties/">category</a>
<a href="/events/month/2026-08/">month view</a>
<a rel="next" href="/events/page/2/">Next</a>
</body></html>`;

const entries = extractSanctuaryEventIndex(INDEX_HTML, "https://pdxsanctuary.com/");
assert(entries.length === 6, `index harvest found 6 event URLs (got ${entries.length})`);
assert(
  entries.some(e => e.slug === "game-bang-blanket-forts-3-2" && e.day === "2026-07-22"),
  "harvest keeps occurrence day from dated URL",
);
assert(
  !entries.some(e => /^(calendar|category|month)$/.test(e.slug)),
  "harvest excludes calendar/category/month views",
);
const nexts = extractSanctuaryIndexNextUrls(INDEX_HTML, "https://pdxsanctuary.com/events/");
assert(
  nexts.includes("https://pdxsanctuary.com/events/page/2/"),
  "pagination rel=next harvested",
);

/* ── 2. draft ↔ URL matching ── */
assert(sanctuarySlugKey("game-bang-blanket-forts-3-2") === "game bang blanket forts", "slug key strips WP collision suffixes");

const gb = matchSanctuaryIndexUrl(
  { title: "Game Bang!", dateStart: "2026-07-22T19:00:00" },
  entries,
);
assert(
  gb === "https://pdxsanctuary.com/events/game-bang-blanket-forts-3-2/2026-07-22/",
  "Game Bang matches suffixed slug + exact occurrence day",
);

const gbWrongDay = matchSanctuaryIndexUrl(
  { title: "Game Bang!", dateStart: "2026-08-26T19:00:00" },
  entries,
);
assert(gbWrongDay === null, "dated URL rejected for a different occurrence day");

const jk = matchSanctuaryIndexUrl(
  { title: "Jiffy Kink: Pride — July 2026", dateStart: "2026-07-25T19:00:00" },
  entries,
);
assert(
  jk === "https://pdxsanctuary.com/events/jiffy-kink-pride-2/",
  "undated series URL matches any occurrence (Jiffy Kink)",
);

const none = matchSanctuaryIndexUrl(
  { title: "Leather Brunch Takeover", dateStart: "2026-07-25T11:00:00" },
  entries,
);
assert(none === null, "unrelated title matches nothing");

const nk = matchSanctuaryIndexUrl(
  { title: "Naked Karaoke Night", dateStart: "2026-07-24T21:00:00" },
  entries,
);
assert(
  nk === "https://pdxsanctuary.com/events/naked-karaoke-4-3/2026-07-24/",
  "partial title (extra token) still clears overlap bar",
);

/* ── 3. Wixstatic normalization (Eagle) ── */
const tiny =
  "https://static.wixstatic.com/media/eb6a37_9be84b6e3fd54d54b8c3a9dbb2a3a19c~mv2.jpg/v1/fill/w_63,h_63,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/event.jpg";
assert(
  preferFullQualityImageUrl(tiny) ===
    "https://static.wixstatic.com/media/eb6a37_9be84b6e3fd54d54b8c3a9dbb2a3a19c~mv2.jpg",
  "wixstatic /v1/fill thumbnail stripped to original media",
);
assert(
  preferFullQualityImageUrl(
    "wix:image://v1/eb6a37_abc123~mv2.png/flyer.png#originWidth=1080&originHeight=1350",
  ) === "https://static.wixstatic.com/media/eb6a37_abc123~mv2.png",
  "wix:image:// URI converted to static.wixstatic.com media URL",
);
assert(
  preferFullQualityImageUrl("https://pdxsanctuary.com/wp-content/uploads/2025/08/AlienOrgy-980x980-1.avif") ===
    "https://pdxsanctuary.com/wp-content/uploads/2025/08/AlienOrgy.avif",
  "existing WP -WxH-N stripping unchanged",
);

/* ── 4. series flyer reuse: batch first, then board memory ── */
const LOGO = "https://pdxsanctuary.com/wp-content/uploads/2025/05/cropped-LOGO-trans_color_square-no_text-270x270.png";
assert(isSanctuaryLogoPoster(LOGO), "logo detector still rejects site logo");

const batch = [
  draft({ title: "Game Bang! — July", dateStart: "2026-07-22T19:00:00", posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/07/GameBangJuly.avif" }),
  draft({ title: "Game Bang! — August", dateStart: "2026-08-26T19:00:00", posterImageUrl: null }),
  draft({ title: "Naked Karaoke", dateStart: "2026-07-24T21:00:00", posterImageUrl: null }),
];
const hints = buildSeriesPosterHintMap([
  { title: "Naked Karaoke — June 2026", posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/06/NakedKaraoke.avif" },
  { title: "Game Bang! — June 2026", posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/06/GameBangJune.avif" },
  { title: "Some Logo Event", posterImageUrl: LOGO },
]);
const reused = applySeriesFlyerReuse(batch, hints);
assert(
  reused[1].posterImageUrl === "https://pdxsanctuary.com/wp-content/uploads/2026/07/GameBangJuly.avif",
  "batch sibling flyer wins over board hint (fresher art)",
);
assert(
  reused[1].warnings.includes("Series flyer reused"),
  "batch reuse warning breadcrumb present",
);
assert(
  reused[2].posterImageUrl === "https://pdxsanctuary.com/wp-content/uploads/2026/06/NakedKaraoke.avif",
  "board memory fills flyer when batch has none (cross-run reuse)",
);
assert(
  reused[2].warnings.includes("Series flyer reused from existing board event"),
  "cross-run reuse warning breadcrumb present",
);
assert(!hints.has("some logo event") && !Array.from(hints.values()).includes(LOGO), "logo posters never enter hint map");

/* ── 4b. sitemap harvest (Sugar Calendar JS pagination workaround) ── */
const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://pdxsanctuary.com/events/game-bang-blanket-forts-3-2/</loc></url>
<url><loc>https://pdxsanctuary.com/events/game-bang-2/</loc></url>
<url><loc>https://pdxsanctuary.com/events/kinkoween-4-5/</loc></url>
<url><loc>https://pdxsanctuary.com/events/calendar/</loc></url>
<url><loc>https://pdxsanctuary.com/about/</loc></url>
</urlset>`;
const locs = extractSitemapLocs(SITEMAP_XML);
assert(locs.length === 5, "sitemap locs extracted");
const smEntries = sitemapLocsToIndexEntries(locs);
assert(smEntries.length === 3, `sitemap yields 3 event entries (got ${smEntries.length}; views/pages excluded)`);
assert(smEntries.every(e => e.day === null), "sitemap entries are undated series roots");

// Duplicate-series tie-break: highest WP collision suffix (newest page) wins
const kinkFar = matchSanctuaryIndexUrl(
  { title: "Kinkoween", dateStart: "2026-10-30T21:00:00" },
  smEntries,
);
assert(kinkFar === "https://pdxsanctuary.com/events/kinkoween-4-5/", "sitemap covers events months out (beyond index page window)");
const gbDup = matchSanctuaryIndexUrl(
  { title: "Game Bang!", dateStart: "2026-09-23T19:00:00" },
  smEntries,
);
assert(
  gbDup === "https://pdxsanctuary.com/events/game-bang-blanket-forts-3-2/",
  "duplicate series slugs tie-break toward newest collision suffix",
);

/* ── 4c. fresh-vs-reused flyer coverage ── */
const freshDraft = { posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/07/X.avif", warnings: ["Flyer from event page og:image"] };
const reusedDraft = { posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/06/Y.avif", warnings: ["Series flyer reused"] };
const boardReusedDraft = { posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2026/06/Z.avif", warnings: ["Series flyer reused from existing board event"] };
const bareDraft = { posterImageUrl: null, warnings: [] };
assert(isFreshFlyerDraft(freshDraft), "page-enriched flyer counts as fresh");
assert(!isFreshFlyerDraft(reusedDraft), "batch-reused flyer does NOT count toward coverage");
assert(!isFreshFlyerDraft(boardReusedDraft), "board-reused flyer does NOT count toward coverage");
assert(countFreshFlyerDrafts([freshDraft, reusedDraft, boardReusedDraft, bareDraft]) === 1, "coverage counts only fresh acquisitions");

/* ── 5. flyer-coverage health gating ── */
const nowIso = new Date().toISOString();
const base = {
  lastSyncAt: nowIso,
  lastSyncOk: true as const,
  consecutiveFails: 0,
  lastPublishedAt: null,
  pollHours: 6,
  now: new Date(),
};
assert(deriveTrustedHealth({ ...base, lastEventCount: 10, flyerCoverage: 0.9 }) === "green", "high coverage stays green");
assert(deriveTrustedHealth({ ...base, lastEventCount: 10, flyerCoverage: 0.2 }) === "yellow", "low coverage degrades to yellow");
assert(deriveTrustedHealth({ ...base, lastEventCount: 2, flyerCoverage: 0 }) === "green", "tiny batch never flags coverage");
assert(deriveTrustedHealth({ ...base, lastEventCount: 10, flyerCoverage: null }) === "green", "unmeasured coverage (older runs) stays green");
assert(
  deriveTrustedHealth({ ...base, lastSyncOk: false, lastEventCount: 10, flyerCoverage: 0.9 }) === "red",
  "sync failure still wins over coverage",
);

console.log("\nAll trusted-flyer smoke checks passed.");
