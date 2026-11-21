/**
 * Outzide drawer countdown: mix featured buddy events and offered
 * carpools with the next upcoming events.
 */
import { pacificTodayDate, parsePacificDateTime } from "./missedConnections";
import { nextDrawerEvents, remainingToStart, type DrawerTopEvent } from "./drawerTop";

export type OutzideFeaturedKind = "event" | "buddy" | "carpool";

export type OutzideCountdownItem = DrawerTopEvent & {
  kind: OutzideFeaturedKind;
  dateOnly?: boolean;
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
  postKind?: string;
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
  return item.postKind === "CARPOOL_OFFER" || (item.kind === "carpool" && /offering a ride/i.test(item.title));
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
  const dateStart = item.dateStart || item.tripDate;
  if (!dateStart) return null;
  const raw = typeof item.id === "number" ? item.id : Number(String(item.id).replace(/\D+/g, ""));
  if (!Number.isSafeInteger(raw) || raw < 1) return null;
  const sourceOffset = String(item.id).startsWith("post:") ? 2 * CARPOOL_ID_BASE : CARPOOL_ID_BASE;
  const id = sourceOffset + raw;
  return {
    id,
    title: item.title,
    dateStart,
    venueName: item.placeName || item.author || "Carpool",
    kind: "carpool",
    dateOnly: !item.dateStart,
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
  const liveFeatured = featured.filter(item => !item.dateOnly && remainingToStart(item.dateStart, now) != null);
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

/** A date-only ride stays discoverable all day. Only timed departures get a countdown. */
export function upcomingOutzidePlans(items: OutzideCountdownItem[], now: number) {
  const today = pacificTodayDate(now);
  return items.filter(item => item.dateOnly ? item.dateStart >= today : remainingToStart(item.dateStart, now))
    .sort((a,b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0));
}

export function featuredFromFeeds(buddies: OutzideBuddy[], feed: OutzideFeedItem[]): OutzideCountdownItem[] {
  return [
    ...buddies.map(buddyToCountdown),
    ...feed.map(carpoolToCountdown).filter((item): item is OutzideCountdownItem => item != null),
  ];
}

const OUTZIDE_PLACE_PHOTOS: Record<string, string> = {
  "rooster-rock": "/outzide-map/assets/photos/v3/rooster-rock-640.webp",
  "sauvie-island": "/outzide-map/assets/photos/v3/sauvie-island-640.webp",
};

const OUTZIDE_PLACE_MOTIFS: Record<string, string> = {
  "rooster-rock": "/outzide-map/assets/motifs/places/rooster-rock.svg",
  "sauvie-island": "/outzide-map/assets/motifs/places/sauvie-island.svg",
};

export function outzidePlaceSlug(name?: string | null): string {
  return (name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Art for an Outzide mini card. Prefer a provided photo, then a known
 * destination photo, then the destination motif. Returns null when the
 * card should use the standard DayMotif placeholder instead of a black box.
 */
export function outzidePlaceArtUrl(place: { name?: string | null; imageUrl?: string | null }): string | null {
  if (place.imageUrl) return place.imageUrl;
  const slug = outzidePlaceSlug(place.name);
  return OUTZIDE_PLACE_PHOTOS[slug] || OUTZIDE_PLACE_MOTIFS[slug] || null;
}
