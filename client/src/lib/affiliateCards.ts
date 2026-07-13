import type { EventListing } from "@shared/multiDayEvents";
import { PRIDE_WEEK_DAYS } from "@shared/prideWeek";

export type AffiliateBrand = "mrs" | "cockblock";

export type AffiliateSlot = {
  kind: "affiliate";
  brand: AffiliateBrand;
  key: string;
  /** Pride day this placement was assigned to (for stable keys / debugging). */
  day: string;
};

export type EventsGridItem =
  | { kind: "event"; event: EventListing }
  | AffiliateSlot;

export const AFFILIATE_ACCENT = "#FF0033";
export const AFFILIATE_MAX_PER_BRAND = 5;

export const AFFILIATE_LINKS = {
  mrs: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
  cockblock: "https://cockblocktoys.com/tucker060",
} as const;

/**
 * Scatter at most one affiliate card per Pride day into the filtered board list.
 * Rules:
 * - One per day that has at least 2 events in the current list
 * - Max 5 of each brand across the whole grid
 * - Alternate brands day-to-day for even exposure
 * - Never first card in the grid; never first card of a day
 * - Never two affiliate cards adjacent
 */
export function scatterAffiliateCards(events: EventListing[]): EventsGridItem[] {
  const items: EventsGridItem[] = events.map(event => ({ kind: "event", event }));
  if (items.length < 2) return items;

  const dayIndices = new Map<string, number[]>();
  items.forEach((item, i) => {
    if (item.kind !== "event") return;
    const day = item.event.dayOfWeek;
    if (!day || !(PRIDE_WEEK_DAYS as readonly string[]).includes(day)) return;
    const list = dayIndices.get(day) ?? [];
    list.push(i);
    dayIndices.set(day, list);
  });

  const eligibleDays = PRIDE_WEEK_DAYS.filter(d => (dayIndices.get(d)?.length ?? 0) >= 2);
  if (eligibleDays.length === 0) return items;

  type Insertion = { afterIndex: number; brand: AffiliateBrand; day: string };
  const planned: Insertion[] = [];
  let mrsCount = 0;
  let cbCount = 0;

  for (let dayIdx = 0; dayIdx < eligibleDays.length; dayIdx++) {
    if (mrsCount >= AFFILIATE_MAX_PER_BRAND && cbCount >= AFFILIATE_MAX_PER_BRAND) break;

    const day = eligibleDays[dayIdx];
    const indices = dayIndices.get(day)!;

    let brand: AffiliateBrand = dayIdx % 2 === 0 ? "mrs" : "cockblock";
    if (brand === "mrs" && mrsCount >= AFFILIATE_MAX_PER_BRAND) brand = "cockblock";
    if (brand === "cockblock" && cbCount >= AFFILIATE_MAX_PER_BRAND) brand = "mrs";
    if (brand === "mrs" && mrsCount >= AFFILIATE_MAX_PER_BRAND) continue;
    if (brand === "cockblock" && cbCount >= AFFILIATE_MAX_PER_BRAND) continue;

    // Scatter mid-pack for the day; never before the first event of that day.
    const pick = Math.max(1, Math.min(indices.length - 1, Math.floor(indices.length * 0.45)));
    planned.push({ afterIndex: indices[pick], brand, day });
    if (brand === "mrs") mrsCount += 1;
    else cbCount += 1;
  }

  // Insert high → low so earlier afterIndex values stay valid.
  planned.sort((a, b) => b.afterIndex - a.afterIndex);

  for (const ins of planned) {
    let insertAt = ins.afterIndex + 1;
    if (insertAt <= 0) continue;

    // Nudge off neighbors if an earlier (higher-index) insert already sits adjacent.
    const wouldAdjacent = () => {
      const left = items[insertAt - 1];
      const right = items[insertAt];
      return left?.kind === "affiliate" || right?.kind === "affiliate";
    };

    if (wouldAdjacent()) {
      // Try one step later, still after the day's first event if possible.
      insertAt += 1;
      if (insertAt <= 0 || insertAt > items.length || wouldAdjacent()) continue;
    }

    // Never first in the whole grid.
    if (insertAt === 0) continue;

    items.splice(insertAt, 0, {
      kind: "affiliate",
      brand: ins.brand,
      key: `affiliate-${ins.brand}-${ins.day}`,
      day: ins.day,
    });
  }

  // Hard guard: drop a leading affiliate if anything slipped through.
  while (items[0]?.kind === "affiliate") items.shift();

  return items;
}
