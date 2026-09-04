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
  extractUrlFromDescription,
  boundedEditDistance,
  matchSanctuaryIndexUrl,
  sanctuarySlugKey,
  applySeriesFlyerReuse,
  normalizeSanctuaryIcsTimezone,
  buildSeriesPosterHintMap,
  isSanctuaryLogoPoster,
} from "../server/ingest/adapters/sanctuary";
import { isRelevantScanDraft } from "../server/ingest/relevance";
import { countFreshFlyerDrafts, isFreshFlyerDraft } from "../server/ingest/venuePolicy";
import {
  extractSanctuaryFlyerUrls,
  preferFullQualityImageUrl,
  stripSugarCalendarRelatedBlocks,
} from "../server/ingest/posterQuality";
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

// Sibling nights must not share a page: Pride ≠ Speed Date (live bug 2026-07)
const siblingEntries = [
  ...entries,
  {
    url: "https://pdxsanctuary.com/events/jiffy-kink-speed-date-4/",
    slug: "jiffy-kink-speed-date-4",
    day: null,
  },
];
const prideNotSpeed = matchSanctuaryIndexUrl(
  { title: "Jiffy Kink: Pride", dateStart: "2026-07-25T21:00:00" },
  siblingEntries,
);
assert(
  prideNotSpeed === "https://pdxsanctuary.com/events/jiffy-kink-pride-2/",
  "Jiffy Pride must not match Speed Date page",
);
const speedNotPride = matchSanctuaryIndexUrl(
  { title: "Jiffy Kink: Speed Date", dateStart: "2026-07-25T19:00:00" },
  siblingEntries,
);
assert(
  speedNotPride === "https://pdxsanctuary.com/events/jiffy-kink-speed-date-4/",
  "Jiffy Speed Date matches its own slug",
);
assert(
  isSanctuaryLogoPoster("https://pdxsanctuary.com/wp-content/uploads/2025/06/footer_map.png"),
  "footer_map.png is chrome, not a flyer",
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

/* ── 4. Sanctuary artwork must be exact-event; never reuse siblings/history ── */
const LOGO = "https://pdxsanctuary.com/wp-content/uploads/2025/05/cropped-LOGO-trans_color_square-no_text-270x270.png";
assert(isSanctuaryLogoPoster(LOGO), "logo detector still rejects site logo");
assert(
  normalizeSanctuaryIcsTimezone("DTSTART;TZID=UTC:20260918T203000\nDTEND;TZID=GMT:20260918T233000") ===
    "DTSTART;TZID=America/Los_Angeles:20260918T203000\nDTEND;TZID=America/Los_Angeles:20260918T233000",
  "Sanctuary's mislabeled UTC wall-clock values are treated as Pacific local time",
);

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
  reused[1].posterImageUrl === null,
  "missing exact-event artwork stays empty instead of copying a sibling flyer",
);
assert(
  !reused[1].warnings.some(w => /series flyer reused/i.test(w)),
  "no sibling-reuse breadcrumb is emitted",
);
assert(
  reused[2].posterImageUrl === null,
  "board history cannot supply artwork for a new occurrence",
);
assert(
  reused[0].posterImageUrl === "https://pdxsanctuary.com/wp-content/uploads/2026/07/GameBangJuly.avif",
  "verified exact-event artwork is preserved",
);
assert(!hints.has("some logo event") && !Array.from(hints.values()).includes(LOGO), "logo posters never enter hint map");

/* ── 4a2. the four reported misses: calendar-base, squashed, fuzzy, 3rd-party ── */
const missEntries = sitemapLocsToIndexEntries([
  "https://pdxsanctuary.com/events/alien-orgy/",
  "https://pdxsanctuary.com/events/vampire-orgy-2/",
  "https://pdxsanctuary.com/calendar/horse-market-2/", // /calendar/ base (live-verified)
  "https://pdxsanctuary.com/events/horse-market/",
  "https://pdxsanctuary.com/events/ebony-fest-2/",
  "https://pdxsanctuary.com/events/polytopia-3/",
]);
assert(
  missEntries.some(e => e.url === "https://pdxsanctuary.com/calendar/horse-market-2/"),
  "sitemap harvest accepts /calendar/{slug}/ pages",
);
assert(
  matchSanctuaryIndexUrl({ title: "Alien Orgy", dateStart: "2026-08-08T21:00:00" }, missEntries) ===
    "https://pdxsanctuary.com/events/alien-orgy/",
  "Alien Orgy matches its own page, not Vampire Orgy",
);
assert(
  matchSanctuaryIndexUrl({ title: "Horse Market", dateStart: "2026-08-15T21:00:00" }, missEntries) ===
    "https://pdxsanctuary.com/calendar/horse-market-2/",
  "Horse Market resolves to newest page (calendar base, -2 suffix)",
);
assert(
  matchSanctuaryIndexUrl({ title: "EbonyFest", dateStart: "2026-08-21T21:00:00" }, missEntries) ===
    "https://pdxsanctuary.com/events/ebony-fest-2/",
  "EbonyFest matches ebony-fest via squashed comparison (word-boundary drift)",
);
assert(
  matchSanctuaryIndexUrl({ title: "Polyitopia", dateStart: "2026-08-28T21:00:00" }, missEntries) ===
    "https://pdxsanctuary.com/events/polytopia-3/",
  "Polyitopia matches polytopia via fuzzy squashed comparison (spelling drift)",
);
assert(boundedEditDistance("polyitopia", "polytopia", 2) === 1, "edit distance sane");
assert(
  matchSanctuaryIndexUrl({ title: "Leather Social", dateStart: "2026-08-28T21:00:00" }, missEntries) === null,
  "fuzzy fallback does not create false matches",
);

// Third-party organizer URL from ICS description (Polyitopia via SP Portland)
assert(
  extractUrlFromDescription(
    "Hosted with SP Portland! Details & tickets: https://www.sexpositiveportland.org/polytopia-2026. 21+.",
  ) === "https://www.sexpositiveportland.org/polytopia-2026",
  "organizer URL extracted from ICS description (trailing punctuation stripped)",
);
assert(
  extractUrlFromDescription("See our calendar https://pdxsanctuary.com/events/calendar/sanctuary/ics/") === null,
  "feed URLs never used as event pages",
);

/* ── 4a3. Sports Bra scope: trusted generic mode filters EB noise ── */
const braCtx = {
  sourceId: "sports-bra-eb",
  label: "The Sports Bra",
  url: "https://www.eventbrite.com/d/or--portland/sports-bra/",
  tier: "1",
};
const noiseDraft = draft({
  title: "Portland Timbers Trivia Night",
  dateStart: "2026-08-05T19:00:00",
  venueName: "Some Other Bar",
  address: "123 SE Main St, Portland, OR",
  description: "Soccer trivia downtown!",
});
const braEventDraft = draft({
  title: "Thorns Watch Party at The Sports Bra",
  dateStart: "2026-08-06T19:00:00",
  venueName: "The Sports Bra",
  address: "2512 NE Broadway, Portland, OR",
  description: "Watch the Thorns with us at the Sports Bra!",
});
assert(!isRelevantScanDraft(noiseDraft, braCtx).keep, "unrelated Portland event dropped by venue scope");
assert(isRelevantScanDraft(braEventDraft, braCtx).keep, "actual Sports Bra event kept by venue scope");

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
// Bare "Game Bang!" prefers the precise slug (game-bang-2) over a longer
// themed sibling (game-bang-blanket-forts-…) - same rule that keeps Pride
// off Speed Date.
assert(
  gbDup === "https://pdxsanctuary.com/events/game-bang-2/",
  "bare series title prefers precise slug over longer themed sibling",
);
const gbTheme = matchSanctuaryIndexUrl(
  { title: "Game Bang: Blanket Forts", dateStart: "2026-09-23T19:00:00" },
  smEntries,
);
assert(
  gbTheme === "https://pdxsanctuary.com/events/game-bang-blanket-forts-3-2/",
  "themed title matches themed slug",
);

/* ── 4b2. title-aware Sanctuary flyer ranking (gamebang related-grid noise) ── */
const biteClubHtml = `
<html><body>
<img src="https://pdxsanctuary.com/wp-content/uploads/2025/07/gamebang-3.jpg" />
<img src="https://pdxsanctuary.com/wp-content/uploads/2025/07/BiteClub.jpg" />
<img src="https://pdxsanctuary.com/wp-content/uploads/2025/01/trans_color_square.png" />
</body></html>`;
const biteRanked = extractSanctuaryFlyerUrls(
  biteClubHtml,
  "https://pdxsanctuary.com/events/creature-feature-bite-club/",
  "Creature Feature: W/Bite Club",
);
assert(
  biteRanked[0]?.toLowerCase().includes("biteclub"),
  "title-aware rank: BiteClub beats gamebang related-grid embed",
);
assert(
  !biteRanked.some(u => /trans_color_square/i.test(u)),
  "title-aware rank: logo chrome still rejected",
);
const noTitleRanked = extractSanctuaryFlyerUrls(biteClubHtml);
assert(
  noTitleRanked.some(u => /gamebang/i.test(u)) && noTitleRanked.some(u => /biteclub/i.test(u)),
  "without title both candidates still returned (no bare bang boost required)",
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

/* ── 4d. Sugar Calendar related-events grid must not supply flyer candidates ── */
// Mirrors live detail pages: primary hero/og for THIS event, plus a
// sugar-calendar-event-list grid whose CSS background-image cells are OTHER nights
// (e.g. Game Bang on a Bite Club / Pickup Play page).
const BITE_HERO = "https://pdxsanctuary.com/wp-content/uploads/2026/07/BiteClub.avif";
const GAMEBANG_GRID = "https://pdxsanctuary.com/wp-content/uploads/2026/06/gamebang-3.avif";
const KARAOKE_GRID = "https://pdxsanctuary.com/wp-content/uploads/2026/05/NakedKaraoke.avif";
const RELATED_GRID_HTML = `
<html><head>
<meta property="og:image" content="${BITE_HERO}" />
</head><body>
<article class="entry-content">
  <img src="${BITE_HERO}" alt="Bite Club" />
</article>
<section class="sugar-calendar-event-list-block">
  <div class="sugar-calendar-event-list-block__gridview">
    <div class="sugar-calendar-event-list-block__gridview__event__body__image"
         style="background-image:url(${GAMEBANG_GRID})"></div>
    <div class="sugar-calendar-event-list-block__gridview__event__body__image"
         style="background-image: url('${KARAOKE_GRID}')"></div>
  </div>
</section>
</body></html>`;

const stripped = stripSugarCalendarRelatedBlocks(RELATED_GRID_HTML);
assert(!/gamebang/i.test(stripped), "strip removes gamebang related-grid thumb");
assert(!/NakedKaraoke/i.test(stripped), "strip removes karaoke related-grid thumb");
assert(/BiteClub\.avif/.test(stripped), "strip keeps primary content flyer");
assert(/og:image/.test(stripped), "strip keeps head meta (og:image)");

const candsNoTitle = extractSanctuaryFlyerUrls(RELATED_GRID_HTML, "https://pdxsanctuary.com/events/bite-club/");
assert(
  candsNoTitle.every(u => !/gamebang/i.test(u)),
  "gamebang only in related grid is absent from candidates (no title needed)",
);
assert(
  candsNoTitle.every(u => !/NakedKaraoke/i.test(u)),
  "karaoke only in related grid is absent from candidates",
);
assert(
  candsNoTitle[0] === BITE_HERO || candsNoTitle.includes(BITE_HERO),
  "primary og/hero BiteClub remains a top candidate",
);

const candsTitled = extractSanctuaryFlyerUrls(
  RELATED_GRID_HTML,
  "https://pdxsanctuary.com/events/bite-club/",
  "Creature Feature: W/Bite Club",
);
assert(candsTitled[0] === BITE_HERO, "with title, BiteClub still ranks first");
assert(candsTitled.every(u => !/gamebang/i.test(u)), "titled path still excludes grid-only gamebang");

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
