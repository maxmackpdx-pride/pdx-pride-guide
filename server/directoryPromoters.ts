import type { Business } from "@shared/schema";
import { eventMatchesBusiness, normalizeVenueKey } from "./venueCoordinates";

export type DirectoryPromoter = { id: number; username: string; displayName: string | null };

export type PromoterCatalogEvent = {
  id: number;
  venueName: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  claimedBy?: string | null;
  submittedBy?: string | null;
};

export type PromoterCatalogUser = DirectoryPromoter & { email?: string | null };

/**
 * Same promoter set as the old per-venue scan: hosts first, then the claim
 * name, then the submitter. A username match wins over an email match.
 * The directory list used to repeat that scan once per place and reload every
 * live event each time.
 */
export function promotersForBusinesses(
  businesses: Business[],
  events: PromoterCatalogEvent[],
  hostsByEventId: ReadonlyMap<number, readonly number[]>,
  users: readonly PromoterCatalogUser[],
): Map<number, DirectoryPromoter[]> {
  const byId = new Map<number, DirectoryPromoter>();
  const byUsername = new Map<string, DirectoryPromoter>();
  const byEmail = new Map<string, DirectoryPromoter>();
  for (const user of users) {
    const summary: DirectoryPromoter = {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
    };
    byId.set(user.id, summary);
    if (user.username) byUsername.set(user.username, summary);
    if (user.email) byEmail.set(user.email, summary);
  }

  const byVenue = new Map<string, PromoterCatalogEvent[]>();
  const nameless: PromoterCatalogEvent[] = [];
  for (const event of events) {
    const key = normalizeVenueKey(event.venueName || "");
    if (!key) nameless.push(event);
    else {
      const bucket = byVenue.get(key);
      if (bucket) bucket.push(event);
      else byVenue.set(key, [event]);
    }
  }

  const out = new Map<number, DirectoryPromoter[]>();
  for (const business of businesses) {
    const seen = new Set<number>();
    const results: DirectoryPromoter[] = [];
    const add = (user: DirectoryPromoter | undefined) => {
      if (!user || seen.has(user.id)) return;
      seen.add(user.id);
      results.push(user);
    };
    const businessKey = normalizeVenueKey(business.name || "");
    const candidates = businessKey ? [...(byVenue.get(businessKey) ?? []), ...nameless] : nameless;
    for (const event of candidates) {
      if (!eventMatchesBusiness(event, business)) continue;
      for (const hostId of hostsByEventId.get(event.id) ?? []) add(byId.get(hostId));
      if (event.claimedBy) add(byUsername.get(event.claimedBy) ?? byEmail.get(event.claimedBy));
      if (event.submittedBy) add(byUsername.get(event.submittedBy) ?? byEmail.get(event.submittedBy));
    }
    out.set(business.id, results);
  }
  return out;
}
