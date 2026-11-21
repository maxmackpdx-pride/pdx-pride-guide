export type MapCamera = { center: [number, number]; zoom: number; pitch?: number; bearing?: number };
type Point = [number, number];
export type MapBounds = { west: number; east: number; south: number; north: number; footprint?: Point[] };

function mercatorY(lat: number) {
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat));
  return (1 - Math.asinh(Math.tan(clamped * Math.PI / 180)) / Math.PI) / 2;
}
function latitude(y: number) { return Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI; }

/** Intersect the four viewport rays of the pinned Mercator camera with the ground.
 * MapLibre's reference tile is 512 pixels and its default field of view is 2*atan(1/3). */
export function cameraToBounds(camera: MapCamera, width: number, height: number): MapBounds | null {
  const [lng, lat] = camera.center;
  if (![width, height, lng, lat, camera.zoom].every(Number.isFinite) || width <= 0 || height <= 0 ||
      Math.abs(lng) > 180 || Math.abs(lat) > 85.051129) return null;
  const world = 512 * 2 ** camera.zoom;
  const pitch = (camera.pitch ?? 0) * Math.PI / 180;
  const bearing = (camera.bearing ?? 0) * Math.PI / 180;
  const cx = (lng + 180) / 360, cy = mercatorY(lat);
  const distance = 1.5 * height;
  const corners: Point[] = [[-1,-1],[1,-1],[1,1],[-1,1]];
  const footprint: Point[] = corners.map(([sx,sy]) => {
    const y = sy * height / 2;
    // A ray above the horizon reaches the far visible Mercator world.
    const factor = distance / Math.max(1, distance * Math.cos(pitch) + y * Math.sin(pitch));
    const along = y * factor, across = sx * width / 2 * Math.cos(pitch) * factor;
    return [cx + (across * Math.cos(bearing) - along * Math.sin(bearing)) / world,
      cy + (across * Math.sin(bearing) + along * Math.cos(bearing)) / world];
  });
  const xs = footprint.map(([x]) => x * 360 - 180), ys = footprint.map(([,y]) => latitude(y));
  return {west:Math.min(...xs), east:Math.max(...xs), south:Math.min(...ys), north:Math.max(...ys), footprint};
}

export function pointInBounds(lat: number | null | undefined, lng: number | null | undefined, bounds?: MapBounds | null) {
  if (!bounds || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < bounds.south || lat > bounds.north) return false;
  if (!bounds.footprint) return bounds.west <= bounds.east
    ? lng >= bounds.west && lng <= bounds.east : lng >= bounds.west || lng <= bounds.east;
  const center = (bounds.west + bounds.east) / 2;
  const localLng = lng + 360 * Math.round((center - lng) / 360);
  const x = (localLng + 180) / 360, y = mercatorY(lat);
  const points = bounds.footprint;
  return points.every(([ax,ay], i) => {
    const [bx,by] = points[(i+1) % points.length];
    return (bx-ax)*(y-ay) - (by-ay)*(x-ax) >= -1e-15;
  });
}
