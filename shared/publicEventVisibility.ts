import { EVENT_WEEK_END_DATE, isPostEventWeekListingCapActive } from "./eventWeek";
import { pacificCalendarDate } from "./missedConnections";

/** The v1 public catalog and the shared feed cache require both flags explicitly. */
export function hasPublicEventFlags(row: { isPublic?: boolean | number | null; isPrivate?: boolean | number | null }): boolean {
  return (row.isPublic === true || row.isPublic === 1) && (row.isPrivate === false || row.isPrivate === 0);
}

export function isPublicEventVisibleUnderPrideCap(event: { dateStart?: string | null }): boolean {
  if (!isPostEventWeekListingCapActive()) return true;
  const start = pacificCalendarDate(event.dateStart || "");
  return !start || start <= EVENT_WEEK_END_DATE;
}

type ShareableEvent = Parameters<typeof hasPublicEventFlags>[0] & { status?: string | null; dateStart?: string | null };

export function canSharePublicEvent(event: ShareableEvent): boolean {
  return event.status === "LIVE" && hasPublicEventFlags(event) && isPublicEventVisibleUnderPrideCap(event);
}
