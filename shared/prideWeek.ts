/**
 * Portland Pride Week 2026 (Mon Jul 13 – Sun Jul 19) — single source of truth
 * for day codes, dates, labels, and day colors. Everything that renders or
 * stores a Pride day derives from this file. See docs/PRIDE_WEEK_13_19_PLAN.md.
 */
import { pacificDayOfWeek, parsePacificDateTime } from "./missedConnections";

export const PRIDE_WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type PrideWeekDay = (typeof PRIDE_WEEK_DAYS)[number];

/** Reserved for RSVP pulse on the events map — no day may use this hex. */
export const RSVP_COLOR = "#CCFF00";

export const PRIDE_WEEK_DAY_OPTIONS: ReadonlyArray<{
  value: PrideWeekDay;
  label: string;
  date: string;
  nextDate: string;
  /** Neon accent — map pins, glows, fills (≥3:1 on near-black). */
  color: string;
  /** Text-safe variant — day pills, tags, labels (≥4.5:1 on near-black). */
  textColor: string;
}> = [
  { value: "MON", label: "Monday July 13", date: "2026-07-13", nextDate: "2026-07-14", color: "#8800FF", textColor: "#AA66FF" },
  { value: "TUE", label: "Tuesday July 14", date: "2026-07-14", nextDate: "2026-07-15", color: "#0044FF", textColor: "#4488FF" },
  { value: "WED", label: "Wednesday July 15", date: "2026-07-15", nextDate: "2026-07-16", color: "#FFEE00", textColor: "#FFEE00" },
  { value: "THU", label: "Thursday July 16", date: "2026-07-16", nextDate: "2026-07-17", color: "#00FFFF", textColor: "#00FFFF" },
  { value: "FRI", label: "Friday July 17", date: "2026-07-17", nextDate: "2026-07-18", color: "#FF00CC", textColor: "#FF00CC" },
  { value: "SAT", label: "Saturday July 18", date: "2026-07-18", nextDate: "2026-07-19", color: "#39FF14", textColor: "#39FF14" },
  { value: "SUN", label: "Sunday July 19", date: "2026-07-19", nextDate: "2026-07-20", color: "#FF6600", textColor: "#FF6600" },
];

export const PRIDE_WEEK_START_DATE = PRIDE_WEEK_DAY_OPTIONS[0].date;
export const PRIDE_WEEK_END_DATE = PRIDE_WEEK_DAY_OPTIONS[PRIDE_WEEK_DAY_OPTIONS.length - 1].date;

export const DAY_COLORS: Record<string, string> = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.color]),
);

export const DAY_TEXT_COLORS: Record<string, string> = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.textColor]),
);

/** Calendar order MON(13)→SUN(19) for filters, pie slices, and sorts. */
export const DAY_SORT_ORDER: Record<string, number> = Object.fromEntries(
  PRIDE_WEEK_DAYS.map((d, i) => [d, i]),
);

const DAY_DATE_MAP = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.date]),
) as Record<PrideWeekDay, string>;

const DAY_NEXT_MAP = Object.fromEntries(
  PRIDE_WEEK_DAY_OPTIONS.map((d) => [d.value, d.nextDate]),
) as Record<PrideWeekDay, string>;

export function prideWeekDate(day: string): string {
  return DAY_DATE_MAP[day as PrideWeekDay] || DAY_DATE_MAP.FRI;
}

export function prideWeekNextDate(day: string): string {
  return DAY_NEXT_MAP[day as PrideWeekDay] || DAY_NEXT_MAP.FRI;
}

export function defaultPrideDateTimes(day: string) {
  const d = prideWeekDate(day);
  const next = prideWeekNextDate(day);
  return {
    dateStart: `${d}T21:00`,
    dateEnd: `${next}T02:00`,
  };
}

/** Pacific weekday code ("MON"…"SUN") for a stored event dateStart; "" if unparseable. */
export function prideDayFromDate(dateStart?: string | null): string {
  const ms = parsePacificDateTime(dateStart);
  if (ms == null) return "";
  return pacificDayOfWeek(ms);
}

/* ---- Schedule page model (see client/src/pages/Schedule.tsx) ---- */

export type DayKey = PrideWeekDay;

export interface DayDef {
  key: DayKey;
  label: string;
  short: string;
  /** e.g. "JUL 13" */
  date: string;
  /** solid day color (rails, headers) */
  color: string;
  /** text-safe day color (times, counts) */
  text: string;
}

export type AdmKey = "FREE" | "TICKETED" | "SUGGESTED_DONATION";

export interface AdmDef {
  label: string;
  color: string;
}

export type EventType =
  | "drag"
  | "dance"
  | "music"
  | "comedy"
  | "sports"
  | "outdoor"
  | "march"
  | "community"
  | "wellness";

export interface PrideEvent {
  id: number;
  day: DayKey;
  /** start, minutes past midnight (events after midnight use s > 1440) */
  s: number;
  /** end, minutes past midnight */
  e: number;
  title: string;
  venue: string;
  hood: string;
  adm: AdmKey;
  types: EventType[];
  age: string;
  going: number;
  blurb: string;
  /** featured / headliner — surfaced in the Stories export */
  feat?: boolean;
}

/** Schedule grid day columns — derived from PRIDE_WEEK_DAY_OPTIONS. */
export const DAYS: DayDef[] = PRIDE_WEEK_DAY_OPTIONS.map((d) => ({
  key: d.value,
  label: d.label.split(" ")[0].toUpperCase(),
  short: d.value,
  date: `JUL ${Number(d.date.slice(-2))}`,
  color: d.color,
  text: d.textColor,
}));

export const ADM: Record<AdmKey, AdmDef> = {
  FREE: { label: "Free", color: "#CCFF00" },
  TICKETED: { label: "Ticketed", color: "#00FFFF" },
  SUGGESTED_DONATION: { label: "Donation", color: "#FFB23D" },
};

export const TYPE_LABEL: Record<EventType, string> = {
  drag: "Drag",
  dance: "Dance",
  music: "Music",
  comedy: "Comedy",
  sports: "Sports",
  outdoor: "Outdoor",
  march: "March",
  community: "Community",
  wellness: "Wellness",
};

export const EVENTS: PrideEvent[] = [
  { id: 101, day: "MON", s: 1080, e: 1260, title: "Pride Week Opening Mixer", venue: "Q Center", hood: "N Portland", adm: "FREE", types: ["community"], age: "all-ages", going: 24, blurb: "Kick off the week with the crews behind the guide. Grab your button, meet organizers, and map out your Pride Week." },
  { id: 102, day: "MON", s: 1200, e: 1380, title: "Dyke Night: Week One", venue: "Doug Fir Lounge", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 9, blurb: "The dyke-bar takeover that runs all week. Openers spinning disco and post-punk to warm the floor." },
  { id: 103, day: "TUE", s: 1140, e: 1260, title: "Trans Resource Night", venue: "Q Center", hood: "N Portland", adm: "FREE", types: ["community"], age: "all-ages", going: 15, blurb: "Name-change clinic, care resources, and community. Hosted by and for the trans community." },
  { id: 104, day: "TUE", s: 1200, e: 1440, title: "Karaoke From Hell: Pride", venue: "Dante's", hood: "Downtown", adm: "TICKETED", types: ["music"], age: "21+", going: 11, blurb: "A live band, 1,100 songs, and zero shame. The most unhinged karaoke in Portland goes full Pride." },
  { id: 105, day: "WED", s: 1050, e: 1200, title: "Queer Book Club: Pride Reads", venue: "Mother Foucault's", hood: "SE Portland", adm: "FREE", types: ["community"], age: "all-ages", going: 8, blurb: "This month: a stack of new queer fiction and a very opinionated group. Newcomers always welcome." },
  { id: 106, day: "WED", s: 1140, e: 1320, title: "Drag Bingo Benefit", venue: "CC Slaughters", hood: "Old Town", adm: "SUGGESTED_DONATION", types: ["drag"], age: "21+", going: 20, blurb: "Filthy calls, real prizes, every dollar to the community fund. Hosted by your favorite Old Town queens." },
  { id: 107, day: "WED", s: 1260, e: 1500, title: "Bridge Club: Midweek Warmup", venue: "Holocene", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 14, blurb: "House and breaks all night. A midweek reset before the weekend goes fully off." },
  { id: 108, day: "THU", s: 1080, e: 1200, title: "Kickoff Happy Hour", venue: "Camp Bar PDX", hood: "Downtown", adm: "FREE", types: ["community"], age: "21+", going: 31, blurb: "The Gayborhood's newest bar throws open the doors. Drink specials and a soft launch of Pride Week." },
  { id: 109, day: "THU", s: 1140, e: 1260, title: "Sad Girl Summer: Pride Edition", venue: "Black Water", hood: "NE Portland", adm: "TICKETED", types: ["drag"], age: "21+", going: 12, blurb: "Portland's biggest bummer of a drag show, back and sadder than ever. Bring tissues." },
  { id: 110, day: "THU", s: 1145, e: 1290, title: "Portland Pickles Pride Night", venue: "Walker Stadium", hood: "SE Portland", adm: "TICKETED", types: ["sports"], age: "all-ages", going: 60, blurb: "Pride baseball vs. the Gresham Greywolves. On-field activities, a drag first pitch, tickets from $12." },
  { id: 111, day: "THU", s: 1200, e: 1380, title: "Sasha Colby Pride Kick-Off", venue: "Star Theater", hood: "Old Town", adm: "TICKETED", feat: true, types: ["drag"], age: "21+", going: 42, blurb: "Headline performance by drag superstar Sasha Colby to officially open Portland Pride. This one sells out." },
  { id: 112, day: "THU", s: 1260, e: 1500, title: "BANG: Queer Techno Transmission", venue: "Holocene", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 18, blurb: "Kicking off Pride with a BANG. A new queer-helmed techno night. DJs Sappho, Bro Hoe, Kraftwitch." },
  { id: 113, day: "FRI", s: 720, e: 960, title: "Pride Art Market", venue: "Ankeny Alley", hood: "Old Town", adm: "FREE", types: ["outdoor"], age: "all-ages", going: 40, blurb: "Queer makers, zines, prints, and vintage in the alley. Cash and Venmo, all-day drop-in." },
  { id: 114, day: "FRI", s: 1020, e: 1200, title: "Midtown Beer Garden Pride", venue: "Midtown Beer Garden", hood: "Downtown", adm: "FREE", types: ["outdoor"], age: "all-ages", going: 55, blurb: "Official outdoor beer garden on Harvey Milk St, open all weekend. Rotating DJs and food carts." },
  { id: 115, day: "FRI", s: 1140, e: 1320, title: "Darcelle XV Friday Show", venue: "Darcelle XV Showplace", hood: "Old Town", adm: "TICKETED", feat: true, types: ["drag"], age: "21+", going: 18, blurb: "Portland's legendary drag cabaret, staging shows since 1967. Doors 7, show 8. A rite of passage." },
  { id: 116, day: "FRI", s: 1200, e: 1380, title: "Queer Comedy Night", venue: "Curious Comedy", hood: "NE Portland", adm: "TICKETED", types: ["comedy"], age: "18+", going: 16, blurb: "A stacked lineup of local queer comics plus a touring headliner. Two-drink minimum, one-laugh guarantee." },
  { id: 117, day: "FRI", s: 1260, e: 1560, title: "Horse Meat Disco: TUFF", venue: "Crystal Ballroom", hood: "Pearl District", adm: "TICKETED", types: ["dance"], age: "21+", going: 70, blurb: "The London institution celebrating underground dance floors and leather bars. DJ Nick Bertossi opens." },
  { id: 118, day: "FRI", s: 1260, e: 1590, title: "Bearracuda: Vaseline Alley", venue: "722 E Burnside", hood: "Inner East", adm: "TICKETED", types: ["dance"], age: "21+", going: 38, blurb: "Bearracuda Pride Friday. Theme: Vaseline Alley. Harnesses and fetish gear very much encouraged." },
  { id: 119, day: "FRI", s: 1320, e: 1560, title: "Blow Pony: Pride Edition", venue: "Bossanova Ballroom", hood: "Inner East", adm: "TICKETED", types: ["dance"], age: "21+", going: 44, blurb: "The queer dance party that refuses to behave. Three rooms, drag hosts, QTBIPOC DJs all night." },
  { id: 120, day: "SAT", s: 660, e: 750, title: "Pride Yoga in the Park", venue: "Laurelhurst Park", hood: "SE Portland", adm: "FREE", types: ["wellness"], age: "all-ages", going: 35, blurb: "All-levels flow on the grass, mats provided while they last. Donation supports trans health funds." },
  { id: 121, day: "SAT", s: 720, e: 1200, title: "Portland Pride Waterfront Festival", venue: "Tom McCall Waterfront Park", hood: "Downtown", adm: "SUGGESTED_DONATION", feat: true, types: ["outdoor"], age: "all-ages", going: 220, blurb: "The main event. 2026 theme: Made with Pride. Two stages, 150+ vendors, ASL interpreted. $10 suggested, no one turned away." },
  { id: 122, day: "SAT", s: 720, e: 900, title: "Roller Derby: Blood, Sweat & Queers", venue: "The Hangar at Oaks Park", hood: "SE Portland", adm: "TICKETED", types: ["sports"], age: "all-ages", going: 48, blurb: "Rose City home-team championship Pride night. Food carts plus the Plow Stop Bar." },
  { id: 123, day: "SAT", s: 780, e: 1020, title: "Old Town Block Party", venue: "Ankeny Alley", hood: "Old Town", adm: "FREE", types: ["outdoor"], age: "all-ages", going: 80, blurb: "Unstoppable joy and radical love in Ankeny Alley. DJs, drag, and the Gayborhood at full volume." },
  { id: 124, day: "SAT", s: 840, e: 1020, title: "Leather & Lace Social", venue: "The Eagle PDX", hood: "Inner East", adm: "TICKETED", types: ["community"], age: "21+", going: 22, blurb: "A daytime meet for the leather, kink, and fetish family. Gear optional, consent mandatory." },
  { id: 125, day: "SAT", s: 1020, e: 1140, title: "Dyke March Portland", venue: "South Park Blocks", hood: "Downtown", adm: "FREE", types: ["march"], age: "all-ages", going: 130, blurb: "Meet at the South Park Blocks and march. Check the route before you go. Loud, proud, and political." },
  { id: 126, day: "SAT", s: 1200, e: 1380, title: "BOYeurism: Pride Spectacular", venue: "Alberta Rose Theatre", hood: "NE Portland", adm: "TICKETED", types: ["drag"], age: "21+", going: 33, blurb: "Boylesque, drag, and aerial in a full theatrical revue. The filthiest classy show in town." },
  { id: 127, day: "SAT", s: 1260, e: 1560, title: "RADIANCE by Gaylabration", venue: "Crystal Ballroom", hood: "Pearl District", adm: "TICKETED", feat: true, types: ["dance"], age: "21+", going: 90, blurb: "The biggest queer dance night of the weekend. Headliner Matt Suave with Poundstar, Mircat, and Bro Hoe." },
  { id: 128, day: "SAT", s: 1260, e: 1590, title: "Stank: Yes Coach!", venue: "Sanctuary Club", hood: "Pearl District", adm: "TICKETED", types: ["dance"], age: "21+", going: 41, blurb: "Sports-day realness meets warehouse house. Jockstraps, whistles, and a very sweaty floor." },
  { id: 129, day: "SAT", s: 1320, e: 1590, title: "Honcho: Warehouse", venue: "REALM PDX", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 52, blurb: "The Pittsburgh cult party lands in Portland. Fast, hard, and sex-positive. Location to ticket holders." },
  { id: 130, day: "SUN", s: 660, e: 780, title: "Pride Interfaith Service", venue: "First Unitarian", hood: "Downtown", adm: "FREE", types: ["community"], age: "all-ages", going: 18, blurb: "A come-as-you-are gathering to honor those we've lost and lift those still fighting." },
  { id: 131, day: "SUN", s: 660, e: 840, title: "Portland Pride Parade", venue: "North Park Blocks → Naito", hood: "Downtown", adm: "FREE", feat: true, types: ["march"], age: "all-ages", going: 310, blurb: "Oregon's largest parade draws tens of thousands down to the waterfront. Get there early for a curb spot." },
  { id: 132, day: "SUN", s: 720, e: 1080, title: "Waterfront Festival: Day 2", venue: "Tom McCall Waterfront Park", hood: "Downtown", adm: "SUGGESTED_DONATION", types: ["outdoor"], age: "all-ages", going: 180, blurb: "The party continues. Main-stage headliners, the beer garden, and the vendor village all afternoon." },
  { id: 133, day: "SUN", s: 780, e: 1080, title: "The Sports Bra Pride Block Party", venue: "The Sports Bra", hood: "NE Portland", adm: "TICKETED", types: ["outdoor"], age: "all-ages", going: 64, blurb: "5th annual block party at the women's-sports bar: DJ sets, a lifting comp, food carts, kid-friendly." },
  { id: 134, day: "SUN", s: 840, e: 960, title: "Portland Trans Pride March", venue: "North Park Blocks", hood: "Downtown", adm: "FREE", types: ["march"], age: "all-ages", going: 120, blurb: "By and for the trans community. Masks encouraged. Free, all ages, and fiercely joyful." },
  { id: 135, day: "SUN", s: 900, e: 1140, title: "Lumbertwink: Plaid Patio Pride", venue: "Jackie's", hood: "SE Portland", adm: "FREE", types: ["community"], age: "21+", going: 26, blurb: "Flannel, cold beer, and a sunny patio. The coziest, gayest way to wind down the weekend." },
  { id: 136, day: "SUN", s: 1140, e: 1380, title: "Chai & Roses Pride Party", venue: "Holocene", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 37, blurb: "Sunday tea dance for QTBIPOC and allies. DJs Suavecito and Anjali, MC Armaan Singh." },
  { id: 137, day: "SUN", s: 1260, e: 1560, title: "Yes Sir: Gay Dance Party", venue: "REALM PDX", hood: "SE Portland", adm: "TICKETED", types: ["dance"], age: "21+", going: 29, blurb: "The last dance of Pride Week. Secret warehouse underwear night with DJ Ottogyro. Location on your ticket." },
];

/** hex + alpha → rgba() string */
export function hexA(hex: string, a: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** minutes-past-midnight → "7:30pm" / "8pm" (wraps past 24h) */
export function fmtClock(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "am" : "pm";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${ap}` : `${h12}${ap}`;
}

/** axis hour (may exceed 24) → "1 AM" */
export function fmtHour(h: number): string {
  const hh = h % 24;
  const ap = hh < 12 ? "AM" : "PM";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12} ${ap}`;
}

/** day-colored poster texture used for chips, peeks, and the popover header */
export function posterBg(dc: string): string {
  return (
    `radial-gradient(120% 90% at 78% 10%, ${hexA(dc, 0.55)} 0%, transparent 55%), ` +
    `radial-gradient(130% 130% at 8% 112%, ${hexA(dc, 0.34)} 0%, transparent 60%), ` +
    `repeating-linear-gradient(-52deg, rgba(255,255,255,.05) 0 2px, transparent 2px 9px), #0b0b0f`
  );
}

export interface LaneInfo {
  col: number;
  totalCols: number;
}

/**
 * Greedy interval-graph lane packing. Each event gets the leftmost free
 * lane; totalCols is the max concurrency it overlaps, so a block never
 * shrinks below its share of the widened column.
 */
export function layoutDay(list: PrideEvent[]): { res: Record<number, LaneInfo>; maxCols: number } {
  const sorted = [...list].sort((a, b) => a.s - b.s || a.e - b.e);
  const colEnds: number[] = [];
  const colOf: Record<number, number> = {};
  for (const ev of sorted) {
    let placed = false;
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] <= ev.s) {
        colEnds[c] = ev.e;
        colOf[ev.id] = c;
        placed = true;
        break;
      }
    }
    if (!placed) {
      colOf[ev.id] = colEnds.length;
      colEnds.push(ev.e);
    }
  }
  const res: Record<number, LaneInfo> = {};
  let maxCols = 1;
  for (const ev of sorted) {
    const concurrent = sorted.filter((o) => o.s < ev.e && o.e > ev.s);
    const tc = Math.max(...concurrent.map((o) => colOf[o.id])) + 1;
    res[ev.id] = { col: colOf[ev.id], totalCols: tc };
    if (tc > maxCols) maxCols = tc;
  }
  return { res, maxCols };
}
