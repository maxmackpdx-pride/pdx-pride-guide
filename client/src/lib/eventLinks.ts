import type { Event } from "@shared/schema";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { BEACH_MAP_LOCATIONS } from "@shared/nudeBeaches";
import {
  beachVenueLabel,
  defaultDepartHour,
  formatRiverBratsWindow,
  riverBratsWallIso,
} from "@shared/riverBrats";
import { parsePacificEventTime } from "@/lib/countdown";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Wall-clock components in America/Los_Angeles for calendar export. */
function pacificParts(iso: string) {
  const ts = parsePacificEventTime(iso);
  if (ts == null) return null;
  const d = new Date(ts);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
  };
}

function fmtCalendar(iso: string) {
  const p = pacificParts(iso);
  if (!p) return "";
  return `${p.year}${p.month}${p.day}T${pad(Number(p.hour))}${pad(Number(p.minute))}00`;
}

function buildEventDetails(event: Pick<Event, "description" | "venueName" | "address" | "ticketUrl" | "title">) {
  const lines: string[] = [];
  if (event.description?.trim()) lines.push(event.description.trim());
  if (event.venueName) lines.push(`Venue: ${event.venueName}`);
  if (event.address) lines.push(`Address: ${event.address}`);
  if (event.ticketUrl) lines.push(`Tickets: ${event.ticketUrl}`);
  lines.push("via Zaylist at zaylist.com");
  return lines.join("\n");
}

/** Google Calendar add-event URL (America/Los_Angeles). */
export function googleCalendarUrl(
  event: Pick<Event, "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName" | "ticketUrl">,
) {
  const start = fmtCalendar(event.dateStart);
  const end = fmtCalendar(event.dateEnd);
  const details = buildEventDetails(event);
  const location = event.address || event.venueName || "";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&ctz=America%2FLos_Angeles`;
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsFoldLine(line: string) {
  const max = 75;
  if (line.length <= max) return [line];
  const out: string[] = [];
  let rest = line;
  out.push(rest.slice(0, max));
  rest = rest.slice(max);
  while (rest.length > 0) {
    out.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  return out;
}

/** Download .ics for Apple Calendar / Outlook / etc. */
export function downloadIcsFile(
  event: Pick<Event, "id" | "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName" | "ticketUrl">,
) {
  const start = fmtCalendar(event.dateStart);
  const end = fmtCalendar(event.dateEnd);
  const details = buildEventDetails(event);
  const location = event.address || event.venueName || "";
  const uid = `zaylist-event-${event.id}@zaylist.com`;
  const stamp = fmtCalendar(new Date().toISOString());

  const rawLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zaylist//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:America/Los_Angeles",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/Los_Angeles:${start}`,
    `DTEND;TZID=America/Los_Angeles:${end}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(details)}`,
    `LOCATION:${icsEscape(location)}`,
    ...(event.ticketUrl ? [`URL:${event.ticketUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const body = rawLines.flatMap(icsFoldLine).join("\r\n");

  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.replace(/[^\w\s-]/g, "").trim().slice(0, 48) || "event"}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function googleMapsUrl(event: Pick<Event, "address" | "venueName" | "lat" | "lng">) {
  if (event.lat != null && event.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;
  }
  const q = event.address || event.venueName || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function appleMapsUrl(event: Pick<Event, "address" | "venueName" | "lat" | "lng">) {
  if (event.lat != null && event.lng != null) {
    const q = encodeURIComponent(event.venueName || event.address || "Event");
    return `https://maps.apple.com/?ll=${event.lat},${event.lng}&q=${q}`;
  }
  const q = encodeURIComponent(event.address || event.venueName || "");
  return `https://maps.apple.com/?q=${q}`;
}

/** For tests and audits - Pacific wall-clock calendar strings. */
export function calendarExportSnapshot(
  event: Pick<Event, "id" | "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName" | "ticketUrl">,
) {
  return {
    googleStart: fmtCalendar(event.dateStart),
    googleEnd: fmtCalendar(event.dateEnd),
    location: event.address || event.venueName || "",
    details: buildEventDetails(event),
    googleUrl: googleCalendarUrl(event),
  };
}

/** Build an Event-shaped payload so beach check-ins reuse Google/ICS export. */
export function beachCheckinCalendarEvent(input: {
  id?: number | string;
  beachId: NudeBeachTab;
  calendarDate: string;
  arrivalHour: number;
  departHour?: number | null;
  note?: string | null;
}): Pick<Event, "id" | "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName" | "ticketUrl"> {
  const loc = BEACH_MAP_LOCATIONS[input.beachId];
  const venue = beachVenueLabel(input.beachId);
  const depart = input.departHour ?? defaultDepartHour(input.arrivalHour);
  const window = formatRiverBratsWindow(input.arrivalHour, depart);
  const lines = [
    `River Brats check-in · ${window}`,
    input.note?.trim() || null,
    `Maps: https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
    `via Zaylist at zaylist.com/z/out/${input.beachId}`,
  ].filter(Boolean) as string[];
  const numericId =
    typeof input.id === "number"
      ? input.id
      : Math.abs(
          Array.from(String(input.id ?? `${input.beachId}-${input.calendarDate}`)).reduce(
            (acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0,
            0,
          ),
        ) || 1;
  return {
    id: numericId,
    title: `Beach day · ${venue}`,
    description: lines.join("\n"),
    dateStart: riverBratsWallIso(input.calendarDate, input.arrivalHour),
    dateEnd: riverBratsWallIso(input.calendarDate, depart),
    venueName: loc.label || venue,
    address: loc.subtitle || null,
    ticketUrl: null,
  };
}

export function googleCalendarUrlForBeachCheckin(
  input: Parameters<typeof beachCheckinCalendarEvent>[0],
): string {
  return googleCalendarUrl(beachCheckinCalendarEvent(input));
}

export function downloadIcsFileForBeachCheckin(
  input: Parameters<typeof beachCheckinCalendarEvent>[0],
): void {
  downloadIcsFile(beachCheckinCalendarEvent(input));
}
