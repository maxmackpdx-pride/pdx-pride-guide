import type { Business, Event } from "@shared/schema";
import { expandMultiDayEvents, type EventListing } from "@shared/multiDayEvents";
import { parsePacificDateTime } from "@shared/missedConnections";
import { eventMatchesBusiness, mergeMapCoordinates } from "./venueCoordinates";

export type DirectoryEventSummary = {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  listingInstanceKey?: string;
};

function isUpcomingListing(listing: EventListing, nowMs = Date.now()): boolean {
  const endMs = parsePacificDateTime(listing.dateEnd);
  return endMs != null && endMs >= nowMs;
}

function toDirectoryEventSummary(listing: EventListing): DirectoryEventSummary {
  return {
    id: listing.id,
    title: listing.title,
    dateStart: listing.dateStart,
    dateEnd: listing.dateEnd,
    dayOfWeek: listing.dayOfWeek ?? null,
    listingInstanceKey: listing.listingInstanceKey,
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
    .map(toDirectoryEventSummary)
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