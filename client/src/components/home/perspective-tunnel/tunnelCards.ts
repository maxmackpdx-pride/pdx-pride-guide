import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import outzCatalog from "@shared/outzMapCatalog";
import { dayAccentToken } from "@/lib/dsColors";
import { formatCardTime, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { hashKey, mulberry32 } from "./tunnelMath";

/** What one flying card needs. Presentational only: no hearts, modals or auth. */
export type TunnelCardData = {
  key: string;
  kind: "event" | "outzide";
  title: string;
  kicker: string;
  line: string;
  href: string;
  imageUrl?: string;
  /** CSS colour, usually a design token var. */
  accent: string;
};

/** The slice of `/outzide-map/places.json` -> `places[]` (385 destinations) the hero reads. */
export type OutzideMapPlace = {
  id: string;
  name: string;
  kind: string;
  region?: string;
  detail?: string;
  art?: string;
  photo?: { src: string; alt?: string };
};

// Same palette and labels the home rail's OutzSmallCard uses.
const OUTZ_TOKENS: Record<string, string> = { trail: "--neon-orange", stay: "--neon-magenta", beach: "--neon-magenta", camp: "--green-acid", coastcamp: "--neon-cyan", watercamp: "--neon-cyan", spring: "--neon-cyan", fishing: "--green-acid", boating: "--neon-cyan", atv: "--neon-red", winter: "--neon-blue", dayuse: "--neon-yellow" };
const OUTZ_LABELS: Record<string, string> = { trail: "Trail", stay: "Stay", beach: "Beach", camp: "Camp", coastcamp: "Coastal camp", watercamp: "Waterfront camp", spring: "Hot spring", fishing: "Fishing", boating: "Boating", atv: "Off-road", winter: "Winter", dayuse: "Day use" };

const assetUrl = (rel: string) => `/outzide-map/${rel.replace(/^\//, "")}`;

export function eventToTunnelCard(listing: EventListing): TunnelCardData {
  const day = listingDay(listing);
  return {
    key: `event:${listing.listingInstanceKey ?? listing.id}`,
    kind: "event",
    title: listing.title,
    kicker: day,
    line: [formatCardTime(listing), listing.venueName].filter(Boolean).join(" · "),
    href: eventPath(listing.id, listing.title, day),
    imageUrl: listingPosterUrl(listing),
    accent: dayAccentToken(day),
  };
}

export function outzPlaceToTunnelCard(place: OutzideMapPlace): TunnelCardData {
  const image = place.photo?.src ?? place.art;
  return {
    key: `outz:${place.id}`,
    kind: "outzide",
    title: place.name,
    kicker: OUTZ_LABELS[place.kind] ?? "Destination",
    line: place.region || place.detail || "Outzide",
    href: `/outzide?place=${encodeURIComponent(place.id)}`,
    imageUrl: image ? assetUrl(image) : undefined,
    accent: `var(${OUTZ_TOKENS[place.kind] ?? "--neon-yellow"})`,
  };
}

/** Fallback pool: the static 385-row Outzide catalog (id, name, kind) when places.json is not passed in. */
export const OUTZ_CATALOG_FALLBACK: OutzideMapPlace[] = outzCatalog as OutzideMapPlace[];

/**
 * >>> BLENDED-ART PLUG-IN POINT (the one place to filter Outzide cards) <<<
 * Which Outzide places may fly through the tunnel. Today: every place (pickTunnelCards then prefers ones with a
 * photo or art). The "new blended art only" rule is not on master yet; when `lib/outzBlendedArt.ts` lands, change
 * this to `isBlendedArtPlace(place)` (or filter the `outzPlaces` prop with `blendedArtPlaces`). Nothing else changes.
 */
export const isTunnelOutzideEligible = (_place: OutzideMapPlace): boolean => true;

/**
 * Random assortment of real event cards and Outzide cards.
 *
 * Shuffle is keyed by `seed` + item id (not by array order), so the selection does not
 * reshuffle when events or places finish loading a moment apart. One seed per mount =
 * stable for the session, different on every load.
 *
 * Items with imagery are preferred (a flying card with no picture reads as a mistake); the
 * pool falls back to the full set only when too few have images.
 */
export function pickTunnelCards(
  events: readonly EventListing[],
  places: readonly OutzideMapPlace[],
  count: number,
  seed: number,
): TunnelCardData[] {
  const liveEvents = events.filter(e => e.isPublic !== false && !e.isPrivate && e.status === "LIVE");
  const eventCards = liveEvents.map(eventToTunnelCard);
  const outzCards = places.filter(isTunnelOutzideEligible).map(outzPlaceToTunnelCard);
  const take = (pool: TunnelCardData[], n: number) => {
    const withArt = pool.filter(c => c.imageUrl);
    const source = withArt.length >= n ? withArt : pool;
    return source
      .map(c => ({ c, k: hashKey(seed, c.key) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, n)
      .map(x => x.c);
  };
  const wantEvents = Math.ceil(count / 2);
  let ev = take(eventCards, wantEvents);
  let oz = take(outzCards, count - wantEvents);
  // If one source is short, let the other fill so the tunnel is never sparse.
  if (ev.length < wantEvents) oz = take(outzCards, count - ev.length);
  if (oz.length < count - wantEvents) ev = take(eventCards, count - oz.length);
  // Interleave, then Fisher-Yates with the same seed so event/Outzide order is mixed too.
  const mixed: TunnelCardData[] = [];
  for (let i = 0; i < Math.max(ev.length, oz.length); i++) {
    if (ev[i]) mixed.push(ev[i]);
    if (oz[i]) mixed.push(oz[i]);
  }
  const rand = mulberry32(seed ^ 0x85ebca6b);
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  return mixed.slice(0, count);
}
