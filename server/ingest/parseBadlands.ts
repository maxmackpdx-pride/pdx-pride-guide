import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";
import { inferAdmissionFromText } from "./admissionInfer";

const PACIFIC_TZ = "America/Los_Angeles";
const DEFAULT_VENUE = "Badlands";
const DEFAULT_ADDRESS = "110 NW Broadway, Portland, OR";
const DEFAULT_NEIGHBORHOOD = "Old Town";
/** Badlands is a 21+ bar — never all-ages. */
const BADLANDS_AGE = "21_PLUS" as const;

/**
 * Badlands calendar worker:
 * `GET …/api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`
 * Body: `{ events: [{ id, title, start, end, description, blurb, photoUrl, location, link }] }`
 */

function pacificYmd(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addPacificDays(ymd: string, days: number): string {
  // Noon UTC avoids DST edge when stepping calendar days from a Pacific YMD.
  const base = new Date(`${ymd}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return pacificYmd(base);
}

/**
 * If URL is the Badlands calendar API without `from`/`to`, append a Pacific
 * window of today → today+daysAhead (default 60).
 */
export function expandBadlandsCalendarUrl(url: string, daysAhead = 60): string {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }

  // Only rewrite the Badlands Cloudflare worker calendar (not the marketing site).
  if (!/badlandsportland\.workers\.dev/i.test(parsed.hostname)) {
    return raw;
  }

  const hasFrom = parsed.searchParams.has("from");
  const hasTo = parsed.searchParams.has("to");
  if (hasFrom && hasTo) return parsed.toString();

  const today = pacificYmd(new Date());
  const to = addPacificDays(today, Math.max(1, daysAhead));
  if (!hasFrom) parsed.searchParams.set("from", today);
  if (!hasTo) parsed.searchParams.set("to", to);
  return parsed.toString();
}

export function looksLikeBadlandsJson(raw: string): boolean {
  const trimmed = String(raw || "").trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    const data = JSON.parse(trimmed);
    const events: unknown[] = Array.isArray(data?.events) ? data.events : [];
    if (!events.length) return false;
    // Badlands items use `start` + `title` (Tribe uses start_date; SQ uses startDate).
    return events.some(e => {
      if (!e || typeof e !== "object") return false;
      const row = e as Record<string, unknown>;
      const title = row.title != null ? String(row.title).trim() : "";
      const start = row.start != null ? String(row.start).trim() : "";
      if (!title || !start) return false;
      // Reject clear Tribe shape
      if (row.start_date != null || row.start_date_details != null) return false;
      return true;
    });
  } catch {
    return false;
  }
}

export function parseBadlandsJson(raw: string, sourceUrl: string | null = null): IngestEventDraft[] {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  const events: any[] = Array.isArray(data?.events)
    ? data.events
    : Array.isArray(data)
      ? data
      : [];

  if (!events.length) return [];

  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const evt of events) {
    if (!evt || typeof evt !== "object") continue;
    const title = String(evt.title || "").trim();
    if (!title) continue;

    const warnings: string[] = [];
    const dateStart = toPacificWallClock(evt.start);
    if (!dateStart) continue;

    let dateEnd = toPacificWallClock(evt.end);
    if (!dateEnd) {
      dateEnd = defaultEndFromStart(dateStart);
      warnings.push("No end — defaulted +3h");
    }

    let description = String(evt.description || evt.blurb || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!description) {
      description = `${title} at ${DEFAULT_VENUE}.`;
      warnings.push("No description — stub");
    }

    const link = evt.link ? String(evt.link).trim() : "";
    const eventPageUrl = link ? link.slice(0, 500) : null;
    const ticketUrl = eventPageUrl || sourceUrl || null;

    const poster = evt.photoUrl ? String(evt.photoUrl).trim() : "";

    // Never invent FREE — only FREE when text clearly says so
    const adm = inferAdmissionFromText(title, description);
    if (adm.reason) warnings.push(adm.reason);

    const draft: IngestEventDraft = {
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      venueName: DEFAULT_VENUE,
      address: DEFAULT_ADDRESS,
      neighborhood: DEFAULT_NEIGHBORHOOD,
      lat: null,
      lng: null,
      dateStart,
      dateEnd,
      dayOfWeek: dayOfWeekFromStart(dateStart),
      ageRequirement: BADLANDS_AGE,
      eventTypes: "[]",
      admission: adm.admission,
      ticketUrl: ticketUrl ? String(ticketUrl).slice(0, 500) : null,
      eventPageUrl,
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: poster ? poster.slice(0, 800) : null,
      sourceUrl,
      parseSource: "badlands",
      warnings,
    };

    const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push(draft);
  }

  return drafts;
}
