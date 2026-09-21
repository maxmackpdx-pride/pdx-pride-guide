/** Validate saved geographic coordinates without inventing a location. */
export function mapCoordinates(lat: unknown, lng: unknown): {lat: number; lng: number} | null {
  if ((typeof lat !== "number" && typeof lat !== "string") || (typeof lng !== "number" && typeof lng !== "string")) return null;
  if (String(lat).trim() === "" || String(lng).trim() === "") return null;
  const latitude = Number(lat), longitude = Number(lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && !(latitude === 0 && longitude === 0)
    ? {lat: latitude, lng: longitude} : null;
}
