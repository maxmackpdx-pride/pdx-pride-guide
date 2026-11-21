import { mizzedEventHref } from "@shared/placezEventsDrawer";
import {
  centerThenOpenMapCard,
  isMapSurfacePath,
  mapCardSearch,
  type MapCardTarget,
} from "@shared/centerThenOpen";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";

type EaseMap = {
  easeTo: (options: { center: [number, number]; duration?: number }) => void;
  once?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
};

function hostWindow(): Window & {
  __zaylistMap?: EaseMap;
  __mapReleaseDiagnostics?: { easeTo?: EaseMap["easeTo"]; flyTo?: EaseMap["easeTo"]; centerTo?: (lng: number, lat: number) => void };
} {
  return window as never;
}

function findMap(): EaseMap | null {
  const root = hostWindow();
  if (root.__zaylistMap?.easeTo) return root.__zaylistMap;
  const diagnostics = root.__mapReleaseDiagnostics;
  if (typeof diagnostics?.easeTo === "function") return { easeTo: diagnostics.easeTo };
  if (typeof diagnostics?.flyTo === "function") return { easeTo: diagnostics.flyTo };
  for (const frame of Array.from(document.querySelectorAll("iframe"))) {
    try {
      const map = (frame.contentWindow as { __zaylistMap?: EaseMap } | null)?.__zaylistMap;
      if (map?.easeTo) return map;
    } catch {
      // Cross-origin map frames are ignored; the host fallback still opens the card.
    }
  }
  return null;
}

export function easeMapTo(lng: number, lat: number, duration = 700): Promise<void> {
  const diagnostics = hostWindow().__mapReleaseDiagnostics;
  if (typeof diagnostics?.centerTo === "function") {
    diagnostics.centerTo(lng, lat);
    return Promise.resolve();
  }
  const map = findMap();
  if (!map) return Promise.resolve();
  return new Promise(resolve => {
    const done = () => {
      map.off?.("moveend", done);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(done, duration + 400);
    map.once?.("moveend", done);
    map.easeTo({ center: [lng, lat], duration });
  });
}

/** Existing open path: map bookmarks (?event= / ?place=) or the event/place routes. */
export function openExistingCard(target: MapCardTarget, assign: (href: string) => void = href => window.location.assign(href)): string {
  if (typeof window !== "undefined" && isMapSurfacePath(window.location.pathname)) {
    const href = mapCardSearch(`${window.location.pathname}${window.location.search}${window.location.hash}`, target);
    window.history.pushState(window.history.state, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return href;
  }
  const href = target.kind === "place"
    ? placePath(target.id, target.title || "Place")
    : target.title
      ? eventPath(target.id, target.title)
      : `/events?event=${target.id}`;
  assign(href);
  return href;
}

/** Center the map on the item, then call the existing open-card path. */
export async function centerThenOpenFromDrawer(target: MapCardTarget): Promise<MapCardTarget> {
  return centerThenOpenMapCard(target, { centerMap: easeMapTo, openCard: openExistingCard });
}

/** Agent-callable helpers for the Placez events drawers. Swipes always have a button that calls the same API. */
export function openMizzedForEvent(eventId: number, assign: (href: string) => void = href => {
  window.location.assign(href);
}): string {
  const href = mizzedEventHref(eventId);
  assign(href);
  return href;
}

export function openEventFromDrawer(eventId: number, title: string, assign: (href: string) => void = href => {
  window.location.assign(href);
}, coords?: { lat?: number | null; lng?: number | null }): string {
  const target: MapCardTarget = { kind: "event", id: eventId, title, lat: coords?.lat, lng: coords?.lng };
  if (typeof window !== "undefined" && (isMapSurfacePath(window.location.pathname) || hasMapCoordinates(coords))) {
    void centerThenOpenFromDrawer(target);
    return isMapSurfacePath(window.location.pathname)
      ? mapCardSearch(`${window.location.pathname}${window.location.search}`, target)
      : `/events?event=${eventId}`;
  }
  const href = `/events?event=${eventId}`;
  assign(href);
  return href;
}

function hasMapCoordinates(coords?: { lat?: number | null; lng?: number | null }): boolean {
  return coords?.lat != null && coords?.lng != null && Number.isFinite(coords.lat) && Number.isFinite(coords.lng);
}

export function placezEventsDrawerApi() {
  return { openMizzedForEvent, openEventFromDrawer, centerThenOpenFromDrawer, openExistingCard, mizzedEventHref };
}
