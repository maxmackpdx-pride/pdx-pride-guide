/**
 * Shared "NEEDS A RIDE" list helpers for the event card (#115) and drawers
 * (#117). Cards are wide and short. A need within 2 miles, or tied to the
 * same event or Afterz, is shown. Bloom: flashing --yellow for the same
 * Afterz, flashing --neon-orange for the same event. Motion stays static
 * under reduced motion and Calm Mode.
 */
export const RIDEZ_NEED_RADIUS_M = 3219; // 2 miles

export type RidezNeedBloom = "afterz" | "event" | null;

export type RidezNeed = {
  id: string;
  name: string;
  photoUrl?: string | null;
  neighborhood?: string | null;
  eventId?: number | null;
  eventTitle?: string | null;
  afterzId?: string | null;
  afterzTitle?: string | null;
  lat?: number | null;
  lng?: number | null;
  direction?: "arriving" | "departing" | null;
  neededAt?: number | null;
};

export type RidezNeedContext = {
  lat?: number | null;
  lng?: number | null;
  eventId?: number | null;
  afterzId?: string | null;
};

const EARTH_M = 6_371_000;

export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function ridezNeedBloom(need: RidezNeed, context: RidezNeedContext = {}): RidezNeedBloom {
  if (context.afterzId && need.afterzId && context.afterzId === need.afterzId) return "afterz";
  if (context.eventId != null && need.eventId != null && context.eventId === need.eventId) return "event";
  return null;
}

export function ridezNeedVisible(need: RidezNeed, context: RidezNeedContext = {}): boolean {
  if (context.afterzId && need.afterzId && context.afterzId === need.afterzId) return true;
  if (context.eventId != null && need.eventId != null && context.eventId === need.eventId) return true;
  if (
    context.lat != null && context.lng != null
    && need.lat != null && need.lng != null
    && distanceMeters(context.lat, context.lng, need.lat, need.lng) <= RIDEZ_NEED_RADIUS_M
  ) {
    return true;
  }
  return false;
}

export function visibleRidezNeeds(needs: RidezNeed[], context: RidezNeedContext = {}): RidezNeed[] {
  return needs.filter(need => ridezNeedVisible(need, context));
}
