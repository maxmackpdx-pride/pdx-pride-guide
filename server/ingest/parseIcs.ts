import type { IngestEventDraft } from "./types";
import { dayOfWeekFromStart, defaultEndFromStart, toPacificWallClock } from "./dates";

/** Unfold ICS lines (RFC 5545): lines starting with space/tab continue previous. */
function unfoldIcs(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseProps(block: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of block) {
    if (!line || line.startsWith("BEGIN:") || line.startsWith("END:")) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const left = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const name = left.split(";")[0].toUpperCase();
    // Prefer first value; DTSTART etc. only appear once per VEVENT typically.
    if (!map.has(name)) map.set(name, value);
    // Keep params for DTSTART/DTEND timezone if present.
    if (name === "DTSTART" || name === "DTEND") {
      map.set(`${name}_RAW`, line.slice(0, colon) + ":" + value);
    }
  }
  return map;
}

function icsDateValue(rawLine: string | undefined, plain: string | undefined): string | null {
  if (rawLine) {
    // DTSTART;TZID=America/Los_Angeles:20260718T210000
    // DTSTART;TZID=UTC:20250628T010000  (UTC without Z — treat as Z)
    const m = rawLine.match(/^DT(?:START|END)([^:]*):(.*)$/i);
    if (m) {
      const params = m[1];
      let val = m[2].trim();
      if (/VALUE=DATE/i.test(params) && /^\d{8}$/.test(val)) {
        return toPacificWallClock(`${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`);
      }
      // TZID=UTC / GMT without trailing Z → absolute UTC
      if (/TZID=(UTC|GMT)/i.test(params) && /^\d{8}T\d{6}$/i.test(val) && !/Z$/i.test(val)) {
        val = `${val}Z`;
      }
      // Floating local with America/Los_Angeles — keep as Pacific wall-clock (no Z)
      if (/TZID=America\/Los_Angeles/i.test(params) && /^\d{8}T\d{6}$/i.test(val)) {
        const c = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
        if (c) return `${c[1]}-${c[2]}-${c[3]}T${c[4]}:${c[5]}:${c[6]}`;
      }
      return toPacificWallClock(val);
    }
  }
  if (plain) return toPacificWallClock(plain.trim());
  return null;
}

function unescapeIcs(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Parse VEVENT blocks from an .ics body into ingest drafts.
 */
export function parseIcs(text: string, sourceUrl: string | null = null): IngestEventDraft[] {
  if (!/BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(text)) return [];

  const lines = unfoldIcs(text);
  const events: string[][] = [];
  let cur: string[] | null = null;
  for (const line of lines) {
    if (/^BEGIN:VEVENT$/i.test(line)) {
      cur = [line];
      continue;
    }
    if (cur) {
      cur.push(line);
      if (/^END:VEVENT$/i.test(line)) {
        events.push(cur);
        cur = null;
      }
    }
  }

  const drafts: IngestEventDraft[] = [];
  const seen = new Set<string>();

  for (const block of events) {
    const props = parseProps(block);
    const title = unescapeIcs(props.get("SUMMARY") || "");
    if (!title) continue;

    const warnings: string[] = [];
    const dateStart = icsDateValue(props.get("DTSTART_RAW"), props.get("DTSTART"));
    if (!dateStart) {
      warnings.push("Missing DTSTART");
      continue;
    }
    let dateEnd = icsDateValue(props.get("DTEND_RAW"), props.get("DTEND"));
    if (!dateEnd) {
      // DURATION not fully supported — default +3h
      dateEnd = defaultEndFromStart(dateStart);
      warnings.push("No DTEND — defaulted to start + 3 hours");
    }

    const location = unescapeIcs(props.get("LOCATION") || "");
    const description = unescapeIcs(props.get("DESCRIPTION") || "") ||
      `${title}${location ? ` at ${location}` : ""}.`;
    if (!props.get("DESCRIPTION")) warnings.push("No DESCRIPTION — generated stub");

    const icsUrl = unescapeIcs(props.get("URL") || "");
    const eventPageUrl =
      icsUrl && /^https?:\/\//i.test(icsUrl) && !/\.ics(\?|$)/i.test(icsUrl)
        ? icsUrl.slice(0, 500)
        : null;
    const venueName = (location.split(",")[0] || "TBA").slice(0, 200);

    const draft: IngestEventDraft = {
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      venueName: venueName || "TBA",
      address: location ? location.slice(0, 300) : null,
      neighborhood: null,
      lat: null,
      lng: null,
      dateStart,
      dateEnd,
      dayOfWeek: dayOfWeekFromStart(dateStart),
      ageRequirement: "ALL_AGES",
      eventTypes: "[]",
      admission: "FREE",
      ticketUrl: eventPageUrl || (sourceUrl && sourceUrl.startsWith("http") ? sourceUrl.slice(0, 500) : null),
      eventPageUrl,
      isPublic: true,
      isPrivate: false,
      isHouseParty: false,
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: null,
      sourceUrl,
      parseSource: "ics",
      warnings,
    };

    const key = `${draft.title}|${draft.dateStart}|${draft.venueName}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push(draft);
  }

  return drafts;
}

export function looksLikeIcs(text: string): boolean {
  const head = text.slice(0, 400).toUpperCase();
  return head.includes("BEGIN:VCALENDAR") || head.includes("BEGIN:VEVENT");
}
