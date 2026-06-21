// Generate calendar links for Google, Apple (ICS), and generic ICS download

function toICSDate(dateStr: string): string {
  // Convert ISO string or date to ICS format YYYYMMDDTHHMMSSZ
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function sanitize(str: string): string {
  return (str || "").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function getGoogleCalLink(event: {
  title: string;
  description: string;
  venueName: string;
  address?: string | null;
  dateStart: string;
  dateEnd: string;
}): string {
  const start = toICSDate(event.dateStart);
  const end = toICSDate(event.dateEnd);
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location,
    sf: "true",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getICSContent(event: {
  title: string;
  description: string;
  venueName: string;
  address?: string | null;
  dateStart: string;
  dateEnd: string;
}): string {
  const start = toICSDate(event.dateStart);
  const end = toICSDate(event.dateEnd);
  const location = [event.venueName, event.address].filter(Boolean).join(", ");
  const uid = `pdx-pride-${event.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}@prideguidepdx.com`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PDX Pride Guide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${sanitize(event.title)}`,
    `DESCRIPTION:${sanitize(event.description)}`,
    `LOCATION:${sanitize(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(event: Parameters<typeof getICSContent>[0]): void {
  const content = getICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// Apple Calendar uses the same .ics format — downloadICS works for both.
// On iOS/Mac the OS handles opening .ics in Calendar automatically.
