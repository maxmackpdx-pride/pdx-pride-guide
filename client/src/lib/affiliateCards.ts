import type { EventListing } from "@shared/multiDayEvents";
import { PRIDE_WEEK_DAYS } from "@shared/prideWeek";
import type { AdServePayload } from "@/lib/adTypes";

export type AffiliateBrand = "mrs" | "cockblock";

export type AffiliateSlot = {
  kind: "affiliate";
  brand: AffiliateBrand;
  key: string;
  /** Pride day this placement was assigned to (for stable keys / debugging). */
  day: string;
  /** When set, render data-driven PosterAdCard instead of legacy brand card. */
  ad?: AdServePayload;
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

function brandFromAd(ad: AdServePayload): AffiliateBrand {
  const key = (ad.templateKey || "").toLowerCase();
  if (key.includes("mrs")) return "mrs";
  if (key.includes("cockblock") || key.includes("cb")) return "cockblock";
  const url = (ad.destUrl || "").toLowerCase();
  if (url.includes("mr-s-leather") || url.includes("mrs")) return "mrs";
  return "cockblock";
}

/**
 * Scatter at most one affiliate card per Pride day into the filtered board list.
 * Rules (legacy + data-driven):
 * - One per day that has at least minEvents events (default 2)
 * - Max maxPerDay per ad / brand across the whole grid
 * - Never first card in the grid; never first card of a day
 * - Never two affiliate cards adjacent
 *
 * When `posterAds` is empty/undefined, falls back to hard-coded Mr S / CockBlock alternation.
 */
export function scatterAffiliateCards(
  events: EventListing[],
  posterAds?: AdServePayload[] | null,
): EventsGridItem[] {
  const items: EventsGridItem[] = events.map((event) => ({ kind: "event", event }));
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

  const liveAds = (posterAds || []).filter((a) => a.format === "poster");
  if (liveAds.length > 0) {
    return scatterFromAds(items, dayIndices, liveAds);
  }
  return scatterLegacy(items, dayIndices);
}

function scatterLegacy(
  items: EventsGridItem[],
  dayIndices: Map<string, number[]>,
): EventsGridItem[] {
  const eligibleDays = PRIDE_WEEK_DAYS.filter((d) => (dayIndices.get(d)?.length ?? 0) >= 2);
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

    const pick = Math.max(1, Math.min(indices.length - 1, Math.floor(indices.length * 0.45)));
    planned.push({ afterIndex: indices[pick], brand, day });
    if (brand === "mrs") mrsCount += 1;
    else cbCount += 1;
  }

  planned.sort((a, b) => b.afterIndex - a.afterIndex);

  for (const ins of planned) {
    let insertAt = ins.afterIndex + 1;
    if (insertAt <= 0) continue;

    const wouldAdjacent = () => {
      const left = items[insertAt - 1];
      const right = items[insertAt];
      return left?.kind === "affiliate" || right?.kind === "affiliate";
    };

    if (wouldAdjacent()) {
      insertAt += 1;
      if (insertAt <= 0 || insertAt > items.length || wouldAdjacent()) continue;
    }

    if (insertAt === 0) continue;

    items.splice(insertAt, 0, {
      kind: "affiliate",
      brand: ins.brand,
      key: `affiliate-${ins.brand}-${ins.day}`,
      day: ins.day,
    });
  }

  while (items[0]?.kind === "affiliate") items.shift();
  return items;
}

function scatterFromAds(
  items: EventsGridItem[],
  dayIndices: Map<string, number[]>,
  ads: AdServePayload[],
): EventsGridItem[] {
  // Sort by weight desc
  const pool = [...ads].sort((a, b) => b.weight - a.weight || a.id - b.id);
  const placedPerAd = new Map<number, number>();

  type Insertion = { afterIndex: number; ad: AdServePayload; day: string };
  const planned: Insertion[] = [];

  for (let dayIdx = 0; dayIdx < PRIDE_WEEK_DAYS.length; dayIdx++) {
    const day = PRIDE_WEEK_DAYS[dayIdx];
    const indices = dayIndices.get(day);
    if (!indices || indices.length === 0) continue;

    // Pick first ad that can place on this day
    let chosen: AdServePayload | null = null;
    for (const ad of pool) {
      const minEvents = ad.minEvents ?? 2;
      if (indices.length < minEvents) continue;
      if (ad.days?.length && !ad.days.includes(day)) continue;
      const max = ad.maxPerDay ?? AFFILIATE_MAX_PER_BRAND;
      // Cap total placements of this ad across the whole grid (legacy brand max).
      const count = placedPerAd.get(ad.id) ?? 0;
      if (count >= max) continue;
      // onePerDay on the ad: at most one placement of this creative per Pride day,
      // which the outer day loop already enforces (one insert planned per day).
      chosen = ad;
      break;
    }
    if (!chosen) continue;

    const scatterPct = (chosen.scatterPct ?? 45) / 100;
    const neverFirst = chosen.neverFirst !== false;
    let pick = Math.floor(indices.length * scatterPct);
    if (neverFirst) pick = Math.max(1, Math.min(indices.length - 1, pick));
    else pick = Math.max(0, Math.min(indices.length - 1, pick));

    planned.push({ afterIndex: indices[pick], ad: chosen, day });
    placedPerAd.set(chosen.id, (placedPerAd.get(chosen.id) ?? 0) + 1);

    // Rotate: move chosen to end so brands alternate when multiple ads
    const idx = pool.indexOf(chosen);
    if (idx >= 0) {
      pool.splice(idx, 1);
      pool.push(chosen);
    }
  }

  planned.sort((a, b) => b.afterIndex - a.afterIndex);

  for (const ins of planned) {
    let insertAt = ins.afterIndex + 1;
    if (insertAt <= 0) continue;
    const noAdjacent = ins.ad.noAdjacent !== false;

    const wouldAdjacent = () => {
      const left = items[insertAt - 1];
      const right = items[insertAt];
      return left?.kind === "affiliate" || right?.kind === "affiliate";
    };

    if (noAdjacent && wouldAdjacent()) {
      insertAt += 1;
      if (insertAt <= 0 || insertAt > items.length || wouldAdjacent()) continue;
    }

    if (ins.ad.neverFirst !== false && insertAt === 0) continue;

    items.splice(insertAt, 0, {
      kind: "affiliate",
      brand: brandFromAd(ins.ad),
      key: `affiliate-${ins.ad.id}-${ins.day}`,
      day: ins.day,
      ad: ins.ad,
    });
  }

  while (items[0]?.kind === "affiliate") items.shift();
  return items;
}
