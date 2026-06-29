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

export function eventPath(id: number, title: string): string {
  return `/events/${id}/${slugifyEventTitle(title)}`;
}

export function eventUrl(id: number, title: string, siteUrl = "https://www.prideguidepdx.com"): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${eventPath(id, title)}`;
}