// This sampler consumes raw DEM meters, not queryTerrainElevation values that
// may already include the map's terrain strength. Scale exactly once.
export const TERRAIN_STRENGTH = 0.5;

export function createTerrainSampler(readRaw, {strength = TERRAIN_STRENGTH, capacity = 4096} = {}) {
  if (!Number.isFinite(strength) || strength < 0 || strength > 1) throw new RangeError('Terrain strength must be between zero and one');
  if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Terrain cache capacity must be positive');
  const cache = new Map();
  let revision = 0;
  return {
    // Advance only when DEM content changes, never for camera animation.
    invalidate() { revision++; },
    sample(coordinate) {
      const lng = Number(coordinate.lng ?? coordinate[0]);
      const lat = Number(coordinate.lat ?? coordinate[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new TypeError('Invalid terrain coordinate');
      const key = `${lng}:${lat}`;
      let entry = cache.get(key);
      if (!entry || entry.revision !== revision) {
        const raw = readRaw([lng, lat]);
        const available = typeof raw === 'number' && Number.isFinite(raw);
        // Missing tiles retain a known height. Never snap a loaded anchor back
        // to sea level merely because its tile was temporarily evicted.
        entry = {revision, height: available ? raw * strength : entry?.height ?? 0,
          available: available || entry?.available || false};
      }
      cache.delete(key); cache.set(key, entry);
      if (cache.size > capacity) cache.delete(cache.keys().next().value);
      return {...entry};
    },
    clear() { cache.clear(); },
    get size() { return cache.size; },
  };
}

// Anchor a rigid or authored curved deck from its approach elevations. This
// deliberately never samples the riverbed beneath intermediate deck vertices.
export function approachBaseline(startHeight, endHeight, fraction) {
  if (![startHeight, endHeight, fraction].every(Number.isFinite)) throw new TypeError('Invalid approach profile');
  const t = Math.max(0, Math.min(1, fraction));
  return startHeight + (endHeight - startHeight) * t;
}
