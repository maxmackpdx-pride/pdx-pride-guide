import { mizzedEventHref } from "@shared/placezEventsDrawer";

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
}): string {
  const href = `/events?event=${eventId}`;
  assign(href);
  return href;
}

export function placezEventsDrawerApi() {
  return { openMizzedForEvent, openEventFromDrawer, mizzedEventHref };
}
