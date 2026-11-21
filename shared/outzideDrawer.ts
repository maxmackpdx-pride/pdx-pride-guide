/**
 * Outzide drawer countdown: mix featured buddy events and offered
 * carpools with the next upcoming events.
 */
import { nextDrawerEvents, remainingToStart, type DrawerTopEvent } from "./drawerTop";

export type OutzideFeaturedKind = "event" | "buddy" | "carpool";

export type OutzideCountdownItem = DrawerTopEvent & {
  kind: OutzideFeaturedKind;
  href?: string;
};

export type OutzideBuddy = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd?: string | null;
  venueName?: string | null;
  poster?: string | null;
  posterImageUrl?: string | null;
  place?: string | null;
};

export type OutzideFeedItem = {
  id: string | number;
  kind: string;
  title: string;
  tripDate?: string | null;
  dateStart?: string | null;
  placeName?: string | null;
  href?: string | null;
  author?: string | null;
  body?: string | null;
};

const CARPOOL_ID_BASE = 1_000_000_000;

export function isOfferedCarpool(item: OutzideFeedItem): boolean {
  return item.kind === "carpool" && /offering a ride/i.test(item.title);
}

export function buddyToCountdown(buddy: OutzideBuddy): OutzideCountdownItem {
  return {
    id: buddy.id,
    title: buddy.title,
    dateStart: buddy.dateStart,
    dateEnd: buddy.dateEnd,
    venueName: buddy.venueName,
    posterImageUrl: buddy.posterImageUrl || buddy.poster,
    kind: "buddy",
    href: `/events?event=${buddy.id}`,
  };
}

export function carpoolToCountdown(item: OutzideFeedItem): OutzideCountdownItem | null {
  if (!isOfferedCarpool(item)) return null;
  const dateStart = item.dateStart || (item.tripDate ? `${item.tripDate}T12:00:00` : "");
  if (!dateStart) return null;
  const raw = typeof item.id === "number" ? item.id : Number(String(item.id).replace(/\D+/g, ""));
  const id = Number.isFinite(raw) ? CARPOOL_ID_BASE + raw : CARPOOL_ID_BASE;
  return {
    id,
    title: item.title,
    dateStart,
    venueName: item.placeName || item.author || "Carpool",
    kind: "carpool",
    href: item.href || "/outzide",
  };
}

/**
 * Up to `limit` upcoming items, soonest first. Featured buddy events and
 * offered carpools mix with regular next-up events. Duplicates (same event
 * id) keep the featured kind.
 */
export function nextOutzideCountdown(
  events: DrawerTopEvent[],
  featured: OutzideCountdownItem[],
  now = Date.now(),
  limit = 3,
): OutzideCountdownItem[] {
  const upcoming = nextDrawerEvents(events, now, Math.max(limit * 3, 12)).map<OutzideCountdownItem>(event => ({
    ...event,
    kind: "event",
    href: `/events?event=${event.id}`,
  }));
  const liveFeatured = featured.filter(item => remainingToStart(item.dateStart, now) != null);
  const byId = new Map<number, OutzideCountdownItem>();
  for (const event of upcoming) byId.set(event.id, event);
  for (const item of liveFeatured) byId.set(item.id, item);
  return [...byId.values()]
    .sort((a, b) => {
      const featuredRank = (item: OutzideCountdownItem) => (item.kind === "event" ? 1 : 0);
      const byTime = (remainingToStart(a.dateStart, now)?.starts ?? 0) - (remainingToStart(b.dateStart, now)?.starts ?? 0);
      return byTime || featuredRank(a) - featuredRank(b);
    })
    .slice(0, limit);
}

export function featuredFromFeeds(buddies: OutzideBuddy[], feed: OutzideFeedItem[]): OutzideCountdownItem[] {
  return [
    ...buddies.map(buddyToCountdown),
    ...feed.map(carpoolToCountdown).filter((item): item is OutzideCountdownItem => item != null),
  ];
}
