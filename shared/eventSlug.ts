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

/** @deprecated Use slugifyEventTitle — kept for existing imports */
export const eventSlug = slugifyEventTitle;

export function eventPath(id: number, title: string, day?: string | null): string {
  const base = `/events/${id}/${slugifyEventTitle(title)}`;
  if (day) return `${base}?day=${encodeURIComponent(day.toUpperCase())}`;
  return base;
}

export function eventUrl(id: number, title: string, siteUrl = "https://www.prideguidepdx.com", day?: string | null): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${eventPath(id, title, day)}`;
}