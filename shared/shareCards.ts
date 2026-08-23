/**
 * Static 1200×630 Open Graph / Twitter share cards (board + site fallback).
 * Files live in client/public/og/ — absolute URLs only for crawlers.
 */

export const CANONICAL_SITE_ORIGIN = "https://www.zaylist.com";

const LEGACY_PUBLIC_HOSTS = new Set([
  "zaylist.com",
  "prideguidepdx.com",
  "www.prideguidepdx.com",
  "pdxpg.com",
  "www.pdxpg.com",
  "pdxprideguide.com",
  "www.pdxprideguide.com",
]);

/** Force www.zaylist.com when SITE_URL still points at a retired brand host. */
export function canonicalizeSiteOrigin(raw?: string | null): string {
  const fallback = CANONICAL_SITE_ORIGIN;
  const value = String(raw || fallback).trim().replace(/\/$/, "");
  try {
    const u = new URL(value.includes("://") ? value : `https://${value}`);
    if (LEGACY_PUBLIC_HOSTS.has(u.hostname.toLowerCase())) return fallback;
  } catch {
    return fallback;
  }
  return value || fallback;
}

/** Rewrite apex / Pride Guide hosts on a full public URL. Leaves preview hosts alone. */
export function canonicalizePublicUrl(url: string): string {
  try {
    const u = new URL(url);
    if (LEGACY_PUBLIC_HOSTS.has(u.hostname.toLowerCase())) {
      u.protocol = "https:";
      u.hostname = "www.zaylist.com";
      u.port = "";
    }
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function siteBase(): string {
  try {
    if (typeof process !== "undefined" && process.env?.SITE_URL) {
      return canonicalizeSiteOrigin(process.env.SITE_URL);
    }
  } catch {
    /* browser / edge without process */
  }
  return CANONICAL_SITE_ORIGIN;
}

/** Filename under /og/ (no leading slash in the map values beyond path). */
export const SHARE_CARD_FILES = {
  home: "zaylist-home-fallback-1200x630.png",
  events: "zaylist-events-1200x630.png",
  schedule: "zaylist-events-1200x630.png",
  housing: "zaylist-housing-1200x630.png",
  spotted: "zaylist-missed-connections-1200x630.png",
  prideWork: "zaylist-gig-board-1200x630.png",
  gifting: "zaylist-gifting-1200x630.png",
  nudeBeaches: "zaylist-nude-beaches-1200x630.png",
  next: "zaylist-next-1200x630.png",
} as const;

export type ShareCardKey = keyof typeof SHARE_CARD_FILES;

/** Absolute URL for a share card (cache-busted when you replace art). */
export function shareCardUrl(key: ShareCardKey, bust = "v1"): string {
  const file = SHARE_CARD_FILES[key];
  return `${siteBase()}/og/${file}?${bust}`;
}

/**
 * Map a request pathname (no query) to a board share card, or null to use
 * dynamic event/place/profile cards or the site fallback.
 */
export function shareCardKeyForPath(pathname: string): ShareCardKey | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/events" || path.startsWith("/events/")) {
    // Per-event URLs use dynamic /api/og/event/:id — only bare /events board.
    if (path === "/events") return "events";
    return null;
  }
  if (path === "/schedule") return "schedule";
  if (path === "/the-hauz" || path.startsWith("/the-hauz/") || path === "/hausing" || path.startsWith("/hausing/")) return "housing";
  if (path === "/spotted") return "spotted";
  if (path === "/pride-work" || path === "/gigs") return "prideWork";
  if (path === "/gifting") return "gifting";
  if (path === "/nude-beaches" || path.startsWith("/nude-beaches/")) return "nudeBeaches";
  if (path === "/next" || path === "/darkroom") return "next";
  return null;
}

export function defaultShareCardUrl(bust = "v1"): string {
  return shareCardUrl("home", bust);
}
