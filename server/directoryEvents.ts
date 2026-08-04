import type { Business, Event } from "@shared/schema";
import { expandMultiDayEvents, type EventListing } from "@shared/multiDayEvents";
import { isEventSchedulePast, parsePacificDateTime } from "@shared/missedConnections";
import { resolveBusinessLocations } from "@shared/businessLocations";
import {
  getTuckerHostedArchiveRows,
  archiveDuplicatesLivePast,
  TUCKER_HOSTED_ARCHIVE_USERNAME,
} from "@shared/tuckerHostedArchive";
import { eventMatchesBusiness, mergeMapCoordinates } from "./venueCoordinates";
import { eventMentionsDirectoryGroup } from "./qsearch/directoryBrands";

export type DirectoryEventSummary = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  listingInstanceKey?: string;
  posterImageUrl?: string | null;
  /** Host label when known (e.g. Tucker Max for archive nights). */
  hostDisplayName?: string | null;
  hostUsername?: string | null;
};

/**
 * Align with Events board: missing dateEnd falls back to dateStart
 * (CC Slaughters / Camp Bar ingest often leave end empty).
 */
function isUpcomingListing(listing: EventListing, nowMs = Date.now()): boolean {
  return !isEventSchedulePast(listing.dateStart, listing.dateEnd, nowMs);
}

function isPastListing(listing: EventListing, nowMs = Date.now()): boolean {
  return isEventSchedulePast(listing.dateStart, listing.dateEnd, nowMs);
}

function toDirectoryEventSummary(
  listing: EventListing,
  extra?: Partial<DirectoryEventSummary>,
): DirectoryEventSummary {
  return {
    id: listing.id,
    title: listing.title,
    dateStart: listing.dateStart,
    dateEnd: listing.dateEnd,
    dayOfWeek: listing.dayOfWeek ?? null,
    listingInstanceKey: listing.listingInstanceKey,
    posterImageUrl: listing.posterImageUrl ?? null,
    ...extra,
  };
}

export function getUpcomingEventsForBusiness(
  business: Business,
  listings: EventListing[],
  businesses: Business[],
): DirectoryEventSummary[] {
  return listings
    .filter(listing => isUpcomingListing(listing))
    .filter(listing => listingMatchesBusiness(listing, business, businesses))
    .map(listing => toDirectoryEventSummary(listing))
    .sort((a, b) => {
      const at = parsePacificDateTime(a.dateStart) ?? 0;
      const bt = parsePacificDateTime(b.dateStart) ?? 0;
      return at - bt || a.title.localeCompare(b.title);
    });
}

export function attachUpcomingEventsToBusinesses(
  businesses: Business[],
  events: Event[],
): Array<Business & { upcomingEvents: DirectoryEventSummary[] }> {
  const listings = expandMultiDayEvents(events);
  return businesses.map(business => ({
    ...business,
    upcomingEvents: getUpcomingEventsForBusiness(business, listings, businesses),
  }));
}

/**
 * Match an event listing to a directory business via primary row + every
 * multi-location storefront (Taboo / Mr. Peeps / FANTASY addresses).
 * Groups also match when title/description mentions brand aliases
 * (Coach's Pet → Yes Coach Productions; venue still Sanctuary).
 */
function listingMatchesBusiness(
  listing: {
    venueName?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    title?: string | null;
    description?: string | null;
  },
  business: Business,
  businesses: Business[],
): boolean {
  const eventFields = mergeMapCoordinates(
    {
      venueName: listing.venueName || "",
      address: listing.address ?? null,
      lat: listing.lat ?? null,
      lng: listing.lng ?? null,
    },
    businesses,
  );

  const candidates: Array<{ name?: string; venueName?: string; address?: string | null; lat?: number | null; lng?: number | null }> = [
    mergeMapCoordinates(
      {
        venueName: business.name,
        address: business.address,
        lat: business.lat,
        lng: business.lng,
      },
      businesses,
    ),
  ];

  for (const loc of resolveBusinessLocations(business)) {
    candidates.push({
      name: business.name,
      address: loc.address,
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
    });
    // Storefront label alone (e.g. "SE 82nd") rarely matches, but full
    // "Taboo Video SE 82nd" style venue strings can include the brand name.
    if (loc.label) {
      candidates.push({
        name: `${business.name} ${loc.label}`,
        address: loc.address,
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
      });
    }
  }

  if (
    candidates.some(biz =>
      eventMatchesBusiness(eventFields, {
        name: biz.name || biz.venueName,
        address: biz.address,
        lat: biz.lat,
        lng: biz.lng,
      }),
    )
  ) {
    return true;
  }

  return eventMentionsDirectoryGroup(listing, business);
}

/** Past nights at this venue: LIVE past listings + Tucker profile archive (Sanctuary / Eagle). */
export function getPastEventsForBusiness(
  business: Business,
  listings: EventListing[],
  businesses: Business[],
  nowMs = Date.now(),
): DirectoryEventSummary[] {
  const isYesCoach = business.name.trim().toLowerCase() === "yes coach productions";
  const livePast = listings
    .filter(listing => isPastListing(listing, nowMs))
    .filter(listing => listingMatchesBusiness(listing, business, businesses))
    .map(listing => {
      const claimed = (listing.claimedBy || "").toLowerCase();
      const isTucker =
        claimed === TUCKER_HOSTED_ARCHIVE_USERNAME ||
        claimed === "tucker" ||
        /tucker/i.test(String(listing.adminNotes || ""));
      return toDirectoryEventSummary(listing, isTucker
        ? { hostDisplayName: "Tucker Max", hostUsername: TUCKER_HOSTED_ARCHIVE_USERNAME }
        : undefined);
    });

  const archivePast = getTuckerHostedArchiveRows()
    .filter(row => {
      const endMs = parsePacificDateTime(row.dateEnd);
      return endMs != null && endMs < nowMs;
    })
    // Tucker's profile archive is the Yes Coach production history. Locker
    // Room belongs to Eagle Portland, so it stays off the Yes Coach card.
    .filter(row =>
      isYesCoach
        ? !row.slug.startsWith("locker-room-")
        : listingMatchesBusiness(row, business, businesses),
    )
    .filter(row => !livePast.some(live => archiveDuplicatesLivePast(row, live)))
    .map(row => ({
      id: row.id,
      title: row.title,
      dateStart: row.dateStart,
      dateEnd: row.dateEnd,
      dayOfWeek: row.dayOfWeek,
      posterImageUrl: row.posterImageUrl,
      hostDisplayName: "Tucker Max",
      hostUsername: TUCKER_HOSTED_ARCHIVE_USERNAME,
    } satisfies DirectoryEventSummary));

  return [...livePast, ...archivePast].sort((a, b) => {
    const at = parsePacificDateTime(a.dateStart) ?? 0;
    const bt = parsePacificDateTime(b.dateStart) ?? 0;
    return bt - at || a.title.localeCompare(b.title);
  });
}

export function attachPastEventsToBusinesses<T extends Business>(
  businesses: T[],
  events: Event[],
): Array<T & { pastEvents: DirectoryEventSummary[] }> {
  const listings = expandMultiDayEvents(events);
  return businesses.map(business => ({
    ...business,
    pastEvents: getPastEventsForBusiness(business, listings, businesses as Business[]),
  }));
}

/** Convenience: upcoming + past in one pass over expanded listings. */
export function attachEventsToBusinesses(
  businesses: Business[],
  events: Event[],
): Array<Business & { upcomingEvents: DirectoryEventSummary[]; pastEvents: DirectoryEventSummary[] }> {
  const listings = expandMultiDayEvents(events);
  return businesses.map(business => ({
    ...business,
    upcomingEvents: getUpcomingEventsForBusiness(business, listings, businesses),
    pastEvents: getPastEventsForBusiness(business, listings, businesses),
  }));
}

export type DirectoryPromoterSummary = { id: number; username: string; displayName: string | null };

export function attachPromotersToBusinesses<T extends Business>(
  businesses: T[],
  getPromotersForBusiness: (businessId: number) => DirectoryPromoterSummary[],
): Array<T & { promoters: DirectoryPromoterSummary[] }> {
  return businesses.map(business => ({
    ...business,
    promoters: getPromotersForBusiness(business.id),
  }));
}

export type DirectorySpottedSummary = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

export type DirectoryGigSummary = {
  id: number;
  title: string;
  postType: string;
  createdAt: string;
};

/**
 * Best-effort place attach for Mizzed Connection / gigs:
 * - event-linked posts: match event venue (+ address when present)
 * - freeform venueHint: match name against brand + multi-loc storefronts
 * No business_id FK on missed_connections, so this is fuzzy only.
 */
function venueTextMatchesBusiness(
  venueText: string | null | undefined,
  business: Business,
  address?: string | null,
): boolean {
  if (!venueText && !address) return false;
  return listingMatchesBusiness(
    {
      venueName: venueText || "",
      address: address ?? null,
      lat: null,
      lng: null,
    },
    business,
    [],
  );
}

export function attachSpottedAndGigsToBusinesses<T extends Business>(
  businesses: T[],
  missedConnections: Array<{
    id: number;
    title: string;
    body: string;
    createdAt: string;
    eventId?: number | null;
    eventVenue?: string | null;
    eventAddress?: string | null;
    venueHint?: string | null;
  }>,
  gigs: Array<{ id: number; title: string; postType: string; createdAt: string; location?: string | null; businessId?: number | null }>,
): Array<T & { spotted: DirectorySpottedSummary[]; gigs: DirectoryGigSummary[] }> {
  return businesses.map(business => {
    const spotted = missedConnections
      .filter(mc => {
        // Prefer linked event venue; also try freeform hint (demo + around-town posts).
        if (venueTextMatchesBusiness(mc.eventVenue, business, mc.eventAddress)) return true;
        if (mc.venueHint && venueTextMatchesBusiness(mc.venueHint, business)) return true;
        return false;
      })
      .map(mc => ({ id: mc.id, title: mc.title, body: mc.body, createdAt: mc.createdAt }));
    const gigPosts = gigs
      .filter(g => (g.businessId != null ? g.businessId === business.id : venueTextMatchesBusiness(g.location, business)))
      .map(g => ({ id: g.id, title: g.title, postType: g.postType, createdAt: g.createdAt }));
    return { ...business, spotted, gigs: gigPosts };
  });
}
