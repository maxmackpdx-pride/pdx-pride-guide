export const productionOrigin = "https://www.zaylist.com";

const pacificDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function occurrenceDate(value) {
  if (!value) return "";
  if (!/[zZ]|[+-]\d\d:\d\d$/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? pacificDate.format(date) : "";
}

export function eventLink(id, date) {
  return `${productionOrigin}/events/${id}?date=${encodeURIComponent(date)}`;
}

export function parseEventLink(value) {
  try {
    const link = new URL(value);
    const path =
      link.protocol === "zaylistevents:"
        ? "/" + link.hostname + link.pathname
        : link.protocol === "exp:"
          ? link.pathname.split("/--")[1]
          : link.protocol === "https:" &&
              ["www.zaylist.com", "zaylist.com"].includes(link.hostname)
            ? link.pathname
            : null;
    const match = /^\/events\/(\d+)(?:\/[^/]*)?\/?$/.exec(path || "");
    if (
      !match ||
      !Number.isSafeInteger(Number(match[1])) ||
      Number(match[1]) < 1
    )
      return null;
    const date = link.searchParams.get("date");
    if (date && !/^\d{4}-\d\d-\d\d$/.test(date)) return null;
    return { id: Number(match[1]), date: date || "" };
  } catch {
    return null;
  }
}

// Expo is an independently installed project. Match the server’s public snapshot rules.
export function isPublicListing(row) {
  return row?.status === "LIVE" && (row.isPublic === true || row.isPublic === 1) &&
    (row.isPrivate === false || row.isPrivate === 0);
}
