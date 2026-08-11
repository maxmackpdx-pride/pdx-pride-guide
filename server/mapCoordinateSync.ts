import type { Business } from "@shared/schema";
import { storage } from "./storage";
import {
  geocodePortlandLocation,
  hasUsableMapCoordinates,
  mergeMapCoordinates,
  resolvePersistedMapCoordinates,
  type MapCoordinateFields,
} from "./venueCoordinates";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function enrichEventForMap<T extends MapCoordinateFields>(event: T): T {
  return mergeMapCoordinates(event, storage.getBusinesses());
}

export async function fillEventMapCoordinates(eventId: number): Promise<void> {
  const event = storage.getEvent(eventId);
  // Re-fill when missing OR when stored pin is outside Portland metro (bad Squarespace/etc.)
  if (!event || hasUsableMapCoordinates(event)) return;

  const businesses = storage.getBusinesses();
  const coords = await resolvePersistedMapCoordinates(
    {
      venueName: event.venueName,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
    },
    businesses,
  );
  if (!coords) return;
  storage.updateEvent(eventId, { lat: coords.lat, lng: coords.lng }, { source: "sync" });
}

export async function fillBusinessMapCoordinates(business: Business): Promise<void> {
  if (hasUsableMapCoordinates(business)) return;
  const coords = await geocodePortlandLocation(business.address, business.name);
  if (!coords) return;
  storage.updateBusiness(business.id, { lat: coords.lat, lng: coords.lng });
}

export async function fillFieldsMapCoordinates(
  fields: MapCoordinateFields,
): Promise<MapCoordinateFields> {
  if (hasUsableMapCoordinates(fields)) return fields;
  const coords = await resolvePersistedMapCoordinates(fields, storage.getBusinesses());
  if (!coords) return fields;
  return { ...fields, lat: coords.lat, lng: coords.lng };
}

let backfillStarted = false;

export function scheduleMapCoordinateBackfill() {
  if (backfillStarted || process.env.DISABLE_MAP_BACKFILL === "1") return;
  backfillStarted = true;

  void (async () => {
    const live = storage.getEvents({ status: "LIVE" });
    // Fix out-of-metro pins first (Hawks-in-NYC class bugs), then missing.
    const needsFix = live.filter(evt => !hasUsableMapCoordinates(evt));
    needsFix.sort((a, b) => {
      const aBad = a.lat != null && a.lng != null ? 0 : 1;
      const bBad = b.lat != null && b.lng != null ? 0 : 1;
      return aBad - bBad;
    });
    for (const evt of needsFix) {
      await fillEventMapCoordinates(evt.id);
      await sleep(1100);
    }

    const missingBusinesses = storage.getBusinesses().filter(biz => !hasUsableMapCoordinates(biz));
    for (const biz of missingBusinesses) {
      await fillBusinessMapCoordinates(biz);
      await sleep(1100);
    }
  })().catch(err => {
    console.error("[map-sync] coordinate backfill failed:", err);
  });
}