/** Neighborhood points for HAÜZ listings that have no stored lat/lng. Demo / map only. */
export const HAUZ_DEMO_PINS: Record<number, { lat: number; lng: number }> = {
  9: { lat: 45.5148, lng: -122.6215 },
  10: { lat: 45.5772, lng: -122.6764 },
  11: { lat: 45.5264, lng: -122.6371 },
  12: { lat: 45.5589, lng: -122.6478 },
  13: { lat: 45.4885, lng: -122.6940 },
};

const AREA_PINS: Record<string, { lat: number; lng: number }> = {
  southeast: { lat: 45.5126, lng: -122.6209 },
  northeast: { lat: 45.5589, lng: -122.6478 },
  north: { lat: 45.5772, lng: -122.6764 },
  southwest: { lat: 45.4885, lng: -122.6940 },
  "south portland": { lat: 45.4889, lng: -122.6750 },
  beaverton: { lat: 45.4871, lng: -122.8037 },
};

export function stampHauzMapPoints<T extends { id?: number | string; lat?: unknown; lng?: unknown; areas?: unknown }>(
  rows: T[],
): T[] {
  return rows.map((row) => {
    if (typeof row.lat === "number" && Number.isFinite(row.lat) && typeof row.lng === "number" && Number.isFinite(row.lng)) return row;
    const id = Number(row.id);
    if (Number.isFinite(id) && HAUZ_DEMO_PINS[id]) {
      return { ...row, ...HAUZ_DEMO_PINS[id] };
    }
    const area = Array.isArray(row.areas)
      ? row.areas.find((item): item is string => typeof item === "string")
      : null;
    const pin = area ? AREA_PINS[area.toLowerCase()] : null;
    return pin ? { ...row, ...pin } : row;
  });
}
