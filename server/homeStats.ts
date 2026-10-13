import { dedupeEvents } from "../shared/eventDedupe";
import { expandMultiDayEvents } from "../shared/multiDayEvents";
import { isEventSchedulePast, pacificCalendarDate, pacificTodayDate } from "../shared/missedConnections";
import type { Event } from "../shared/schema";

/** Eventz uses seven Pacific dates; the home Placez total includes all active directory listings, including Needz. */
export function homeCatalogCounts(events: Event[], places: { name: string; type: string; active: boolean }[], now = Date.now()) {
  const today = pacificTodayDate(now);
  const lastDay = new Date(`${today}T12:00:00Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + 6);
  const lastDate = lastDay.toISOString().slice(0, 10);
  const eventCount = dedupeEvents(expandMultiDayEvents(events.filter(event => event.status === "LIVE")))
    .filter(event => {
      const date = pacificCalendarDate(event.dateStart);
      return date != null && date >= today && date <= lastDate
        && !isEventSchedulePast(event.dateStart, event.dateEnd, now);
    }).length;
  const placesCount = places.filter(place => place.active).length;
  return { eventCount, placesCount };
}
