/** How many events /events inlines for crawlers. The full list stays on
 *  /api/events, /llms.txt, and the sitemap. */
export const EVENTS_INDEX_INLINE_LIMIT = 40;

type Described = { description?: string | null };

/**
 * The events index used to inline every live event, including its description.
 * That document was about 1.5MB, and phones killed the tab while scrolling it.
 * Keep a short, description-free sample in the HTML. One event's own page still
 * gets that event's full text from the single-event builder.
 */
export function eventsIndexInlineCatalog<T extends Described>(events: T[]): T[] {
  return events.slice(0, EVENTS_INDEX_INLINE_LIMIT).map((event) => (
    event.description ? { ...event, description: null } : event
  ));
}
