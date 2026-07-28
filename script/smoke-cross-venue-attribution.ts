/**
 * Smoke: cross-venue contamination regressions (offline unit checks).
 * Run: npx tsx script/smoke-cross-venue-attribution.ts
 *
 * Covers intended post-fix behavior:
 * 1. submissionMatch — Karaoke@Camp vs Karaoke@Eagle same day is NOT a strong
 *    high duplicate (auto-merge gate); same venue IS strong.
 * 2. priorFlyerFromCatalog — never pull Eagle Wix poster onto Camp Karaoke.
 * 3. extractSanctuaryFlyerUrls — title-aware ranking prefers BiteClub.jpg over
 *    related-grid gamebang when title is "Creature Feature: W/Bite Club".
 * 4. mergeDraftIntoEvent — cross-venue draft does not overwrite venueName.
 */
import {
  findSubmissionMatches,
  scoreSubmissionAgainstEvent,
  submissionHasStrongDuplicate,
} from "@shared/submissionMatch";
import type { Event } from "@shared/schema";
import { priorFlyerFromCatalog } from "../server/qsearch/analyze";
import { extractSanctuaryFlyerUrls } from "../server/ingest/posterQuality";
import { mergeDraftIntoEvent } from "../server/ingest";
import type { IngestEventDraft } from "../server/ingest/types";

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

function eventRow(
  over: Partial<Event> & Pick<Event, "id" | "title" | "venueName" | "dateStart">,
): Event {
  return {
    id: over.id,
    title: over.title,
    description: over.description ?? over.title,
    venueName: over.venueName,
    address: over.address ?? null,
    neighborhood: over.neighborhood ?? null,
    lat: over.lat ?? null,
    lng: over.lng ?? null,
    dateStart: over.dateStart,
    dateEnd: over.dateEnd ?? over.dateStart.replace(/T.*/, "T23:00:00"),
    dayOfWeek: over.dayOfWeek ?? null,
    ageRequirement: over.ageRequirement ?? "21_PLUS",
    eventTypes: over.eventTypes ?? "[]",
    admission: over.admission ?? "UNKNOWN",
    ticketUrl: over.ticketUrl ?? null,
    posterImageUrl: over.posterImageUrl ?? null,
    status: over.status ?? "LIVE",
    source: over.source ?? "url_ingest",
    isClaimable: over.isClaimable ?? true,
    claimedBy: over.claimedBy ?? null,
    submittedBy: over.submittedBy ?? null,
    adminNotes: over.adminNotes ?? null,
    isPublic: over.isPublic ?? true,
    isPrivate: over.isPrivate ?? false,
    isHouseParty: over.isHouseParty ?? false,
    isSexPositive: over.isSexPositive ?? false,
    nudityOk: over.nudityOk ?? false,
    createdAt: over.createdAt ?? new Date().toISOString(),
  } as Event;
}

function draft(
  over: Partial<IngestEventDraft> & Pick<IngestEventDraft, "title" | "venueName" | "dateStart">,
): IngestEventDraft {
  return {
    title: over.title,
    description: over.description ?? `${over.title} at ${over.venueName}.`,
    venueName: over.venueName,
    address: over.address ?? null,
    neighborhood: over.neighborhood ?? null,
    lat: over.lat ?? null,
    lng: over.lng ?? null,
    dateStart: over.dateStart,
    dateEnd: over.dateEnd ?? over.dateStart.replace(/T.*/, "T23:00:00"),
    dayOfWeek: over.dayOfWeek ?? null,
    ageRequirement: over.ageRequirement ?? "21_PLUS",
    eventTypes: over.eventTypes ?? "[]",
    admission: over.admission ?? "UNKNOWN",
    ticketUrl: over.ticketUrl ?? null,
    eventPageUrl: over.eventPageUrl ?? null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: over.posterImageUrl ?? null,
    sourceUrl: over.sourceUrl ?? null,
    parseSource: over.parseSource ?? "wix",
    warnings: over.warnings ?? [],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. submissionMatch — venue-hard gate on strong high duplicates
 * ═══════════════════════════════════════════════════════════════════════════ */
console.log("\n── 1. submissionMatch venue gate ──");

const DAY = "2026-07-22T20:00:00";
const campKaraoke = {
  title: "Karaoke",
  venueName: "Camp",
  address: "422 SW 13th Ave, Portland, OR",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  ticketUrl: null as string | null,
};
const eagleKaraoke = {
  title: "Karaoke",
  venueName: "Eagle Portland",
  address: "835 N Lombard St, Portland, OR 97217",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  ticketUrl: null as string | null,
};

const crossVenue = scoreSubmissionAgainstEvent(campKaraoke, {
  ...eagleKaraoke,
  id: 132,
  status: "LIVE",
});
const crossStrong = submissionHasStrongDuplicate(
  findSubmissionMatches(campKaraoke, [{ ...eagleKaraoke, id: 132, status: "LIVE" }]),
);
assert(
  !crossStrong && (crossVenue == null || crossVenue.confidence !== "high"),
  `Karaoke@Camp vs Karaoke@Eagle same day is NOT strong high (got ${
    crossVenue ? `${crossVenue.score}/${crossVenue.confidence}` : "null"
  })`,
);

const sameVenue = scoreSubmissionAgainstEvent(campKaraoke, {
  ...campKaraoke,
  id: 200,
  status: "LIVE",
});
const sameStrong = submissionHasStrongDuplicate(
  findSubmissionMatches(campKaraoke, [{ ...campKaraoke, id: 200, status: "LIVE" }]),
);
assert(
  !!sameStrong && sameVenue != null && sameVenue.confidence === "high",
  `Karaoke@Camp vs Karaoke@Camp same day IS strong high (got ${
    sameVenue ? `${sameVenue.score}/${sameVenue.confidence}` : "null"
  })`,
);

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. priorFlyerFromCatalog — never cross-venue flyer reuse
 * ═══════════════════════════════════════════════════════════════════════════ */
console.log("\n── 2. priorFlyerFromCatalog venue isolation ──");

const EAGLE_WIX =
  "https://static.wixstatic.com/media/eb6a37_9be84b6e3fd54d54b8c3a9dbb2a3a19c~mv2.jpg";
const CAMP_POSTER = "https://example.test/camp-karaoke-poster.jpg";

const catalogWithEagleArt = [
  eventRow({
    id: 132,
    title: "Karaoke",
    venueName: "Eagle Portland",
    dateStart: "2026-07-15T20:00:00",
    posterImageUrl: EAGLE_WIX,
  }),
  eventRow({
    id: 201,
    title: "Karaoke",
    venueName: "Camp",
    dateStart: "2026-07-08T20:00:00",
    posterImageUrl: CAMP_POSTER,
  }),
];

const campDraftNoArt = draft({
  title: "Karaoke",
  venueName: "Camp",
  dateStart: DAY,
  posterImageUrl: null,
});

// Even if matcher incorrectly surfaces Eagle id, priorFlyer must refuse
const priorCross = priorFlyerFromCatalog(campDraftNoArt, catalogWithEagleArt, [132]);
assert(
  priorCross == null || priorCross.eventId !== 132,
  `priorFlyerFromCatalog does not pull Eagle Wix onto Camp Karaoke (got ${
    priorCross ? `event#${priorCross.eventId} ${priorCross.url}` : "null"
  })`,
);
assert(
  priorCross == null || !/wixstatic/i.test(priorCross.url),
  "priorFlyerFromCatalog result is never Eagle wixstatic for Camp draft",
);

// Same-venue sibling with art is fair game
const priorSame = priorFlyerFromCatalog(campDraftNoArt, catalogWithEagleArt, [201]);
assert(
  priorSame != null && priorSame.eventId === 201 && priorSame.url === CAMP_POSTER,
  `priorFlyerFromCatalog reuses Camp sibling poster (got ${
    priorSame ? `event#${priorSame.eventId}` : "null"
  })`,
);

// Without match ids, catalog walk still must not pick Eagle
const priorWalk = priorFlyerFromCatalog(campDraftNoArt, catalogWithEagleArt, []);
assert(
  priorWalk != null && priorWalk.eventId === 201 && !/wixstatic/i.test(priorWalk.url),
  "catalog walk with empty matchIds still prefers same-venue Camp art",
);

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. extractSanctuaryFlyerUrls — title-aware poster ranking
 * ═══════════════════════════════════════════════════════════════════════════ */
console.log("\n── 3. Sanctuary title-aware flyer ranking ──");

const CREATURE_TITLE = "Creature Feature: W/Bite Club";
const BITE =
  "https://pdxsanctuary.com/wp-content/uploads/2025/07/BiteClub.jpg";
const GAMEBANG =
  "https://pdxsanctuary.com/wp-content/uploads/2025/06/gamebang-3.jpg";
const LOGO =
  "https://pdxsanctuary.com/wp-content/uploads/2025/05/cropped-LOGO-trans_color_square-no_text-270x270.png";

// Fixture mirrors a Sanctuary event page with empty/weak og:image and a
// Sugar Calendar "related events" grid that injects Game Bang art.
const SANCTUARY_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${CREATURE_TITLE} – Sanctuary Club</title>
  <meta property="og:title" content="${CREATURE_TITLE} – Sanctuary Club" />
  <!-- intentionally no useful og:image — real page often falls through to body -->
  <meta property="og:image" content="${LOGO}" />
</head>
<body>
  <article class="tribe-events-single">
    <h1>${CREATURE_TITLE}</h1>
    <div class="event-hero">
      <img src="${BITE}" alt="Bite Club flyer" width="980" height="980" />
    </div>
    <div class="entry-content">
      <p>Creature Feature presents Bite Club. Kink-friendly night at Sanctuary.</p>
    </div>
  </article>
  <aside class="related-events sugar-calendar-related">
    <h3>Related Events</h3>
    <a href="/events/game-bang-blanket-forts-3-2/">
      <img src="${GAMEBANG}" alt="Game Bang!" width="400" height="400" />
      Game Bang!
    </a>
    <a href="/events/naked-karaoke/">
      <img src="https://pdxsanctuary.com/wp-content/uploads/2025/06/NakedKaraoke.jpg" alt="Naked Karaoke" />
    </a>
  </aside>
  <footer>
    <img src="${LOGO}" alt="Sanctuary logo" />
  </footer>
</body>
</html>`;

const pageUrl = "https://pdxsanctuary.com/events/creature-feature-bite-club/";

// Title-aware path: third arg is event title (see posterQuality.extractSanctuaryFlyerUrls).
const titleAware = extractSanctuaryFlyerUrls(SANCTUARY_HTML, pageUrl, CREATURE_TITLE);
const bestTitleAware = titleAware[0] || "";
assert(
  titleAware.length > 0,
  `title-aware extract returns candidates (got ${titleAware.length})`,
);
assert(
  !/gamebang/i.test(bestTitleAware),
  `title-aware best is not gamebang (got ${bestTitleAware || "(empty)"})`,
);
assert(
  /BiteClub/i.test(bestTitleAware),
  `title-aware best is BiteClub.jpg for "${CREATURE_TITLE}" (got ${bestTitleAware || "(empty)"})`,
);

// Also ensure BiteClub is preferred over gamebang somewhere in ranked list
// even if scoring ties — first match must be BiteClub when title provided.
const biteIdx = titleAware.findIndex(u => /BiteClub/i.test(u));
const bangIdx = titleAware.findIndex(u => /gamebang/i.test(u));
assert(
  biteIdx >= 0 && (bangIdx < 0 || biteIdx < bangIdx),
  `BiteClub ranks above gamebang when title-aware (bite@${biteIdx}, bang@${bangIdx})`,
);

/* ═══════════════════════════════════════════════════════════════════════════
 * 4. mergeDraftIntoEvent — do not clobber venue across venues
 * ═══════════════════════════════════════════════════════════════════════════ */
console.log("\n── 4. mergeDraftIntoEvent venue lock ──");

const existingEagle = eventRow({
  id: 132,
  title: "Karaoke",
  venueName: "Eagle Portland",
  address: "835 N Lombard St, Portland, OR 97217",
  dateStart: "2026-07-22T20:00:00",
  posterImageUrl: EAGLE_WIX,
});

const campWeeklyDraft = draft({
  title: "Karaoke",
  venueName: "Camp",
  address: "422 SW 13th Ave, Portland, OR",
  dateStart: "2026-07-22T21:00:00",
  dateEnd: "2026-07-22T23:30:00",
  posterImageUrl: null,
  sourceUrl: "https://www.campportland.com/",
  parseSource: "mixed",
});

const crossPatch = mergeDraftIntoEvent(existingEagle, campWeeklyDraft);
assert(
  crossPatch.venueName == null || /eagle/i.test(String(crossPatch.venueName)),
  `cross-venue draft does not overwrite venueName to Camp (got ${JSON.stringify(crossPatch.venueName)})`,
);
// Address is venue identity too — foreign address should not land either
// when venues disagree (paired with venueName lock). Soft: only assert venueName
// is the hard contract from the task.
assert(
  !/camp/i.test(String(crossPatch.venueName || "")),
  "patch.venueName never contains Camp when existing is Eagle",
);

// Same-venue merge still applies draft values (including venue string)
const existingCamp = eventRow({
  id: 200,
  title: "Karaoke Night",
  venueName: "Camp",
  address: "422 SW 13th Ave, Portland, OR",
  dateStart: "2026-07-15T20:00:00",
});
const campUpdate = draft({
  title: "Karaoke",
  venueName: "Camp",
  address: "422 SW 13th Ave, Portland, OR",
  dateStart: "2026-07-22T21:00:00",
  sourceUrl: "https://www.campportland.com/",
});
const samePatch = mergeDraftIntoEvent(existingCamp, campUpdate);
assert(
  samePatch.venueName == null || /camp/i.test(String(samePatch.venueName)),
  "same-venue merge may set/keep Camp venueName",
);
assert(
  samePatch.title === "Karaoke" || samePatch.dateStart === campUpdate.dateStart,
  "same-venue merge still applies draft title/date",
);

/* ── summary ── */
console.log("");
if (failed > 0) {
  console.error(`smoke-cross-venue-attribution: ${failed} failure(s)`);
  process.exit(1);
}
console.log("smoke-cross-venue-attribution: all checks passed");
