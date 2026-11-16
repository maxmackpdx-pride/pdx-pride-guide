// Reviewed 2026-11-16. USFS visitor page updated 2026-09-25:
// https://www.fs.usda.gov/r06/rogue-siskiyou/recreation/abbott-creek-campground
// Correct the stale INFRA point only. Preserve status, identity and newer coordinates.
export function correctOutzCatalogCoordinates<T extends { id: string; name: string; lat: number; lng: number }>(place: T): T {
  if (place.id !== "usfs-5179010262" || place.name.trim().toLowerCase() !== "abbott creek campground"
      || place.lat !== 42.69711 || place.lng !== -122.49184) return place;
  return { ...place, lat: 42.880002, lng: -122.508049 };
}
