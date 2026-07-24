/** URL-safe slug from a place / business name (shared by SEO and client links). */
export function slugifyPlaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "place";
}

/** Canonical directory place path: /directory/:id/:slug */
export function placePath(id: number, name: string): string {
  return `/directory/${id}/${slugifyPlaceName(name)}`;
}

export function placeUrl(
  id: number,
  name: string,
  siteUrl = "https://www.zaylist.com",
): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${placePath(id, name)}`;
}
