/**
 * Camp Bar PDX - static weekly schedule on campbarpdx.com (#weeklyevents).
 * No ICS/JSON feed. Parse day columns → expand next N weeks of instances.
 */
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { isPastEventListing, dayOfWeekFromStart } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";
import { getTrustedVenue } from "@shared/trustedVenues";

const VENUE = "Camp Bar PDX";
const ADDRESS = "1125 SW Harvey Milk St, Portland, OR";
const NEIGHBORHOOD = "Downtown";
const AGE = "21_PLUS" as const;
const DEFAULT_FEED =
  getTrustedVenue("camp-bar")?.feedUrl || "https://campbarpdx.com";

/** How many weeks of each weekly night to materialize. */
const WEEKS_AHEAD = 6;

const DOW_MAP: Record<string, number> = {
  sunday: 0,
  sundays: 0,
  monday: 1,
  mondays: 1,
  tuesday: 2,
  tuesdays: 2,
  wednesday: 3,
  wednesdays: 3,
  thursday: 4,
  thursdays: 4,
  friday: 5,
  fridays: 5,
  saturday: 6,
  saturdays: 6,
};

export type CampWeekly = {
  dayName: string;
  /** 0=Sun … 6=Sat */
  dow: number;
  title: string;
  description: string;
  /** "HH:MM" 24h local, best-effort from "7 PM" / "8 PM to Midnight" */
  timeHhmm: string;
};

/** Parse "7 PM" / "8pm" / "6 PM to Midnight" → 24h HH:MM (start). */
export function parseCampTime(text: string): string {
  const m = String(text || "").match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  if (!m) return "19:00";
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = (m[3] || "").toLowerCase().replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h < 7) h += 12; // bare "6" in evening context
  if (h > 23) h = 19;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Extract weekly schedule from Camp homepage HTML. */
export function parseCampBarWeeklies(html: string): CampWeekly[] {
  const out: CampWeekly[] = [];
  const parts = String(html || "").split(/<div class="dow">/i);
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];
    const dayRaw = block.match(/<h4[^>]*>\s*([^<]+)/i)?.[1]?.trim() || "";
    const dayKey = dayRaw.toLowerCase().replace(/[^a-z]/g, "");
    const dow = DOW_MAP[dayKey];
    if (dow == null) continue;

    const events = [
      ...block.matchAll(/class=['"]weeklyevent[^'"]*['"][^>]*>([\s\S]*?)(?:<\/div>)/gi),
    ];
    for (const em of events) {
      const raw = em[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!raw || raw.length < 4) continue;
      // "Happy Hour 4 PM to 7 PM Happy Hour $1 off…"
      // "Drag Bingo with Peachy Springs 7 PM to 9 PM"
      // "Game On 6 PM to Midnight"
      // "Karaoke 8 PM to Midnight"
      let title = raw;
      const timeHit = raw.match(
        /^(.+?)\s+(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?(?:\s+to\s+.+)?)$/i,
      );
      if (timeHit) title = timeHit[1].trim();
      // Drop duplicated "Happy Hour" label noise
      title = title.replace(/\bHappy Hour\b/gi, "Happy Hour").replace(/\s+/g, " ").trim();
      if (/^Happy Hour$/i.test(title)) {
        // Keep one clean happy-hour listing per day
        title = "Happy Hour";
      }
      const timeHhmm = parseCampTime(raw);
      out.push({
        dayName: dayRaw,
        dow,
        title: title.slice(0, 120),
        description: raw.slice(0, 500),
        timeHhmm,
      });
    }
  }
  return out;
}

/** Next `count` calendar dates (YYYY-MM-DD) for weekday dow (0=Sun), from `from`. */
export function nextWeekdayDates(dow: number, count: number, from = new Date()): string[] {
  const out: string[] = [];
  // Use Pacific-ish local by using UTC date parts from a shifted clock
  const start = new Date(from);
  // Walk up to 8 days to hit first matching weekday, then +7
  for (let i = 0; i < 8 && out.length === 0; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === dow) {
      out.push(isoDateLocal(d));
    }
  }
  while (out.length < count) {
    const prev = out[out.length - 1];
    const [y, m, day] = prev.split("-").map(Number);
    const d = new Date(y, m - 1, day + 7);
    out.push(isoDateLocal(d));
  }
  return out.slice(0, count);
}

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekliesToDrafts(
  weeklies: CampWeekly[],
  opts?: { weeks?: number; includeHappyHour?: boolean; now?: Date },
): IngestEventDraft[] {
  const weeks = opts?.weeks ?? WEEKS_AHEAD;
  const includeHH = opts?.includeHappyHour ?? false;
  const now = opts?.now ?? new Date();
  const drafts: IngestEventDraft[] = [];

  for (const w of weeklies) {
    if (!includeHH && /^happy hour$/i.test(w.title)) continue;
    const dates = nextWeekdayDates(w.dow, weeks, now);
    for (const day of dates) {
      const dateStart = `${day}T${w.timeHhmm}`;
      const adm = inferAdmissionFromText(w.title, w.description);
      drafts.push({
        title: w.title,
        description: `${w.description} (weekly ${w.dayName} at Camp Bar PDX).`,
        venueName: VENUE,
        address: ADDRESS,
        neighborhood: NEIGHBORHOOD,
        lat: null,
        lng: null,
        dateStart,
        dateEnd: "",
        dayOfWeek: dayOfWeekFromStart(dateStart),
        ageRequirement: AGE,
        eventTypes: "[]",
        admission: adm.admission,
        ticketUrl: null,
        eventPageUrl: "https://campbarpdx.com",
        isPublic: true,
        isPrivate: false,
        isHouseParty: false,
        isSexPositive: false,
        nudityOk: false,
        posterImageUrl: null,
        sourceUrl: "https://campbarpdx.com",
        parseSource: "html",
        warnings: [
          "Camp Bar weekly schedule expanded from homepage",
          "Age set to 21_PLUS (Camp Bar is a 21+ bar)",
          ...(adm.reason ? [adm.reason] : []),
        ],
      });
    }
  }
  return drafts;
}

export async function fetchCampBarDrafts(opts?: {
  feedUrl?: string;
  includePast?: boolean;
  includeHappyHour?: boolean;
}): Promise<IngestEventDraft[]> {
  const feedUrl = (opts?.feedUrl || DEFAULT_FEED).trim();
  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body) return [];
  const weeklies = parseCampBarWeeklies(fetched.body);
  let drafts = weekliesToDrafts(weeklies, {
    includeHappyHour: opts?.includeHappyHour ?? false,
  });
  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }
  return drafts;
}
