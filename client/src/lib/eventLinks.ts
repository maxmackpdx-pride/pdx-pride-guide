import type { Event } from "@shared/schema";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Google Calendar add-event URL (America/Los_Angeles). */
export function googleCalendarUrl(event: Pick<Event, "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName">) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(event.dateStart)}/${fmt(event.dateEnd)}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(event.address || event.venueName || "")}&ctz=America/Los_Angeles`;
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Download .ics for Apple Calendar / Outlook / etc. */
export function downloadIcsFile(event: Pick<Event, "title" | "description" | "dateStart" | "dateEnd" | "address" | "venueName">) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const uid = `pdx-pride-${Date.now()}@pdxpride.guide`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PDX Pride Guide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:America/Los_Angeles",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART;TZID=America/Los_Angeles:${fmt(event.dateStart)}`,
    `DTEND;TZID=America/Los_Angeles:${fmt(event.dateEnd)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description || "")}`,
    `LOCATION:${icsEscape(event.address || event.venueName || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

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