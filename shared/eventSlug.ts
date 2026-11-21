/** URL-safe slug from an event title (shared by server SEO and client links). */
export function slugifyEventTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";
}

/** @deprecated Use slugifyEventTitle - kept for existing imports */
export const eventSlug = slugifyEventTitle;

export function eventPath(id: number, title: string, day?: string | null, date?: string | null): string {
  const base = `/events/${id}/${slugifyEventTitle(title)}`;
  const params = new URLSearchParams();
  if (day) params.set("day", day.toUpperCase());
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) params.set("date", date);
  return params.size ? `${base}?${params}` : base;
}

export function eventUrl(id: number, title: string, siteUrl = "https://www.zaylist.com", day?: string | null): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${eventPath(id, title, day)}`;
}
/** Versioned so current shared cards revalidate public visibility. */
export function eventShareImagePath(eventId: number): string {
  return `/api/og/event/${eventId}?v=3`;
}
