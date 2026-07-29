/**
 * Profile-only hosted past events for @tucker_pdmax.
 * Sources: yescoachparty.com, pdxsanctuary.com, Eagle Locker Room series.
 * Negative IDs - never in LIVE feeds; merged only in getPublicProfile hosting.past.
 *
 * Flyer-confirmed @brohoejams (Bro Hoe) DJ + Host credits are also merged into
 * his profile hosting.past (subset of this archive).
 */
import type { Event } from "./schema";
import { pacificCalendarDate, pacificDayOfWeek, parsePacificDateTime } from "./missedConnections";

export const TUCKER_HOSTED_ARCHIVE_USERNAME = "tucker_pdmax";
/** Production username for DJ/host Bro Hoe. */
export const BROHOE_ARCHIVE_USERNAME = "brohoejams";

export type TuckerHostedArchiveRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  venueName: string;
  address: string;
  neighborhood: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string;
  admission: Event["admission"];
  ticketUrl: string | null;
  posterImageUrl: string;
  eventTypes: string[];
  isSexPositive: boolean;
  nudityOk: boolean;
};

const LOCKER_ROOM_POSTER = "/posters/tucker-archive/locker-room-dec-2025.png";
const LOCKER_ROOM_DESC =
  "The Locker Room: Athletic Gear Night - every last Friday at The Eagle Portland, 9PM–close. Hosted by Tucker Max, music by DJ Bro Hoe, $5 cover. Jocks, singlets, compression gear encouraged. Stripping contest with cash prizes. 835 N Lombard St, Portland.";

/**
 * Locker Room last-Friday series.
 * Excluded months (any year): January, February, July, September.
 * Also exclude June 2026 specifically.
 */
const LOCKER_ROOM_DATES = [
  "2025-03-28",
  "2025-04-25",
  "2025-05-30",
  "2025-06-27",
  "2025-08-29",
  "2025-10-31",
  "2025-11-28",
  "2025-12-26",
  "2026-03-27",
  "2026-04-24",
  "2026-05-29",
] as const;

function pacificOffsetForDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 20, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(noonUtc));
  const tz = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT-8";
  const m2 = tz.match(/GMT([+-])(\d+)(?::?(\d+))?/);
  if (!m2) return "-0800";
  const sign = m2[1] === "+" ? "+" : "-";
  const hh = m2[2].padStart(2, "0");
  const mm = (m2[3] ?? "00").padStart(2, "0");
  return `${sign}${hh}${mm}`;
}

function pacificIsoLocal(isoWithOffset: string): string {
  const ms = parsePacificDateTime(isoWithOffset);
  if (ms == null) return isoWithOffset.replace(/([+-]\d{2}:?\d{2}|Z)$/i, "");
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

function archiveRow(input: {
  id: number;
  slug: string;
  title: string;
  description: string;
  venueName: string;
  start: string;
  end: string;
  poster: string;
  admission?: Event["admission"];
  ticketUrl?: string | null;
  eventTypes?: string[];
}): TuckerHostedArchiveRow {
  const dateStart = pacificIsoLocal(input.start);
  const dateEnd = pacificIsoLocal(input.end);
  const ms = parsePacificDateTime(dateStart);
  const dayOfWeek = ms != null ? pacificDayOfWeek(ms) : "FRI";
  const isSanctuary = /sanctuary/i.test(input.venueName);
  const isEagle = /eagle/i.test(input.venueName);
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    venueName: input.venueName,
    address: isSanctuary
      ? "33 NW 9th Ave, Portland, OR 97209"
      : isEagle
        ? "835 N Lombard St, Portland, OR 97217"
        : "Portland, OR",
    neighborhood: isSanctuary ? "Pearl District" : isEagle ? "North Portland" : "Portland",
    dateStart,
    dateEnd,
    dayOfWeek,
    admission: input.admission ?? (isSanctuary ? "DOOR_FEE" : "TICKETED"),
    ticketUrl: input.ticketUrl ?? (isSanctuary ? "https://members.pdxsanctuary.com" : "https://www.eagleportland.com"),
    posterImageUrl: input.poster,
    eventTypes: input.eventTypes ?? ["PARTY", "LEATHER"],
    isSexPositive: true,
    nudityOk: true,
  };
}

function buildLockerRoomRows(): TuckerHostedArchiveRow[] {
  return LOCKER_ROOM_DATES.map((ymd, index) => {
    const off = pacificOffsetForDate(ymd);
    const [y, m, d] = ymd.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const endYmd = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    const endOff = pacificOffsetForDate(endYmd);
    return archiveRow({
      id: -901_000 - index,
      slug: `locker-room-${ymd}`,
      title: "The Locker Room",
      description: LOCKER_ROOM_DESC,
      venueName: "Eagle Portland",
      start: `${ymd}T21:00:00${off}`,
      end: `${endYmd}T02:00:00${endOff}`,
      poster: LOCKER_ROOM_POSTER,
      admission: "TICKETED",
      ticketUrl: "https://www.eagleportland.com/event-details/the-locker-room",
      eventTypes: ["PARTY", "LEATHER", "SPORTS"],
    });
  });
}

/** One-off + recurring Sanctuary / Yes Coach nights (yescoachparty.com + pdxsanctuary.com). */
const TUCKER_HOSTED_ARCHIVE_ONE_OFFS: TuckerHostedArchiveRow[] = [
  archiveRow({
    id: -900_001,
    slug: "woof-christmas-2025",
    title: "Woof of Wall Street - Office Christmas Party",
    description:
      "The office Christmas party just got promoted. Woof of Wall Street brings business, pleasure, and bad decisions to Sanctuary. Dress in suits, ties, or office kink. Music by StormyRoxx. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2025-12-07T18:00:00-0800",
    end: "2025-12-07T23:00:00-0800",
    poster: "/posters/tucker-archive/woof-christmas-2025.png",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_002,
    slug: "yes-coach-1989",
    title: "Yes Coach: 1989",
    description:
      "YES COACH: 1989 at Sanctuary PDX with Remy D and BirthdayGurl. Neon 80s gym fantasy - sweat, spandex, and synth. Athletic fetish encouraged: spandex, jocks, tanks, sneakers, vintage workout gear.",
    venueName: "Sanctuary Club",
    start: "2025-11-02T18:00:00-0800",
    end: "2025-11-02T22:30:00-0800",
    poster: "/posters/tucker-archive/yes-coach-1989-v2.jpg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_003,
    slug: "fraternity-pledge-night-2025",
    title: "The Fraternity: Pledge Night",
    description:
      "Yes Coach Productions at Sanctuary U - full-contact initiation with beer pong dares, gear checks, and hazing games. Hosts: Tucker Max & JP Hardy. DJ Greg McKeon.",
    venueName: "Sanctuary Club",
    start: "2025-09-07T18:00:00-0700",
    end: "2025-09-07T23:00:00-0700",
    poster: "/posters/tucker-archive/fraternity-2025.avif",
    ticketUrl: "https://members.pdxsanctuary.com/events/80709",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_004,
    slug: "yes-ponies-2025",
    title: "Yes Ponies",
    description:
      "Western-themed collab between Yes Coach Productions and Pink Ponies - chaps, corsets, Stetsons, and stilettos at Sanctuary. Fundraiser hoedown hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2025-08-03T18:00:00-0700",
    end: "2025-08-03T23:00:00-0700",
    poster: "/posters/tucker-archive/yes-ponies-2025.jpg",
    ticketUrl: "https://members.pdxsanctuary.com/events/79712",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_005,
    slug: "stank-pride-2025",
    title: "Stank × Yes Coach - Portland Pride",
    description:
      "STANK x YES COACH - Portland's dirtiest Pride after-hours party. Gear-heavy crossover with sweaty bodies, jockstraps, sneakers, dark beats, and raw cruising energy at Sanctuary. Prizes from Mr-S Leather, Cellblock 13, and Fuck Water. Hosted by Tucker Max and Spencer Stanks. DJs include Bro Hoe.",
    venueName: "Sanctuary Club",
    start: "2025-07-19T22:00:00-0700",
    end: "2025-07-20T04:00:00-0700",
    poster: "/posters/tucker-archive/stank-pride-2025.png",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
    ticketUrl: "https://members.pdxsanctuary.com/events/93071",
  }),
  archiveRow({
    id: -900_006,
    slug: "sunny-sides-2025",
    title: "Sunny Sides",
    description:
      "Brunchtime jack-off party for sides - Yes Coach Productions × Stumptown Strokes at Sanctuary. Hands, bodies, lube, and slow simmers. No penetration. Doors close 11:30AM.",
    venueName: "Sanctuary Club",
    start: "2025-07-06T11:00:00-0700",
    end: "2025-07-06T14:00:00-0700",
    poster: "/posters/tucker-archive/sunny-sides-2025.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_007,
    slug: "glowpocalypse-2025",
    title: "Glowpocalypse",
    description:
      "GLOWPOCALYPSE - radioactive rave dripping in sweat, glowing in UV, pulsing with end-of-days energy. Gear up, strip down, and get filthy in a neon-lit wasteland of men, muscle, and mayhem. Woof of Wall Street series at Sanctuary. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2025-06-01T18:00:00-0700",
    end: "2025-06-01T23:00:00-0700",
    poster: "/posters/tucker-archive/glowpocalypse-2025.png",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_008,
    slug: "honey-tradie-2025",
    title: "Honey - Tradie Night",
    description:
      "Tradie Night at the honey factory - blue-collar kink, industrial fantasy, and raw sweaty connection at Sanctuary. Hosts Tucker Max & JP Hardy. Music by Remy D. Hi-vis, hard hats, and tradie gear encouraged.",
    venueName: "Sanctuary Club",
    start: "2025-05-04T18:00:00-0700",
    end: "2025-05-04T23:00:00-0700",
    poster: "/posters/tucker-archive/honey-tradie-night.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_009,
    slug: "yes-coach-apr-2025",
    title: "Yes Coach!",
    description:
      "Athletic fetish party at Sanctuary - sporty meets sexy. Featuring Greg McKeon and Starkey. Hosted by Tucker Max. 6PM–11PM.",
    venueName: "Sanctuary Club",
    start: "2025-04-06T18:00:00-0700",
    end: "2025-04-06T23:00:00-0700",
    poster: "/posters/tucker-archive/yes-coach-apr-2025.jpg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_010,
    slug: "hyde-golden-age",
    title: "Hyde - Golden Age",
    description:
      "Cowboy leather daddy Western night at Sanctuary PDX. Second Hyde party following Leather Disco. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2025-03-02T18:00:00-0800",
    end: "2025-03-02T23:00:00-0800",
    poster: "/posters/tucker-archive/hyde-golden-age.jpeg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_011,
    slug: "camp-honey-2025",
    title: "Camp Honey",
    description:
      "Outdoor camp fantasy at Sanctuary - bears, honey, and mountain energy. Ranger JP Hardy. Music by Bro Hoe. Yes Coach Productions.",
    venueName: "Sanctuary Club",
    start: "2025-02-02T18:00:00-0800",
    end: "2025-02-02T23:00:00-0800",
    poster: "/posters/tucker-archive/camp-honey.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_012,
    slug: "woof-jan-2025",
    title: "Yes Coach Woof of Wall Street",
    description:
      "Mandatory Meeting Alert: The Woof of Wall Street. Tucker Max & JP Hardy at Sanctuary - corporate-themed party where business meets pleasure. DJs Remy D & Noël. Business suits or geek chic.",
    venueName: "Sanctuary Club",
    start: "2025-01-05T18:00:00-0800",
    end: "2025-01-05T23:00:00-0800",
    poster: "/posters/tucker-archive/woof-jan-2025.jpeg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_013,
    slug: "yes-coach-nov-2024",
    title: "Yes Coach!",
    description:
      "The original Yes Coach athletic fetish night at Sanctuary. Team gear, contests, and consent-focused play. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-11-03T18:00:00-0800",
    end: "2024-11-03T23:00:00-0800",
    poster: "/posters/tucker-archive/yes-coach-nov-2024.jpeg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_015,
    slug: "primal-masquerade-2024",
    title: "Primal Masquerade - Mask 4 Mask",
    description:
      "Masquerade night at Sanctuary - masks, mystery, and primal energy. Tucker Max presents. Music by Remy D & StormyRoxx.",
    venueName: "Sanctuary Club",
    start: "2024-10-06T18:00:00-0700",
    end: "2024-10-06T23:00:00-0700",
    poster: "/posters/tucker-archive/primal-masquerade-oct6.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_016,
    slug: "hyde-2024",
    title: "Hyde",
    description: "Leather disco bash at Sanctuary - the first Hyde party. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-09-01T17:55:00-0700",
    end: "2024-09-01T22:45:00-0700",
    poster: "/posters/tucker-archive/hyde-2024.png",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_017,
    slug: "fairy-dust-2024",
    title: "Fairy Dust",
    description:
      "Fantasy-forward play party at Sanctuary - wings, firelight, and forest magic. Tucker Max presents. Water-based lube only.",
    venueName: "Sanctuary Club",
    start: "2024-08-04T18:00:00-0700",
    end: "2024-08-05T00:00:00-0700",
    poster: "/posters/tucker-archive/fairy-dust-2024.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_018,
    slug: "yes-coach-pride-2024",
    title: "Yes Coach! Pride",
    description:
      "Yes Coach! PRIDE during Portland Pride weekend at Sanctuary - expanded celebration of athletic gear fetish and community. DJs TreVer Pearson, Remy D, and StormyRoxx. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-07-20T21:00:00-0700",
    end: "2024-07-21T02:00:00-0700",
    poster: "/posters/tucker-archive/yes-coach-pride-2024.jpeg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_019,
    slug: "caligula-2024",
    title: "Caligula - A Toga-y Party!",
    description:
      "Roman debauchery at Sanctuary with DJ TreVer Pearson. Togas, indulgence, and sensual exploration. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-07-07T18:00:00-0700",
    end: "2024-07-08T00:00:00-0700",
    poster: "/posters/tucker-archive/caligula-2024.jpeg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_020,
    slug: "kink-codes-2024",
    title: "Kink Codes",
    description:
      "Kink Codes at Sanctuary - a celebration of flagging culture. Shadows, desire, and pulsating beats from DJ Orso. Leather, PVC, and a diverse array of kinks and fetishes. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-06-02T18:00:00-0700",
    end: "2024-06-03T00:00:00-0700",
    poster: "/posters/tucker-archive/kink-codes-2024.jpeg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_021,
    slug: "honey-2024",
    title: "Honey",
    description:
      "Welcome to Honey - the ultimate gathering for bears and beefy enthusiasts. Honey flows as freely as the good vibes. Tantalizing drinks, steamy dance floor, unleash your inner beast. Hosted by Tucker Max at Sanctuary.",
    venueName: "Sanctuary Club",
    start: "2024-05-05T18:00:00-0700",
    end: "2024-05-06T00:00:00-0700",
    poster: "/posters/tucker-archive/honey-2024.jpeg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_022,
    slug: "yes-coach-teams-2024",
    title: "Yes Coach! Teams",
    description:
      "Athletic fetish team-uniform party at Sanctuary. Gear contest and water-based lube policy. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2024-04-07T18:00:00-0700",
    end: "2024-04-08T00:00:00-0700",
    poster: "/posters/tucker-archive/yes-coach-teams-2024.jpeg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_024,
    slug: "cozy-2026",
    title: "Cozy",
    description:
      "Intimate Yes Coach night at Sanctuary - soft lighting, close bodies, and slow heat. Hosted by Tucker Max. Music by Bro Hoe.",
    venueName: "Sanctuary Club",
    start: "2026-01-04T17:00:00-0800",
    end: "2026-01-04T23:00:00-0800",
    poster: "/posters/tucker-archive/cozy-2025.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_025,
    slug: "hyde-feb-2026",
    title: "Hyde",
    description:
      "1970s leather & disco night at Sanctuary - hosted by Bro Hoe for Yes Coach Productions. Classic cock, Fuck Water, arrive before 8.",
    venueName: "Sanctuary Club",
    start: "2026-02-01T17:00:00-0800",
    end: "2026-02-01T23:00:00-0800",
    poster: "/posters/tucker-archive/hyde-feb-2025.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_026,
    slug: "yes-codes-2025",
    title: "Yes Codes",
    description:
      "Learn · Flag · Play - Yes Coach Productions kink-codes night at Sanctuary. Hosted by Unworthyslutboy. Top, bottom, vers energy and consent-forward flagging culture.",
    venueName: "Sanctuary Club",
    start: "2025-03-01T18:00:00-0800",
    end: "2025-03-01T23:00:00-0800",
    poster: "/posters/tucker-archive/yes-codes-2025.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_027,
    slug: "primal-masquerade-2025",
    title: "Primal Masquerade - Mask 4 Mask",
    description:
      "Masquerade night at Sanctuary - masks, mystery, and primal energy. DJs Poundstar & Heart On. Hosted by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2025-10-05T18:00:00-0700",
    end: "2025-10-05T23:00:00-0700",
    poster: "/posters/tucker-archive/primal-masquerade-2025.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_028,
    slug: "yes-coach-apr-2026",
    title: "Yes Coach - Fantasy Fetish",
    description:
      "Yes Coach Productions fantasy fetish party at Sanctuary - athletic gear, sports fantasy, and team energy. Friday night 9PM–close. Presented by Tucker Max.",
    venueName: "Sanctuary Club",
    start: "2026-04-03T21:00:00-0700",
    end: "2026-04-04T02:00:00-0700",
    poster: "/posters/tucker-archive/yes-coach-apr-2026.jpg",
    eventTypes: ["PARTY", "SPORTS", "LEATHER"],
  }),
  archiveRow({
    id: -900_029,
    slug: "sanctuary-overtime-2026",
    title: "Sanctuary Overtime",
    description:
      "Construction-site chaos at Sanctuary - overtime energy, hard hats, and after-hours play. Yes Coach Productions. Hosted by Tucker Max with Detour Dan. Music by DJ Bro Hoe.",
    venueName: "Sanctuary Club",
    start: "2026-05-03T18:00:00-0700",
    end: "2026-05-03T23:00:00-0700",
    poster: "/posters/tucker-archive/sanctuary-overtime-2026.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_030,
    slug: "jawbreakers-2026",
    title: "Jawbreakers",
    description:
      "Yes Coach Productions summer party at Sanctuary - June 7, 6PM–close. Tucker summer presale $19. Choking hazard warning: suckers, trophies, and hard candy energy.",
    venueName: "Sanctuary Club",
    start: "2026-06-07T18:00:00-0700",
    end: "2026-06-07T23:00:00-0700",
    poster: "/posters/tucker-archive/jawbreakers-2026.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
  archiveRow({
    id: -900_031,
    slug: "goon-den-2026",
    title: "The Goon Den",
    description:
      "Cock × Block presents The Goon Den at Sanctuary - July 5, 6PM–close. Bators-only night hosted by Tucker Max. Yes Coach Productions.",
    venueName: "Sanctuary Club",
    start: "2026-07-05T18:00:00-0700",
    end: "2026-07-05T23:00:00-0700",
    poster: "/posters/tucker-archive/goon-den-2026.jpg",
    eventTypes: ["PARTY", "LEATHER"],
  }),
];

const TUCKER_HOSTED_ARCHIVE_ROWS: TuckerHostedArchiveRow[] = [
  ...buildLockerRoomRows(),
  ...TUCKER_HOSTED_ARCHIVE_ONE_OFFS,
];

const ARCHIVE_ID_SET = new Set(TUCKER_HOSTED_ARCHIVE_ROWS.map(r => r.id));
const ARCHIVE_IDS = Array.from(ARCHIVE_ID_SET);
export const TUCKER_HOSTED_ARCHIVE_ID_MIN = Math.min(...ARCHIVE_IDS);
export const TUCKER_HOSTED_ARCHIVE_ID_MAX = Math.max(...ARCHIVE_IDS);

export function isTuckerHostedArchiveId(id: number): boolean {
  return ARCHIVE_ID_SET.has(id);
}

export function getTuckerHostedArchiveRows(): TuckerHostedArchiveRow[] {
  return TUCKER_HOSTED_ARCHIVE_ROWS;
}

export function getTuckerHostedArchiveRow(id: number): TuckerHostedArchiveRow | undefined {
  if (!isTuckerHostedArchiveId(id)) return undefined;
  return TUCKER_HOSTED_ARCHIVE_ROWS.find(r => r.id === id);
}

export function tuckerHostedArchiveAsEvent(row: TuckerHostedArchiveRow): Event {
  const now = new Date().toISOString();
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venueName: row.venueName,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: null,
    lng: null,
    dateStart: row.dateStart,
    dateEnd: row.dateEnd,
    dayOfWeek: row.dayOfWeek,
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(row.eventTypes),
    admission: row.admission,
    ticketUrl: row.ticketUrl,
    isPublic: false,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: row.isSexPositive,
    nudityOk: row.nudityOk,
    posterImageUrl: row.posterImageUrl,
    status: "HIDDEN",
    source: "profile_archive",
    isClaimable: false,
    claimedBy: TUCKER_HOSTED_ARCHIVE_USERNAME,
    submittedBy: null,
    adminNotes: `profile_archive:${row.slug}`,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function eventCalendarDay(dateStart: string): string | null {
  return pacificCalendarDate(dateStart);
}

function eventCalendarMonth(dateStart: string): string | null {
  const day = eventCalendarDay(dateStart);
  return day ? day.slice(0, 7) : null;
}

/** Skip archive row when a LIVE past host row is the same night + same show family. */
export function archiveDuplicatesLivePast(
  archive: TuckerHostedArchiveRow,
  live: { title: string; dateStart: string },
): boolean {
  const dayA = eventCalendarDay(archive.dateStart);
  const dayB = eventCalendarDay(live.dateStart);
  if (!dayA || !dayB || dayA !== dayB) return false;

  const a = normalizeTitleKey(archive.title);
  const b = normalizeTitleKey(live.title);
  if (a === b) return true;

  const stankA = a.includes("stank") && (a.includes("coach") || a.includes("yes"));
  const stankB = b.includes("stank") && (b.includes("coach") || b.includes("yes"));
  if (stankA && stankB) return true;

  const lockerA = a.includes("locker");
  const lockerB = b.includes("locker");
  if (lockerA && lockerB) return true;

  const coachA = a.includes("yes coach") || a === "yes coach";
  const coachB = b.includes("yes coach") || b === "yes coach";
  if (coachA && coachB && !a.includes("stank") && !b.includes("stank")) return true;

  return false;
}

/** Skip duplicate archive rows already represented in live past (by month for Locker Room). */
function archiveDuplicatesMergedPast(
  archive: TuckerHostedArchiveRow,
  merged: ProfileHostedEventWire[],
): boolean {
  if (merged.some(live => archiveDuplicatesLivePast(archive, live))) return true;

  const archiveMonth = eventCalendarMonth(archive.dateStart);
  const aTitle = normalizeTitleKey(archive.title);

  if (aTitle.includes("locker")) {
    return merged.some(row => {
      if (!normalizeTitleKey(row.title).includes("locker")) return false;
      return eventCalendarMonth(row.dateStart) === archiveMonth;
    });
  }

  return false;
}

export type ProfileHostedEventWire = {
  id: number;
  title: string;
  venueName: string;
  dayOfWeek: string;
  dateStart: string;
  dateEnd: string;
  admission: string;
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
  neighborhood?: string | null;
};

/**
 * Flyer-confirmed archive nights where @brohoejams is DJ + Host.
 * Locker Room series (every last Friday) + Stank 2025, Camp Honey, Cozy,
 * Hyde Feb 2026 (hosted by Bro Hoe), Sanctuary Overtime.
 * Fairy Dust excluded - flyer only has DJ placeholders.
 */
const BROHOE_ARCHIVE_ONE_OFF_SLUGS = new Set([
  "stank-pride-2025",
  "camp-honey-2025",
  "cozy-2026",
  "hyde-feb-2026",
  "sanctuary-overtime-2026",
]);

export function isBroHoeArchiveCredit(row: Pick<TuckerHostedArchiveRow, "slug">): boolean {
  if (row.slug.startsWith("locker-room-")) return true;
  return BROHOE_ARCHIVE_ONE_OFF_SLUGS.has(row.slug);
}

export function getBroHoeArchiveCreditRows(): TuckerHostedArchiveRow[] {
  return TUCKER_HOSTED_ARCHIVE_ROWS.filter(isBroHoeArchiveCredit);
}

function archiveRowToWire(row: TuckerHostedArchiveRow): ProfileHostedEventWire {
  return {
    id: row.id,
    title: row.title,
    venueName: row.venueName,
    dayOfWeek: row.dayOfWeek,
    dateStart: row.dateStart,
    dateEnd: row.dateEnd,
    admission: row.admission,
    ticketUrl: row.ticketUrl,
    posterImageUrl: row.posterImageUrl,
    neighborhood: row.neighborhood,
  };
}

function sortPastByDateDesc(rows: ProfileHostedEventWire[]): ProfileHostedEventWire[] {
  return [...rows].sort((a, b) => {
    const ta = parsePacificDateTime(a.dateStart) ?? 0;
    const tb = parsePacificDateTime(b.dateStart) ?? 0;
    return tb - ta;
  });
}

/**
 * Merge profile-archive past nights into hosting.past / attended past.
 * - @tucker_pdmax: full Yes Coach / Locker Room archive
 * - @brohoejams: flyer-confirmed DJ + Host subset only
 */
export function mergeTuckerHostedArchivePast(
  username: string,
  livePast: ProfileHostedEventWire[],
): ProfileHostedEventWire[] {
  const key = username.trim().toLowerCase();
  const fullArchive = key === TUCKER_HOSTED_ARCHIVE_USERNAME;
  const brohoeArchive = key === BROHOE_ARCHIVE_USERNAME;
  if (!fullArchive && !brohoeArchive) return livePast;

  const candidateRows = fullArchive
    ? TUCKER_HOSTED_ARCHIVE_ROWS
    : getBroHoeArchiveCreditRows();

  const seenSlug = new Set<string>();
  const archiveWire: ProfileHostedEventWire[] = [];
  const mergedSoFar: ProfileHostedEventWire[] = [...livePast];

  for (const row of candidateRows) {
    if (seenSlug.has(row.slug)) continue;
    if (archiveDuplicatesMergedPast(row, mergedSoFar)) continue;
    seenSlug.add(row.slug);

    const wire = archiveRowToWire(row);
    archiveWire.push(wire);
    mergedSoFar.push(wire);
  }

  return sortPastByDateDesc([...livePast, ...archiveWire]);
}

/** Synthetic host/talent for archive event detail (negative IDs not in event_* tables). */
export type ArchiveSyntheticCredit = {
  username: string;
  role: "PRIMARY" | "COHOST" | "DJ";
};

export function getArchiveSyntheticCredits(eventId: number): ArchiveSyntheticCredit[] {
  const row = getTuckerHostedArchiveRow(eventId);
  if (!row) return [];
  const credits: ArchiveSyntheticCredit[] = [
    { username: TUCKER_HOSTED_ARCHIVE_USERNAME, role: "PRIMARY" },
  ];
  if (isBroHoeArchiveCredit(row)) {
    // Hyde Feb 2026 flyer: hosted by Bro Hoe - still list Tucker as series primary,
    // Bro Hoe as COHOST + DJ (matches "DJ and Host" on every flyer-found credit).
    credits.push({ username: BROHOE_ARCHIVE_USERNAME, role: "COHOST" });
    credits.push({ username: BROHOE_ARCHIVE_USERNAME, role: "DJ" });
  }
  return credits;
}