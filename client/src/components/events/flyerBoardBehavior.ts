/** Nested controls retain their own native keyboard activation. */
export function isPosterActivation(key: string, isPosterTarget: boolean): boolean {
  return isPosterTarget && (key === "Enter" || key === " ");
}

/** Reserve the selected/front slot before deduplicating small decks. */
export function fanSlots(count: number, selected: number): Array<{ index: number; offset: number }> {
  if (count <= 0) return [];
  const used = new Set<number>();
  const slots: Array<{ index: number; offset: number }> = [];
  for (const offset of [0, -1, 1, -2, 2]) {
    const index = ((selected + offset) % count + count) % count;
    if (used.has(index)) continue;
    used.add(index);
    slots.push({ index, offset });
  }
  return slots.sort((a, b) => a.offset - b.offset);
}

/**
 * A connection attached to an event belongs to that event alone — it never
 * spills into another event at the same venue. A connection attached to no
 * event (venue-hinted only) pools by venue, so it can fan under that venue's
 * events until it is attached properly (founder rule, Nov 17, 2026).
 */
export function connectionsForListing<
  T extends {
    id: number;
    eventId?: number | null;
    venueHint?: string | null;
    placeName?: string | null;
    eventVenue?: string | null;
  },
>(posts: T[], eventId: number, venueName: string): T[] {
  const own: T[] = [];
  for (const post of posts) {
    if (post.eventId === eventId && !own.some(existing => existing.id === post.id)) own.push(post);
  }
  if (own.length > 0) return own;
  const venue = venueName.trim().toLowerCase();
  if (!venue) return [];
  const pooled: T[] = [];
  for (const post of posts) {
    if (post.eventId != null) continue;
    const hinted = [post.venueHint, post.placeName, post.eventVenue].some(
      value => value?.trim().toLowerCase() === venue,
    );
    if (hinted && !pooled.some(existing => existing.id === post.id)) pooled.push(post);
  }
  return pooled;
}
