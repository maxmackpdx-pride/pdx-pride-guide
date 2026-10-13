import { dedupeEvents } from "../shared/eventDedupe";
import { expandMultiDayEvents } from "../shared/multiDayEvents";
import { isPlacezType } from "../shared/directoryTheme";
import { isEventSchedulePast, pacificCalendarDate, pacificTodayDate } from "../shared/missedConnections";
import { directoryResourceName } from "../client/src/lib/directoryResources";
import type { Event } from "../shared/schema";

/** Match Eventz's next seven Pacific calendar days and Placez's public catalog. */
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
  const placesCount = places.filter(place => place.active && isPlacezType(place.type) && !directoryResourceName(place)).length;
  return { eventCount, placesCount };
}
