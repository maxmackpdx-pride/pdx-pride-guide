/**
 * Eventbrite organizer page parser (Stag, Living Room Wines, …).
 *
 * Public /o/{slug}-{id} pages embed upcomingEvents JSON (and often __NEXT_DATA__).
 * Structured LD-JSON / classic SSR is gone - discoverAndParse returns zero without this.
 */
import type { IngestEventDraft } from "../types";
import { fetchIngestSource } from "../fetchSource";
import { isPastEventListing, dayOfWeekFromStart } from "../dates";
import { inferAdmissionFromText } from "../admissionInfer";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#39;|&rsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Pull upcomingEvents array from organizer HTML (several embed shapes). */
export function extractEventbriteUpcomingEvents(html: string): any[] {
  const body = String(html || "");
  // 1) "upcomingEvents":[{...}]
  const m = body.match(/"upcomingEvents"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
  if (m) {
    try {
      const arr = JSON.parse(m[1]);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      /* try balanced parse below */
    }
    const balanced = extractJsonArrayAfter(body, body.indexOf('"upcomingEvents"'));
    if (balanced?.length) return balanced;
  }
  // 2) __NEXT_DATA__
  const nd = body.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nd) {
    try {
      const data = JSON.parse(nd[1]);
      const found = findUpcomingEventsDeep(data);
      if (found.length) return found;
    } catch {
      /* ignore */
    }
  }
  return [];
}

function extractJsonArrayAfter(html: string, from: number): any[] | null {
  const slice = html.slice(from, from + 500_000);
  const start = slice.indexOf("[");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < slice.length; i++) {
    const c = slice[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        try {
          const arr = JSON.parse(slice.slice(start, i + 1));
          return Array.isArray(arr) ? arr : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function findUpcomingEventsDeep(node: unknown, depth = 0): any[] {
  if (depth > 12 || node == null) return [];
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findUpcomingEventsDeep(item, depth + 1);
      if (hit.length) return hit;
    }
    return [];
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (Array.isArray(o.upcomingEvents) && o.upcomingEvents.length) {
      return o.upcomingEvents as any[];
    }
    for (const v of Object.values(o)) {
      const hit = findUpcomingEventsDeep(v, depth + 1);
      if (hit.length) return hit;
    }
  }
  return [];
}

function eventToDraft(
  ev: any,
  venue: { name: string; address: string; neighborhood: string },
  sourceUrl: string,
): IngestEventDraft | null {
  const title = decodeEntities(String(ev?.name || ev?.title || "").trim());
  if (!title) return null;
  const day = String(ev?.start_date || ev?.startDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = String(ev?.start_time || ev?.startTime || "20:00:00").slice(0, 8);
  const hhmm = time.length >= 5 ? time.slice(0, 5) : "20:00";
  const dateStart = `${day}T${hhmm}`;
  const endDay = String(ev?.end_date || ev?.endDate || day).slice(0, 10);
  const endTime = String(ev?.end_time || ev?.endTime || "").slice(0, 8);
  const dateEnd =
    endDay && endTime.length >= 5 ? `${endDay}T${endTime.slice(0, 5)}` : "";

  const url = String(ev?.url || ev?.vanity_url || "").trim() || null;
  const poster =
    ev?.image?.url ||
    ev?.logo?.url ||
    ev?.image_url ||
    ev?.logo_url ||
    null;

  const desc = decodeEntities(
    String(ev?.summary || ev?.description || ev?.text || "").slice(0, 4000),
  );
  const adm = inferAdmissionFromText(title, desc);

  const venueName =
    ev?.venue?.name ||
    ev?.primary_venue?.name ||
    venue.name;

  return {
    title,
    description: desc || `${title} at ${venue.name}.`,
    venueName: String(venueName || venue.name),
    address: String(ev?.venue?.address?.localized_address_display || venue.address),
    neighborhood: venue.neighborhood,
    lat: null,
    lng: null,
    dateStart,
    dateEnd,
    dayOfWeek: dayOfWeekFromStart(dateStart),
    ageRequirement: "21_PLUS",
    eventTypes: "[]",
    admission: adm.admission,
    ticketUrl: url,
    eventPageUrl: url,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: poster ? String(poster) : null,
    sourceUrl,
    parseSource: "eventbrite",
    warnings: [
      "Parsed from Eventbrite organizer page embed",
      ...(adm.reason ? [adm.reason] : []),
    ],
  };
}

export type FetchEventbriteOrgOpts = {
  feedUrl: string;
  venueName: string;
  address: string;
  neighborhood?: string;
  includePast?: boolean;
};

export async function fetchEventbriteOrgDrafts(
  opts: FetchEventbriteOrgOpts,
): Promise<IngestEventDraft[]> {
  const feedUrl = opts.feedUrl.trim();
  const fetched = await fetchIngestSource(feedUrl);
  if (!fetched.body || fetched.body.length < 500) return [];

  const raw = extractEventbriteUpcomingEvents(fetched.body);
  const venue = {
    name: opts.venueName,
    address: opts.address,
    neighborhood: opts.neighborhood || "",
  };
  let drafts = raw
    .map(ev => eventToDraft(ev, venue, fetched.url || feedUrl))
    .filter((d): d is IngestEventDraft => Boolean(d));

  if (!opts.includePast) {
    drafts = drafts.filter(d => !isPastEventListing(d));
  }

  // de-dupe by title|day
  const seen = new Set<string>();
  return drafts.filter(d => {
    const key = `${d.title}|${(d.dateStart || "").slice(0, 10)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
