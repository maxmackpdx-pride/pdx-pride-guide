/**
 * Triangle Recreation Camp (Camp TRC) — camptrc.org homepage calendar.
 *
 * Wild Apricot site: per-event pages and Events RSS are login-gated.
 * Public 2026 Event Calendar lives on the homepage with theme weekends
 * (some self-operated, some partner weekends with external URLs).
 */
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { isPastEventListing, dayOfWeekFromStart } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";
import { getTrustedVenue } from "@shared/trustedVenues";

const VENUE = "Triangle Recreation Camp";
const ADDRESS = "47715 Mountain Loop Highway, Granite Falls, WA 98252";
const NEIGHBORHOOD = "Granite Falls, WA";
const AGE = "21_PLUS" as const;
const LAT = 48.0745268;
const LNG = -121.5901687;
const DEFAULT_FEED = getTrustedVenue("camp-trc")?.feedUrl || "https://camptrc.org/";

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export type CampTrcCalendarEvent = {
  title: string;
  description: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD (inclusive end of multi-day weekend) */
  endDate: string;
  eventPageUrl: string | null;
  year: number;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;|&#39;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Parse "May 22 - 25", "June 5 - 7", "June 13", "Sept 4 - 7".
 * End month defaults to start month when omitted.
 */
export function parseCampTrcDateRange(
  text: string,
  year: number,
): { startDate: string; endDate: string } | null {
  const raw = decodeEntities(text);
  // Multi-day: May 22 - 25 | Aug 7 - 9 | Sept 4 - 7
  const multi = raw.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})\s*[-–—]\s*(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(\d{1,2})\b/i,
  );
  if (multi) {
    const m1 = MONTHS[multi[1].toLowerCase().replace(/\./g, "")];
    const d1 = Number(multi[2]);
    const m2 = multi[3]
      ? MONTHS[multi[3].toLowerCase().replace(/\./g, "")]
      : m1;
    const d2 = Number(multi[4]);
    if (!m1 || !m2 || !d1 || !d2) return null;
    return {
      startDate: isoDate(year, m1, d1),
      endDate: isoDate(year, m2, d2),
    };
  }
  // Single day: June 13
  const single = raw.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})\b/i,
  );
  if (single) {
    const m = MONTHS[single[1].toLowerCase().replace(/\./g, "")];
    const d = Number(single[2]);
    if (!m || !d) return null;
    const day = isoDate(year, m, d);
    return { startDate: day, endDate: day };
  }
  return null;
}

function absUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/** Prefer multi-day ranges ("May 22 - 25") over bare single days when both could match. */
const DATE_TOKEN_RE =
  /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?\d{1,2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2})\b/gi;

/**
 * Extract public theme-weekend rows from camptrc.org homepage HTML.
 * Looks for the "Event Calendar" section; ignores product bookings
 * (overnight camping / day use) outside that block.
 *
 * Strategy: flatten markup to text (preserving link markers), then split
 * on each month/day date token so multi-event blobs become one row each.
 */
export function parseCampTrcCalendar(html: string, baseUrl = DEFAULT_FEED): CampTrcCalendarEvent[] {
  const body = String(html || "");
  const lower = body.toLowerCase();
  const calIdx = lower.indexOf("event calendar");
  // End calendar before tent/RV marketing sections when present
  let endIdx = body.length;
  for (const stop of ["tent camping", "rv camping", "trees. trails", "volunteer"]) {
    const i = lower.indexOf(stop, calIdx > 0 ? calIdx : 0);
    if (i > (calIdx > 0 ? calIdx + 80 : 0) && i < endIdx) endIdx = i;
  }
  const slice =
    calIdx >= 0
      ? body.slice(calIdx, Math.min(endIdx, calIdx + 14_000))
      : body.slice(0, 14_000);

  const yearHit =
    slice.match(/\b(20\d{2})\s+Event\s+Calendar\b/i) ||
    body.match(/\b(20\d{2})\s+Season\b/i) ||
    body.match(/\bWelcome to the\s+(20\d{2})\b/i);
  const year = yearHit ? Number(yearHit[1]) : new Date().getFullYear();

  let text = slice
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr|td|section|a)>/gi, "\n")
    .replace(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi,
      (_m, href) => ` [[${absUrl(String(href).replace(/&amp;/g, "&"), baseUrl)}]] `,
    )
    .replace(/<[^>]+>/g, " ");
  text = decodeEntities(text).replace(/[ \t]+/g, " ").replace(/\n+/g, "\n");

  // Collect date anchors across flattened text
  const anchors: Array<{ index: number; dateText: string }> = [];
  DATE_TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DATE_TOKEN_RE.exec(text)) != null) {
    anchors.push({ index: m.index, dateText: m[1] });
  }

  const out: CampTrcCalendarEvent[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < anchors.length; i++) {
    const { index, dateText } = anchors[i];
    const dates = parseCampTrcDateRange(dateText, year);
    if (!dates) continue;

    // Block owns: trailing text after previous date → this date → text until next date.
    // Structure on camptrc.org: [[url]] Date Title blurb [[nextUrl]] NextDate …
    const blockStart =
      i === 0 ? 0 : anchors[i - 1].index + anchors[i - 1].dateText.length;
    const blockEnd = i + 1 < anchors.length ? anchors[i + 1].index : text.length;
    const block = text.slice(blockStart, blockEnd);
    const dateAt = block.indexOf(dateText);
    // URLs only from BEFORE this date (camptrc wraps link around [[url]] + date + title).
    // URLs after the date belong to the *next* event's leading link.
    const leading = dateAt >= 0 ? block.slice(0, dateAt) : block;

    let eventPageUrl: string | null = null;
    const urls = [...leading.matchAll(/\[\[(https?:\/\/[^\]\s]+)\]\]/gi)].map(x => x[1]);
    for (const u of urls) {
      if (/camptrc\.org\/?$/i.test(u)) continue;
      if (/\/Events\/?$/i.test(u)) continue;
      if (/\/(Login|Join|Donate|Parking|FAQ|internet)\b/i.test(u)) continue;
      if (/event-\d+|furwood|k9campout|camptrc\.org\/event/i.test(u) || !/camptrc\.org/i.test(u)) {
        eventPageUrl = u;
        break;
      }
      if (!eventPageUrl) eventPageUrl = u;
    }

    // Title/description live after this date token inside the block
    const afterDate = dateAt >= 0 ? block.slice(dateAt + dateText.length) : block;
    let rest = afterDate
      .replace(/\[\[https?:\/\/[^\]\s]+\]\]/gi, " ")
      .replace(/\[\[|\]\]/g, " ")
      .replace(/<[^>]*>?/g, " ")
      .replace(/&lt;[^&]*&gt;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!rest || /^(switch to|log in|book overnight|purchase day)/i.test(rest)) continue;

    let title = rest;
    let description = "";

    // Prefer explicit blurb starters; else split on colon-subtitle or paren close
    const titleDesc = rest.match(
      /^(.{3,110}?)(?:\s+)((?:Kick|Explore|Peak|A |Hosted|Wear|proudly|A weekend|A special|A prehistoric).+)$/i,
    );
    if (titleDesc) {
      title = titleDesc[1].trim();
      description = titleDesc[2].trim();
    } else {
      // "White Sands/Dark Desires: A White Towel Affair Peak summer…"
      const colon = rest.match(/^(.{3,90}?:[^.]{0,60}?)\s+([A-Z].{10,})$/);
      if (colon) {
        title = colon[1].trim();
        description = colon[2].trim();
      } else if (rest.length > 90) {
        // Avoid cutting mid multi-word title: prefer end of paren group
        const paren = rest.match(/^(.{3,90}?\))\s+(.+)$/);
        if (paren) {
          title = paren[1].trim();
          description = paren[2].trim();
        } else {
          const cut = rest.slice(0, 90);
          const sp = cut.lastIndexOf(" ");
          title = (sp > 20 ? cut.slice(0, sp) : cut).trim();
          description = rest.slice(title.length).trim();
        }
      }
    }

    // Deduplicate repeated phrases ("K9 Campout K9 Campout is…")
    title = title.replace(/\b([\w&/''-]{2,}(?:\s+[\w&/''-]{2,}){0,3})\s+\1\b/gi, "$1");
    // Drop trailing "is" / "a" fragments from bad splits
    title = title.replace(/\s+(is|a|the|an)$/i, "").trim();
    description = description
      .replace(/<[^>]*>?/g, " ")
      .replace(/&lt;[^&]*&gt;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);
    title = title.replace(/\s+/g, " ").replace(/[·•:]+$/g, "").trim();

    // "White Sands/Dark Desires: A White Towel Affair" — fold subtitle into title when short
    if (
      description &&
      /^A\s+White\s+Towel\s+Affair\b/i.test(description) &&
      /dark desires/i.test(title)
    ) {
      const mDesc = description.match(/^(A\s+White\s+Towel\s+Affair)\s*(.*)$/i);
      if (mDesc) {
        title = `${title}: ${mDesc[1]}`.replace(/::+/g, ":");
        description = (mDesc[2] || "").trim();
      }
    }

    if (title.length < 3 || title.length > 140) continue;
    if (/^(book overnight|purchase day|tent camping|rv camping|day use|navigation)/i.test(title)) {
      continue;
    }
    if (/^event calendar$/i.test(title)) continue;

    const key = `${dates.startDate}|${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      title,
      description: description || `${title} at Triangle Recreation Camp (Camp TRC).`,
      startDate: dates.startDate,
      endDate: dates.endDate,
      eventPageUrl,
      year,
    });
  }

  return out;
}

export function campTrcEventsToDrafts(
  events: CampTrcCalendarEvent[],
  opts?: { includePast?: boolean; sourceUrl?: string },
): IngestEventDraft[] {
  const sourceUrl = opts?.sourceUrl || DEFAULT_FEED;
  const drafts: IngestEventDraft[] = [];

  for (const ev of events) {
    // Check-in style default: noon local start; end noon on last day (or +4h same day)
    const dateStart = `${ev.startDate}T12:00`;
    const dateEnd =
      ev.endDate && ev.endDate !== ev.startDate
        ? `${ev.endDate}T12:00`
        : `${ev.startDate}T18:00`;

    const adm = inferAdmissionFromText(ev.title, ev.description);
    const blob = `${ev.title} ${ev.description}`;
    const kinkish = /\b(dark alley|dark desires|towel|k9|pup|handler|leather|kink)\b/i.test(blob);

    drafts.push({
      title: ev.title,
      description: [
        ev.description,
        "LGBTQ+ owned campground · 21+ · Granite Falls, WA (Cascade foothills).",
        "Details and registration: camptrc.org (member login may be required for some events).",
      ]
        .filter(Boolean)
        .join(" "),
      venueName: VENUE,
      address: ADDRESS,
      neighborhood: NEIGHBORHOOD,
      // Store real coords; ingest metro filter may strip for PDX map pins.
      lat: LAT,
      lng: LNG,
      dateStart,
      dateEnd,
      dayOfWeek: dayOfWeekFromStart(dateStart),
      ageRequirement: AGE,
      eventTypes: kinkish
        ? JSON.stringify(["KINK", "OUTDOORS", "CAMPING"])
        : JSON.stringify(["OUTDOORS", "CAMPING"]),
      admission: adm.admission === "UNKNOWN" ? "TICKETED" : adm.admission,
      ticketUrl: ev.eventPageUrl,
      eventPageUrl: ev.eventPageUrl || "https://camptrc.org/",
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: kinkish,
      nudityOk: /\b(towel|dark desires|dark alley|nude)\b/i.test(blob),
      posterImageUrl: null,
      sourceUrl,
      parseSource: "mixed",
      warnings: [
        "Camp TRC public homepage calendar (Wild Apricot event pages are login-gated)",
        "Age set to 21_PLUS (TRC is 21+ LGBTQ+ campground)",
        "Out of Portland metro — Granite Falls, WA (important regional destination for PDX locals)",
        ...(adm.reason ? [adm.reason] : []),
        adm.admission === "UNKNOWN"
          ? "Admission defaulted to TICKETED (theme weekends typically require registration/payment)"
          : "",
      ].filter(Boolean),
    });
  }

  let out = drafts;
  if (!opts?.includePast) {
    out = out.filter(d => !isPastEventListing(d));
  }
  return out;
}

export async function fetchCampTrcDrafts(opts?: {
  feedUrl?: string;
  includePast?: boolean;
}): Promise<IngestEventDraft[]> {
  const feedUrl = (opts?.feedUrl || DEFAULT_FEED).trim();
  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body) return [];
  const events = parseCampTrcCalendar(fetched.body, feedUrl);
  return campTrcEventsToDrafts(events, {
    includePast: opts?.includePast ?? false,
    sourceUrl: feedUrl,
  });
}
