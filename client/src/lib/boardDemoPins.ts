/** Synthetic display locations for explicitly labeled demo posts only. */
export function boardDemoPoint(row: {id?: unknown; isDemo?: unknown}, world: string) {
  if (row.isDemo !== true || row.id == null) return null;
  const anchors: Record<string, [number, number]> = {
    mizzed: [45.5235, -122.6775], gigz: [45.5205, -122.6715],
    giftz: [45.5195, -122.6555], sellz: [45.5245, -122.6505],
  };
  const anchor = anchors[world];
  if (!anchor) return null;
  const seed = Array.from(String(row.id)).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0);
  return {lat: anchor[0] + (seed % 3) * .0015, lng: anchor[1] + (Math.floor(seed / 3) % 3) * .0015, demo: true};
}
