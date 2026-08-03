/**
 * Static 1200×630 Open Graph / Twitter share cards (board + site fallback).
 * Files live in client/public/og/ — absolute URLs only for crawlers.
 */

function siteBase(): string {
  try {
    if (typeof process !== "undefined" && process.env?.SITE_URL) {
      return String(process.env.SITE_URL).replace(/\/$/, "");
    }
  } catch {
    /* browser / edge without process */
  }
  return "https://www.zaylist.com";
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
  if (path === "/hausing" || path.startsWith("/hausing/")) return "housing";
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
