/**
 * Offline unit smoke for LIVE-row cross-venue contamination repair planners.
 * Run: npx tsx script/smoke-cross-venue-repair.ts
 */
import {
  planCrossVenueContaminationRepairs,
  isCampBarVenue,
  isSanctuaryVenue,
  titleIsGameBang,
  isGameBangPosterUrl,
  needsSanctuaryFlyerReenrich,
} from "../server/ingest/crossVenueContaminationRepair";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

// Venue helpers
assert(isCampBarVenue("Camp Bar PDX"), "Camp Bar PDX is camp bar");
assert(!isCampBarVenue("Triangle Recreation Camp"), "TRC is not camp bar");
assert(isSanctuaryVenue("Sanctuary Club"), "Sanctuary Club matches");
assert(titleIsGameBang("Game Bang - Blanket Forts"), "Game Bang title detected");
assert(!titleIsGameBang("Creature Feature: W/Bite Club"), "Creature Feature is not Game Bang");
assert(isGameBangPosterUrl("https://pdxsanctuary.com/wp-content/uploads/2025/07/gamebang-3.jpg"), "gamebang poster");

const patches = planCrossVenueContaminationRepairs([
  {
    id: 303,
    title: "Karaoke",
    venueName: "Camp Bar PDX",
    posterImageUrl: "https://static.wixstatic.com/media/417ac4_abc~mv2.png",
    ticketUrl: "https://www.eagleportland.com/event-details/karaoke-2026-07-29-20-00",
    status: "LIVE",
  },
  {
    id: 279,
    title: "Creature Feature: W/Bite Club",
    venueName: "Sanctuary Club",
    posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2025/07/gamebang-3.jpg",
    ticketUrl: "https://pdxsanctuary.com/events/creature-feature-w-bite-club-3-3/",
    status: "LIVE",
  },
  {
    id: 999,
    title: "Game Bang",
    venueName: "Sanctuary Club",
    posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2025/07/gamebang-3.jpg",
    ticketUrl: "https://pdxsanctuary.com/events/game-bang/",
    status: "LIVE",
  },
  {
    id: 1,
    title: "Clean Karaoke",
    venueName: "Camp Bar PDX",
    posterImageUrl: null,
    ticketUrl: "https://campbarpdx.com",
    status: "LIVE",
  },
]);

assert(patches.length === 2, `exactly 2 patches (got ${patches.length})`);
const camp = patches.find(p => p.id === 303);
assert(camp?.reason === "camp_foreign_eagle", "Camp Karaoke patched as camp_foreign_eagle");
assert(camp?.posterImageUrl === null, "Camp Karaoke poster cleared");
assert(camp?.ticketUrl === "https://campbarpdx.com", "Camp Karaoke ticket rewritten to camp home");
const sanc = patches.find(p => p.id === 279);
assert(sanc?.reason === "sanctuary_gamebang_wrong_series", "Sanctuary wrong series patched");
assert(sanc?.posterImageUrl === null, "Sanctuary gamebang poster cleared");
assert(!patches.some(p => p.id === 999), "real Game Bang keeps its flyer");
assert(!patches.some(p => p.id === 1), "clean Camp row not patched");

assert(
  needsSanctuaryFlyerReenrich({
    title: "Creature Feature: W/Bite Club",
    venueName: "Sanctuary Club",
    posterImageUrl: null,
    ticketUrl: "https://pdxsanctuary.com/events/creature-feature-w-bite-club-3-3/",
  }),
  "cleared Sanctuary needs re-enrich",
);

assert(
  !needsSanctuaryFlyerReenrich({
    title: "Creature Feature: W/Bite Club",
    venueName: "Sanctuary Club",
    posterImageUrl: "https://pdxsanctuary.com/wp-content/uploads/2025/07/BiteClub.jpg",
    ticketUrl: "https://pdxsanctuary.com/events/creature-feature/",
  }),
  "already-good Sanctuary poster does not need re-enrich",
);

console.log("\nsmoke-cross-venue-repair: all checks passed");
