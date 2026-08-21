/**
 * CC Slaughters - weekly night lineup on homepage HTML + WP ADVERTICAL posters.
 * No events feed URL ( /events/ 404s ). Parse Mon–Sun blurb blocks and expand
 * next N weeks.
 *
 * Flyer policy: the homepage WEEKLYS_*_ADVERTICAL is one shared composite for
 * the whole week — not per-night art. Product preference: honest null on
 * individual night cards beats stamping the same lineup poster on every
 * night. We still detect ADVERTICAL so warnings can say lineup art exists
 * on the source page, but we do not attach it to drafts.
 */
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { isPastEventListing, dayOfWeekFromStart } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";
import { getTrustedVenue } from "@shared/trustedVenues";
import { nextWeekdayDates } from "./campBar";

const VENUE = "CC Slaughters";
const ADDRESS = "219 NW Davis St, Portland, OR";
const NEIGHBORHOOD = "Old Town";
const AGE = "21_PLUS" as const;
const DEFAULT_FEED =
  getTrustedVenue("cc-slaughters")?.feedUrl || "https://www.ccslaughterspdx.com/";

const WEEKS_AHEAD = 6;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DOW: Record<(typeof DAYS)[number], number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

export type CcNight = {
  dayName: (typeof DAYS)[number];
  dow: number;
  /** 1–5 when the source says "Every 2nd Saturday"; null for weekly nights. */
  weekOfMonth: number | null;
  title: string;
  description: string;
  timeHhmm: string;
  coverNote: string | null;
};

function ordinalWeekOfMonth(text: string): number | null {
  const ordinal = String(text || "").match(
    /\bevery\s+(\d+)(?:st|nd|rd|th)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  )?.[1];
  if (!ordinal) return null;
  const value = Number(ordinal);
  return value >= 1 && value <= 5 ? value : null;
}

function weekOfMonth(date: string): number {
  return Math.floor((Number(date.slice(8, 10)) - 1) / 7) + 1;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;|&#39;|&rsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseTime(text: string): string {
  const raw = String(text || "");
  // The source's descriptive copy can mention ordinal dates (for example,
  // “Every 2nd Saturday”) before its actual start time. Prefer the explicit
  // weekly schedule line so Black Magic is 9pm, not 2pm.
  const directScheduled = raw.match(
    /\bevery\s+(?:(?:\d+(?:st|nd|rd|th)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)/i,
  );
  const ordinalScheduled = raw.match(
    /\bevery\s+\d+(?:st|nd|rd|th)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b[\s\S]{0,220}?(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)/i,
  );
  const scheduled = directScheduled || ordinalScheduled;
  const m = scheduled || raw.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  if (!m) return "21:00";
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = (m[3] || "").toLowerCase().replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h <= 6) h += 12;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Prefer full-size ADVERTICAL (no -WxH- resize suffix). */
export function extractCcVerticalPosters(html: string): string[] {
  const re =
    /https:\/\/(?:www\.)?ccslaughterspdx\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\\\s>]*ADVERTICAL[^"'\\\s>]+\.(?:png|jpe?g|webp)/gi;
  const all = [...String(html || "").matchAll(re)].map(m => m[0]);
  const full = all.filter(u => !/-\d{2,4}x\d{2,4}/.test(u));
  const ranked = (full.length ? full : all).map(u => u.replace(/&amp;/g, "&"));
  return Array.from(new Set(ranked));
}

/**
 * Split homepage into day sections. CC uses "Monday … Tuesday …" free text
 * with panel markup; we cut on day headers.
 */
export function parseCcSlaughtersNights(html: string): CcNight[] {
  // The live WordPress page has one explicit widget per night. Parse those
  // structural headings before falling back to prose, because body copy can
  // mention other weekdays and a shared slider can otherwise shift every
  // heading by one card.
  const widgetNights: CcNight[] = [];
  const widgetRe =
    /<h3\b[^>]*\bclass=["'][^"']*\bwidget-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b[^>]*\bclass=["'][^"']*\bwidget-title\b[^"']*["'][^>]*>|$)/gi;
  for (const match of String(html || "").matchAll(widgetRe)) {
    const title = decodeEntities(match[1].replace(/<[^>]+>/g, " ")).slice(0, 100);
    const blob = decodeEntities(
      match[2]
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    );
    const day = blob.match(
      /\bevery\s+(?:(?:\d+(?:st|nd|rd|th)\s+)?)(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    )?.[1];
    if (!title || !day) continue;
    const dayName = `${day[0].toUpperCase()}${day.slice(1).toLowerCase()}` as CcNight["dayName"];
    widgetNights.push({
      dayName,
      dow: DOW[dayName],
      weekOfMonth: ordinalWeekOfMonth(blob),
      title,
      description: blob.slice(0, 800),
      timeHhmm: parseTime(blob),
      coverNote: /\bno\s*cover\b/i.test(blob)
        ? "No cover"
        : blob.match(/\$\d+\s*cover/i)?.[0] || null,
    });
  }
  if (widgetNights.length >= 5) return widgetNights;

  const text = decodeEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " "),
  );

  const nights: CcNight[] = [];
  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const next = DAYS[(i + 1) % DAYS.length];
    // Match "Monday" … until next weekday header (or end)
    const re = new RegExp(
      `${day}\\b([\\s\\S]{20,1200}?)(?=${next}\\b|Follow us|Instagram|©|$)`,
      "i",
    );
    const m = text.match(re);
    if (!m) continue;
    const blob = m[1].replace(/\s+/g, " ").trim();
    if (blob.length < 15) continue;

    // Prefer explicit named nights (order = specificity; Bingo before Game-Day)
    let title = "";
    const namedPatterns = [
      /\bRager\b/i,
      /\bHump Wednesday\b/i,
      /\bTrans-Uhh-Licious\b/i,
      /\bThe Queens Keys\b/i,
      /\bKeyed Up Karaoke\b/i,
      /\bBlack Magic\b/i,
      /\bGear\b/i,
      /Drag Queen Bingo[^.|]{0,50}/i,
      /Amateur Night[^.|]{0,40}/i,
      /Hump [Nn]ight[^.|]{0,40}/i,
      /live piano[^.|]{0,40}/i,
      /Industry\s*Night[^.|]{0,40}/i,
      /Karaoke[^.|]{0,40}/i,
      /Game-?Day[^.|]{0,50}/i,
    ];
    for (const re of namedPatterns) {
      const hit = blob.match(re);
      if (hit) {
        title = hit[0].replace(/\s+/g, " ").trim().slice(0, 100);
        break;
      }
    }
    if (!title) {
      title = blob.split(/[.|]/)[0]?.trim() || `${day} at CC Slaughters`;
      title = title
        .replace(/^(It's|Its)\s+/i, "")
        .replace(/\s+/g, " ")
        .slice(0, 100);
    }
    if (/^at CC/i.test(title) || title.length < 4) {
      title = `${day} Night at CC Slaughters`;
    }

    const timeHhmm = parseTime(blob);
    const coverNote = /\bno\s*cover\b/i.test(blob)
      ? "No cover"
      : blob.match(/\$\d+\s*cover/i)?.[0] || null;

    nights.push({
      dayName: day,
      dow: DOW[day],
      weekOfMonth: ordinalWeekOfMonth(blob),
      title,
      description: blob.slice(0, 800),
      timeHhmm,
      coverNote,
    });
  }
  return nights;
}

/**
 * Expand weeklies into dated drafts.
 * @param lineupPosterUrl - homepage ADVERTICAL if present (lineup composite only).
 *   Never attached to per-night drafts; used only to shape warnings.
 */
export function nightsToDrafts(
  nights: CcNight[],
  lineupPosterUrl: string | null,
  opts?: { weeks?: number; now?: Date },
): IngestEventDraft[] {
  const weeks = opts?.weeks ?? WEEKS_AHEAD;
  const now = opts?.now ?? new Date();
  const drafts: IngestEventDraft[] = [];

  for (const n of nights) {
    const dates = nextWeekdayDates(n.dow, weeks, now).filter(
      day => n.weekOfMonth == null || weekOfMonth(day) === n.weekOfMonth,
    );
    for (const day of dates) {
      const dateStart = `${day}T${n.timeHhmm}`;
      const adm = inferAdmissionFromText(
        n.title,
        `${n.description} ${n.coverNote || ""}`,
      );
      drafts.push({
        title: n.title,
        description: n.description,
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
        eventPageUrl: "https://www.ccslaughterspdx.com/",
        isPublic: true,
        isPrivate: false,
        isHouseParty: false,
        isSexPositive: false,
        nudityOk: false,
        // Honest null — do not stamp shared lineup composite on every night
        posterImageUrl: null,
        sourceUrl: "https://www.ccslaughterspdx.com/",
        parseSource: "html",
        warnings: [
          "CC Slaughters weekly lineup expanded from homepage",
          "Age set to 21_PLUS (CC Slaughters is a 21+ bar)",
          ...(n.coverNote ? [`Cover note: ${n.coverNote}`] : []),
          ...(adm.reason ? [adm.reason] : []),
          ...(lineupPosterUrl
            ? [
                "Shared weekly lineup poster (not per-night art)",
                "Homepage lineup flyer left null on per-night cards — do not reuse other night/venue flyers",
              ]
            : [
                "No per-night flyer on CC homepage — do not invent or reuse other venue flyers",
              ]),
        ],
      });
    }
  }
  return drafts;
}

export async function fetchCcSlaughtersDrafts(opts?: {
  feedUrl?: string;
  includePast?: boolean;
}): Promise<IngestEventDraft[]> {
  const feedUrl = (opts?.feedUrl || DEFAULT_FEED).trim();
  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body) return [];
  const nights = parseCcSlaughtersNights(fetched.body);
  const posters = extractCcVerticalPosters(fetched.body);
  // Prefer newest path (later year/month in URL sorts last) — for warning only
  const lineupPoster = posters.sort().reverse()[0] || null;
  let drafts = nightsToDrafts(nights, lineupPoster);
  if (!opts?.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }
  return drafts;
}
