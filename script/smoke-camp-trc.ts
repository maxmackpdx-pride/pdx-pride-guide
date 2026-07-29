/**
 * Smoke: Camp TRC (Triangle Recreation Camp) trusted connector.
 * Run: npx tsx script/smoke-camp-trc.ts
 */
import {
  parseCampTrcCalendar,
  parseCampTrcDateRange,
  campTrcEventsToDrafts,
} from "../server/ingest/adapters/campTrc";
import { getTrustedVenue, isTrustedLaneSource } from "../shared/trustedVenues";
import { DIRECTORY_TYPE_COLORS } from "../shared/directoryTheme";
import {
  DIRECTORY_LOGO_VERSION,
  resolveDirectoryLogo,
  directoryFallbackLogo,
} from "../shared/directoryLogos";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

assert(getTrustedVenue("camp-trc")?.fetchMode === "camp_trc_html", "registry camp_trc_html");
assert(isTrustedLaneSource({ id: "camp-trc" }), "camp-trc trusted lane by id");
assert(
  isTrustedLaneSource({ id: "directory-x", url: "https://camptrc.org/Events" }),
  "camptrc.org host is trusted lane",
);
assert(DIRECTORY_TYPE_COLORS.campground === "#39FF14", "campground type accent lime");
const trcLogo = `/directory-logos/Triangle_Recreation_Camp.png?v=${DIRECTORY_LOGO_VERSION}`;
assert(
  resolveDirectoryLogo("Triangle Recreation Camp") === trcLogo,
  "logo pack maps Triangle Recreation Camp (cache-busted)",
);
assert(
  resolveDirectoryLogo("Camp TRC") === trcLogo,
  "logo pack maps Camp TRC (cache-busted)",
);
assert(
  directoryFallbackLogo("campground") ===
    `/directory-logos/fallback_campgrounds.png?v=${DIRECTORY_LOGO_VERSION}`,
  "campground fallback logo (cache-busted)",
);

assert(
  JSON.stringify(parseCampTrcDateRange("May 22 - 25", 2026)) ===
    JSON.stringify({ startDate: "2026-05-22", endDate: "2026-05-25" }),
  "multi-day date range",
);
assert(
  JSON.stringify(parseCampTrcDateRange("June 13", 2026)) ===
    JSON.stringify({ startDate: "2026-06-13", endDate: "2026-06-13" }),
  "single-day date",
);
assert(
  JSON.stringify(parseCampTrcDateRange("Sept 4 - 7", 2026)) ===
    JSON.stringify({ startDate: "2026-09-04", endDate: "2026-09-07" }),
  "Sept multi-day",
);

const FIXTURE = `
<html><body>
<h1>Triangle Recreation Camp</h1>
2026 Event Calendar
<a href="https://camptrc.org/event-6571339">May 22 - 25 NEON JUNGLE (Memorial Day) Kick off the season with an electric jungle vibe.</a>
<a href="https://furwoodcampout.com/">June 5 - 7 Camp Furwood A weekend Furry retreat in the heart of the PNW, proudly operated by Undefined.</a>
June 13 Pink Party Hosted by The Gayzebo. Wear your best pink gear!
<a href="https://camptrc.org/event-6573429">July 3 - 5 BLACK FOREST: Dark Alley (4th of July) Explore the shadows this Independence Day weekend.</a>
<a href="https://camptrc.org/event-6573466">Aug 7 - 9 White Sands/Dark Desires: A White Towel Affair Peak summer elegance and intrigue.</a>
<a href="https://k9campout.com/">Aug 14 - 16 K9 Campout K9 Campout is a human pup and handler event, proudly operated by Undefined.</a>
Aug 22 - 24 Friends & Family Weekend A special weekend for our families and straight allies to enjoy the magic of camp alongside the members of TRC!
<a href="https://camptrc.org/event-6573494">Sept 4 - 7 Jurasslic Park (Labor Day Finale) A prehistoric party to close out a legendary summer.</a>
</body></html>
`;

const events = parseCampTrcCalendar(FIXTURE);
assert(events.length >= 6, `fixture yields ≥6 theme weekends (got ${events.length})`);
const neon = events.find(e => /neon jungle/i.test(e.title));
assert(!!neon, "NEON JUNGLE present");
assert(neon!.startDate === "2026-05-22" && neon!.endDate === "2026-05-25", "NEON dates");
assert(neon!.eventPageUrl?.includes("event-6571339"), "NEON event page url");

const pink = events.find(e => /pink party/i.test(e.title));
assert(!!pink, "Pink Party present (no self link)");
assert(pink!.startDate === "2026-06-13", "Pink Party date");

const k9 = events.find(e => /k9/i.test(e.title));
assert(!!k9 && k9.eventPageUrl?.includes("k9campout.com"), "K9 external partner url");

const drafts = campTrcEventsToDrafts(events, { includePast: true });
assert(drafts.length === events.length, "draft count matches events");
assert(drafts.every(d => d.ageRequirement === "21_PLUS"), "all drafts 21_PLUS");
assert(drafts.every(d => d.venueName === "Triangle Recreation Camp"), "venue name stamped");
assert(drafts.every(d => /Granite Falls/i.test(d.address || "")), "WA address stamped");
assert(
  drafts.some(d => d.isSexPositive && /dark alley|dark desires|k9/i.test(d.title)),
  "kinkish weekends stamped sex-positive",
);

console.log("\nAll Camp TRC smokes passed.");
