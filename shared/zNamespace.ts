/** Z/ is the Communities namespace. Products keep their own routes and names. */
export const Z_PREFIX = "z";

/** Compatibility map for links from the retired catch-all product namespace. */
export const LEGACY_Z_PRODUCT_REDIRECTS: Readonly<Record<string, string>> = {
  "/z/happening": "/events", "/z/hauz": "/the-hauz",
  "/z/placez": "/directory", "/z/directory": "/directory", "/z/places": "/directory",
  "/z/gifz": "/gifting", "/z/gigz": "/pride-work", "/z/mizzed": "/spotted",
  "/z/sellz": "/sellz", "/z/sell": "/sellz", "/z/market": "/sellz",
  "/z/dark": "/next", "/z/darkroom": "/next", "/z/zaydark": "/next",
  "/z/out": "/outz", "/z/out/rooster-rock": "/outz/rooster-rock",
  "/z/out/sauvie-island": "/outz/sauvie-island",
  "/z/ha%C3%BCz": "/the-hauz", "/z/haüz": "/the-hauz",
  "/z/squadz": "/z", "/z/spaces": "/z", "/z/space": "/z", "/z/squads": "/z",
};

export const Z_RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin", "api", "settings", "dashboard", "inbox", "login", "logout", "signup",
  "u", "new", "edit", "delete", "about", "contact", "legal", "access", "sponsors",
  "next", "darkroom", "help", "support", "zaylist", "zay", "z", "happening", "hauz",
  "placez", "directory", "places", "gifz", "gigz", "mizzed", "sellz", "sell",
  "market", "dark", "out", "squadz", "spaces", "space", "squads",
]);

export function zUrl(slug: string): string {
  return `/${Z_PREFIX}/${slug.replace(/^\/+|\/+$/g, "")}`;
}

export function isReservedZSlug(slug: string): boolean {
  const first = slug.replace(/^\/+/, "").split("/")[0]?.toLowerCase() ?? "";
  return first.length === 0 || Z_RESERVED_SLUGS.has(first);
}
