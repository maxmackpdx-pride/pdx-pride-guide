import { googleMapsUrl, appleMapsUrl } from "@/lib/eventLinks";

type MapPlace = { address?: string | null; name?: string | null; lat?: number | null; lng?: number | null };

function toMapEvent(place: MapPlace) {
  return { address: place.address ?? null, venueName: place.name ?? "", lat: place.lat ?? null, lng: place.lng ?? null };
}

export function placeGoogleMapsUrl(place: MapPlace): string {
  return googleMapsUrl(toMapEvent(place));
}

export function placeAppleMapsUrl(place: MapPlace): string {
  return appleMapsUrl(toMapEvent(place));
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
