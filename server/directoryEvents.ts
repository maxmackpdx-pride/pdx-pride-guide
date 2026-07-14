import type { Business, Event } from "@shared/schema";
import { expandMultiDayEvents, type EventListing } from "@shared/multiDayEvents";
import { parsePacificDateTime } from "@shared/missedConnections";
import {
  getTuckerHostedArchiveRows,
  archiveDuplicatesLivePast,
  TUCKER_HOSTED_ARCHIVE_USERNAME,
} from "@shared/tuckerHostedArchive";
import { eventMatchesBusiness, mergeMapCoordinates } from "./venueCoordinates";

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

function isUpcomingListing(listing: EventListing, nowMs = Date.now()): boolean {
  const endMs = parsePacificDateTime(listing.dateEnd);
  return endMs != null && endMs >= nowMs;
}

function isPastListing(listing: EventListing, nowMs = Date.now()): boolean {
  const endMs = parsePacificDateTime(listing.dateEnd);
  return endMs != null && endMs < nowMs;
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
  const businessCoords = mergeMapCoordinates(
    {
      venueName: business.name,
      address: business.address,
      lat: business.lat,
      lng: business.lng,
    },
    businesses,
  );

  return listings
    .filter(listing => isUpcomingListing(listing))
    .filter(listing => eventMatchesBusiness(
      mergeMapCoordinates(
        {
          venueName: listing.venueName,
          address: listing.address,
          lat: listing.lat,
          lng: listing.lng,
        },
        businesses,
      ),
      {
        name: business.name,
        address: business.address,
        lat: businessCoords.lat,
        lng: businessCoords.lng,
      },
    ))
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

function listingMatchesBusiness(
  listing: { venueName?: string | null; address?: string | null; lat?: number | null; lng?: number | null },
  business: Business,
  businesses: Business[],
): boolean {
  const businessCoords = mergeMapCoordinates(
    {
      venueName: business.name,
      address: business.address,
      lat: business.lat,
      lng: business.lng,
    },
    businesses,
  );
  return eventMatchesBusiness(
    mergeMapCoordinates(
      {
        venueName: listing.venueName || "",
        address: listing.address ?? null,
        lat: listing.lat ?? null,
        lng: listing.lng ?? null,
      },
      businesses,
    ),
    {
      name: business.name,
      address: business.address,
      lat: businessCoords.lat,
      lng: businessCoords.lng,
    },
  );
}

/** Past nights at this venue: LIVE past listings + Tucker profile archive (Sanctuary / Eagle). */
export function getPastEventsForBusiness(
  business: Business,
  listings: EventListing[],
  businesses: Business[],
  nowMs = Date.now(),
): DirectoryEventSummary[] {
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
    .filter(row => listingMatchesBusiness(row, business, businesses))
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

/** Best-effort fuzzy match: no FK exists on missed_connections, so match the linked
 * event's venue (if any) or the free-text venueHint against the business name/address. */
function venueTextMatchesBusiness(venueText: string | null | undefined, business: Business): boolean {
  if (!venueText) return false;
  return eventMatchesBusiness({ venueName: venueText, address: null, lat: null, lng: null }, {
    name: business.name, address: business.address, lat: business.lat, lng: business.lng,
  });
}

export function attachSpottedAndGigsToBusinesses<T extends Business>(
  businesses: T[],
  missedConnections: Array<{ id: number; title: string; body: string; createdAt: string; eventVenue?: string | null; venueHint?: string | null }>,
  gigs: Array<{ id: number; title: string; postType: string; createdAt: string; location?: string | null; businessId?: number | null }>,
): Array<T & { spotted: DirectorySpottedSummary[]; gigs: DirectoryGigSummary[] }> {
  return businesses.map(business => {
    const spotted = missedConnections
      .filter(mc => venueTextMatchesBusiness(mc.eventVenue || mc.venueHint, business))
      .map(mc => ({ id: mc.id, title: mc.title, body: mc.body, createdAt: mc.createdAt }));
    const gigPosts = gigs
      .filter(g => (g.businessId != null ? g.businessId === business.id : venueTextMatchesBusiness(g.location, business)))
      .map(g => ({ id: g.id, title: g.title, postType: g.postType, createdAt: g.createdAt }));
    return { ...business, spotted, gigs: gigPosts };
  });
}