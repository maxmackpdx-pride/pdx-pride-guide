/**
 * Shared "center the map, then open the existing card" flow for drawer mini
 * cards. The open step reuses the map bookmark / Eventz and Placez expanded
 * views. Hosts inject the actual map camera and card-open functions.
 */
export type MapCardTarget = {
  kind: "event" | "place";
  id: number;
  title?: string;
  lat?: number | null;
  lng?: number | null;
};

export type CenterThenOpenActions = {
  centerMap: (lng: number, lat: number) => Promise<void> | void;
  openCard: (target: MapCardTarget) => void;
};

export function hasMapCoordinates(target: MapCardTarget): boolean {
  return target.lat != null && target.lng != null && Number.isFinite(target.lat) && Number.isFinite(target.lng);
}

/** Stay on the current map surface and set the existing event/place bookmark. */
export function mapCardSearch(pathWithSearch: string, target: MapCardTarget, base = "https://www.zaylist.com"): string {
  const url = new URL(pathWithSearch, base);
  url.searchParams.delete("event");
  url.searchParams.delete("place");
  url.searchParams.set(target.kind, String(target.id));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isMapSurfacePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/placez/map" || path === "/mapz" || path === "/map" || path === "/map-demo"
    || path === "/outzide" || path.startsWith("/outzide/");
}

/**
 * Pan/center first (when the item has coordinates), then open the existing
 * card. Callers must pass the host camera and the existing open-card function
 * so this never rebuilds Eventz or Placez expanded views.
 */
export async function centerThenOpenMapCard(
  target: MapCardTarget,
  actions: CenterThenOpenActions,
): Promise<MapCardTarget> {
  if (hasMapCoordinates(target)) {
    await actions.centerMap(target.lng as number, target.lat as number);
  }
  actions.openCard(target);
  return target;
}
