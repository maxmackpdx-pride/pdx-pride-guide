import type { Business } from "@shared/schema";
import { storage } from "./storage";
import {
  geocodePortlandLocation,
  hasMapCoordinates,
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
  if (!event || hasMapCoordinates(event)) return;

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
  storage.updateEvent(eventId, { lat: coords.lat, lng: coords.lng });
}

export async function fillBusinessMapCoordinates(business: Business): Promise<void> {
  if (hasMapCoordinates(business)) return;
  const coords = await geocodePortlandLocation(business.address, business.name);
  if (!coords) return;
  storage.updateBusiness(business.id, { lat: coords.lat, lng: coords.lng });
}

export async function fillFieldsMapCoordinates(
  fields: MapCoordinateFields,
): Promise<MapCoordinateFields> {
  if (hasMapCoordinates(fields)) return fields;
  const coords = await resolvePersistedMapCoordinates(fields, storage.getBusinesses());
  if (!coords) return fields;
  return { ...fields, lat: coords.lat, lng: coords.lng };
}

let backfillStarted = false;

export function scheduleMapCoordinateBackfill() {
  if (backfillStarted || process.env.DISABLE_MAP_BACKFILL === "1") return;
  backfillStarted = true;

  void (async () => {
    const missingEvents = storage.getEvents({ status: "LIVE" }).filter(evt => !hasMapCoordinates(evt));
    for (const evt of missingEvents) {
      await fillEventMapCoordinates(evt.id);
      await sleep(1100);
    }

    const missingBusinesses = storage.getBusinesses().filter(biz => !hasMapCoordinates(biz));
    for (const biz of missingBusinesses) {
      await fillBusinessMapCoordinates(biz);
      await sleep(1100);
    }
  })().catch(err => {
    console.error("[map-sync] coordinate backfill failed:", err);
  });
}