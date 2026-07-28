/**
 * Smoke: submissionMatch cross-venue contamination guards.
 * - Exact title + same day across different venues → medium at most (not strong dup)
 * - Same title + same venue same day → still high / strong dup
 * - Same ticket URL can still be high across venue-string drift
 * Run: npx tsx script/smoke-submission-match.ts
 */
import {
  findSubmissionMatches,
  scoreSubmissionAgainstEvent,
  submissionHasStrongDuplicate,
} from "../shared/submissionMatch";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

const DAY = "2026-07-22T20:00:00";

const campKaraoke = {
  title: "Karaoke",
  venueName: "Camp Bar",
  address: "1234 SE Division St, Portland, OR",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  ticketUrl: null as string | null,
};

const eagleKaraoke = {
  id: 101,
  title: "Karaoke",
  venueName: "Eagle Portland",
  address: "835 N Lombard St, Portland, OR 97217",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  status: "LIVE",
  ticketUrl: null as string | null,
};

const campKaraokeBoard = {
  id: 202,
  title: "Karaoke",
  venueName: "Camp Bar",
  address: "1234 SE Division St, Portland, OR",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  status: "LIVE",
  ticketUrl: null as string | null,
};

const badlandsHappyHour = {
  id: 303,
  title: "Happy Hour",
  venueName: "Badlands",
  address: "223 SW Stark St, Portland, OR",
  dateStart: DAY,
  dateEnd: "2026-07-22T19:00:00",
  status: "LIVE",
  ticketUrl: null as string | null,
};

// --- Cross-venue exact title + same day must NOT be high ---
const cross = scoreSubmissionAgainstEvent(campKaraoke, eagleKaraoke);
assert(cross != null, "cross-venue Karaoke still surfaces as a candidate");
assert(cross!.confidence !== "high", `cross-venue Karaoke confidence is ${cross!.confidence}, not high`);
assert(cross!.score <= 68, `cross-venue Karaoke score ${cross!.score} capped ≤ 68`);
assert(
  !submissionHasStrongDuplicate([cross!]),
  "cross-venue Karaoke is not a strong duplicate (auto-merge safe)",
);

// --- Same venue exact title + same day remains high ---
const sameVenue = scoreSubmissionAgainstEvent(campKaraoke, campKaraokeBoard);
assert(sameVenue != null, "same-venue Karaoke matches");
assert(sameVenue!.confidence === "high", `same-venue Karaoke is high (got ${sameVenue!.confidence})`);
assert(sameVenue!.score >= 72, `same-venue Karaoke score ${sameVenue!.score} ≥ 72`);
assert(
  !!submissionHasStrongDuplicate([sameVenue!]),
  "same-venue Karaoke is a strong duplicate",
);

// --- Short generic titles across venues never high ---
const happyHourCross = scoreSubmissionAgainstEvent(
  {
    title: "Happy Hour",
    venueName: "Camp Bar",
    address: "1234 SE Division St, Portland, OR",
    dateStart: DAY,
    dateEnd: "2026-07-22T19:00:00",
    ticketUrl: null,
  },
  badlandsHappyHour,
);
assert(happyHourCross != null, "Happy Hour cross-venue still surfaces");
assert(
  happyHourCross!.confidence !== "high",
  `Happy Hour cross-venue is ${happyHourCross!.confidence}, not high`,
);
assert(happyHourCross!.score <= 68, `Happy Hour cross score ${happyHourCross!.score} ≤ 68`);

// --- Ticket URL match can still be high across venue-string drift ---
// Use venues that do NOT fuzzy-match each other so the ticket URL is the anchor.
const ticketUrl = "https://www.eventbrite.com/e/fresh-paint-tickets-123456789";
const subTickets = {
  title: "Fresh Paint",
  venueName: "Hosted at TBA",
  address: "",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  ticketUrl,
};
const evtTickets = {
  id: 404,
  title: "Fresh Paint",
  venueName: "Badlands",
  address: "223 SW Stark St, Portland, OR",
  dateStart: DAY,
  dateEnd: "2026-07-22T23:00:00",
  status: "LIVE",
  ticketUrl: "https://eventbrite.com/e/fresh-paint-tickets-123456789",
};
const ticketMatch = scoreSubmissionAgainstEvent(subTickets, evtTickets);
assert(ticketMatch != null, "ticket-URL match surfaces");
assert(
  ticketMatch!.confidence === "high",
  `ticket-URL match is high despite venue drift (got ${ticketMatch!.confidence}, score ${ticketMatch?.score})`,
);
assert(
  ticketMatch!.reasons.includes("Same ticket link"),
  "ticket-URL match reasons include Same ticket link",
);
assert(
  !!submissionHasStrongDuplicate([ticketMatch!]),
  "ticket-URL match is a strong duplicate",
);

// --- findSubmissionMatches + strong helper end-to-end ---
const ranked = findSubmissionMatches(campKaraoke, [eagleKaraoke, campKaraokeBoard]);
assert(ranked.length >= 1, "findSubmissionMatches returns candidates");
const strong = submissionHasStrongDuplicate(ranked);
assert(strong != null, "strong dup exists among Camp + Eagle board");
assert(strong!.eventId === 202, `strong dup is Camp #202, not Eagle (got #${strong!.eventId})`);
assert(
  !ranked.some(m => m.eventId === 101 && m.confidence === "high"),
  "Eagle Karaoke same day is never high vs Camp",
);

console.log("\nAll submissionMatch cross-venue guards passed.");
