/**
 * Smoke: Camp Bar + CC Slaughters + Eventbrite org parsers (offline fixtures).
 * Run: npx tsx script/smoke-trusted-html-weeklies.ts
 */
import {
  parseCampBarWeeklies,
  parseCampTime,
  weekliesToDrafts,
  nextWeekdayDates,
} from "../server/ingest/adapters/campBar";
import {
  parseCcSlaughtersNights,
  extractCcVerticalPosters,
  nightsToDrafts,
} from "../server/ingest/adapters/ccSlaughters";
import {
  extractEventbriteUpcomingEvents,
} from "../server/ingest/adapters/eventbriteOrg";
import { getTrustedVenue } from "../shared/trustedVenues";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

/* ── fetch modes registered ── */
assert(getTrustedVenue("camp-bar")?.fetchMode === "camp_bar_html", "camp-bar → camp_bar_html");
assert(
  getTrustedVenue("cc-slaughters")?.fetchMode === "cc_slaughters_html",
  "cc-slaughters → cc_slaughters_html",
);
assert(getTrustedVenue("stag-eb")?.fetchMode === "eventbrite_org", "stag-eb → eventbrite_org");
assert(
  getTrustedVenue("living-room-eb")?.fetchMode === "eventbrite_org",
  "living-room-eb → eventbrite_org",
);

/* ── Camp Bar ── */
assert(parseCampTime("7 PM to 9 PM") === "19:00", "camp time 7 PM");
assert(parseCampTime("8pm") === "20:00", "camp time 8pm");
assert(parseCampTime("Midnight") === "19:00" || parseCampTime("12 AM") === "00:00", "camp time fallback ok");

const CAMP_HTML = `
<div id="weeklyevents">
  <div class="dow"><h4>Tuesdays</h4>
    <div class='weeklyevent hh'>Happy Hour 4 PM to 7 PM Happy Hour $1 off</div>
    <div class='weeklyevent game'>Game On 6 PM to Midnight</div>
  </div>
  <div class="dow"><h4>Wednesdays</h4>
    <div class='weeklyevent karaoke'>Karaoke 8 PM to Midnight</div>
  </div>
  <div class="dow"><h4>Thursdays</h4>
    <div class='weeklyevent bingo'>Drag Bingo with Peachy Springs 7 PM to 9 PM</div>
  </div>
</div>`;

const weeklies = parseCampBarWeeklies(CAMP_HTML);
assert(weeklies.some(w => w.title === "Game On" && w.dow === 2), "camp parses Game On Tuesday");
assert(weeklies.some(w => /karaoke/i.test(w.title) && w.dow === 3), "camp parses Karaoke Wednesday");
assert(weeklies.some(w => /bingo/i.test(w.title) && w.dow === 4), "camp parses Drag Bingo Thursday");

const campDrafts = weekliesToDrafts(weeklies, {
  weeks: 2,
  includeHappyHour: false,
  now: new Date("2026-07-20T12:00:00"),
});
assert(campDrafts.length >= 6, `camp expands non-HH weeklies (got ${campDrafts.length})`);
assert(
  campDrafts.every(d => d.ageRequirement === "21_PLUS" && d.venueName === "Camp Bar PDX"),
  "camp policy stamps",
);
assert(
  campDrafts.every(d => !/^happy hour$/i.test(d.title)),
  "happy hour omitted by default",
);
assert(
  campDrafts.every(d => d.posterImageUrl == null),
  "camp posters stay null (no inventing)",
);
assert(
  campDrafts.every(d =>
    (d.warnings || []).some(w => /No flyer from Camp homepage/i.test(w)),
  ),
  "camp warns: no flyer — do not reuse other venue flyers",
);
assert(
  campDrafts.every(
    d =>
      /campbarpdx\.com/i.test(String(d.eventPageUrl || "")) &&
      /campbarpdx\.com/i.test(String(d.sourceUrl || "")),
  ),
  "camp source/event URLs stay on campbarpdx.com",
);

const tueDates = nextWeekdayDates(2, 3, new Date("2026-07-20T12:00:00"));
assert(tueDates[0] === "2026-07-21", `next Tuesday from Mon Jul 20 is 21 (got ${tueDates[0]})`);

/* ── CC Slaughters ── */
const CC_HTML = `
<h3 class="widget-title">Monday Game-Day</h3> CC's Community Foundation presents Drag Queen Bingo with Nicole Onoscopi. Every Monday | 7pm No Cover
<h3 class="widget-title">RAGER</h3> Queer-centered EDM night. Every Tuesday | 9pm Feat. DJ Mawmie No Cover 21+ | no exceptions
<h3 class="widget-title">HUMP WEDNESDAY</h3> It's amateur night at CC's. Every Wednesday | 7pm No Cover
<h3 class="widget-title">TRANS-UHH-LICIOUS</h3> A night dedicated to the trans community. Every Thursday | 9pm Featuring music by DJ ROBB.
<h3 class="widget-title">THE QUEENS KEYS</h3> Every Friday | 7pm Feat. live piano and singing No Cover 21+
<h3 class="widget-title">BLACK MAGIC</h3> Starring Rogue Storm Safari. Every 2nd Saturday | 9pm Featuring DJ Queer Cub $10 Cover 21+
<h3 class="widget-title">GEAR</h3> Hosted by PDX Collar Guard. Every 4th Saturday Feat. DJ Sorcery $10 Cover 9pm-2am 21+
<h3 class="widget-title">KEYED UP KARAOKE</h3> Every Sunday | 7pm Featuring Saint Syndrome & Kevin Hutman No Cover 21+
<img src="https://ccslaughterspdx.com/wp-content/uploads/2026/07/WEEKLYS_2026_ADVERTICAL_ONLINE.png" />
<img src="https://ccslaughterspdx.com/wp-content/uploads/2026/07/WEEKLYS_2026_ADVERTICAL_ONLINE-350x623.png" />
`;

const nights = parseCcSlaughtersNights(CC_HTML);
assert(nights.length >= 5, `cc parses most weeknights (got ${nights.length})`);
assert(
  nights.some(n => /bingo|game-?day/i.test(n.title) && n.dow === 1),
  "cc Monday bingo/game-day night",
);
assert(
  nights.find(n => n.dayName === "Saturday")?.title === "BLACK MAGIC" &&
    nights.find(n => n.dayName === "Saturday")?.timeHhmm === "21:00" &&
    nights.find(n => n.dayName === "Saturday")?.weekOfMonth === 2,
  "cc Black Magic keeps its named title, 9pm, and second-Saturday schedule",
);
assert(
  nights.find(n => n.dayName === "Friday")?.title === "THE QUEENS KEYS",
  "cc Friday keeps its named title instead of body copy",
);
assert(
  nights.find(n => n.title === "GEAR")?.timeHhmm === "21:00" &&
    nights.find(n => n.title === "GEAR")?.weekOfMonth === 4,
  "cc Gear keeps its fourth-Saturday schedule and 9pm start",
);
assert(
  nights.find(n => n.dayName === "Thursday")?.timeHhmm === "21:00",
  "cc Thursday keeps its 9pm schedule over a descriptive 2am close",
);
const posters = extractCcVerticalPosters(CC_HTML);
assert(
  posters.some(p => p.endsWith("WEEKLYS_2026_ADVERTICAL_ONLINE.png")),
  "cc prefers full ADVERTICAL not resized",
);
const ccDrafts = nightsToDrafts(nights, posters[0], {
  weeks: 6,
  now: new Date("2026-08-21T12:00:00"),
});
assert(ccDrafts.length >= 35, `cc expands nights (got ${ccDrafts.length})`);
const blackMagicDates = ccDrafts
  .filter(d => d.title === "BLACK MAGIC")
  .map(d => d.dateStart.slice(0, 10));
const gearDates = ccDrafts
  .filter(d => d.title === "GEAR")
  .map(d => d.dateStart.slice(0, 10));
assert(
  JSON.stringify(blackMagicDates) === JSON.stringify(["2026-09-12"]),
  `cc Black Magic expands only second Saturdays (got ${blackMagicDates.join(", ")})`,
);
assert(
  JSON.stringify(gearDates) === JSON.stringify(["2026-08-22", "2026-09-26"]),
  `cc Gear expands only fourth Saturdays (got ${gearDates.join(", ")})`,
);
assert(
  ccDrafts.every(d => d.venueName === "CC Slaughters" && d.ageRequirement === "21_PLUS"),
  "cc policy stamps",
);
assert(
  ccDrafts.every(d => d.posterImageUrl == null),
  "cc per-night posters null (shared ADVERTICAL is lineup-only)",
);
assert(
  ccDrafts.every(d =>
    (d.warnings || []).some(w => /Shared weekly lineup poster \(not per-night art\)/i.test(w)),
  ),
  "cc warns: shared weekly lineup poster (not per-night art)",
);

/* ── Eventbrite org embed ── */
const EB_HTML = `
<html><body>
<script>
window.__data = {"upcomingEvents":[
  {"id":"1994403710185","name":"BROADWAY'S FINEST Drag Brunch","url":"https://www.eventbrite.com/e/broadways-finest-drag-brunch-tickets-1994403710185","start_date":"2026-08-22","start_time":"11:00:00","end_date":"2026-08-22","end_time":"14:00:00","timezone":"America/Los_Angeles","is_cancelled":false,"image":{"url":"https://img.evbuc.com/brunch.jpg"}},
  {"id":"1","name":"Past Night","url":"https://www.eventbrite.com/e/x-1","start_date":"2020-01-01","start_time":"20:00:00"}
]};
</script>
</body></html>`;
const events = extractEventbriteUpcomingEvents(EB_HTML);
assert(events.length === 2, `eb extract upcomingEvents (got ${events.length})`);
assert(events[0].name.includes("Drag Brunch"), "eb first event is brunch");

console.log("\nAll Camp / CC / Eventbrite-org smoke checks passed.");
