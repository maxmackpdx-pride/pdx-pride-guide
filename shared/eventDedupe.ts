import { normalizeTitleKey } from "./submissionMatch";

// Collapse duplicate event rows that are the *same event at the same day+time*
// (e.g. the same party scraped/added twice). Non-destructive: this only affects
// what a read path returns — nothing is deleted, RSVPs and admin views are intact.
//
// Dedupe identity = normalized title + normalized venue + day + start HH:MM.
// Different day, different start time, or a genuinely different venue all stay
// separate (two different bars at 9pm are two events, not a duplicate).

type DedupeEvent = {
  id: number;
  title: string;
  venueName: string;
  dateStart: string;
  posterImageUrl?: string | null;
  description?: string | null;
  ticketUrl?: string | null;
};

function normVenue(v: string | null | undefined): string {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** "2026-08-01T21:00" → day+start-minute bucket used for same-day/same-time. */
function dayTimeKey(iso: string | null | undefined): string {
  const m = String(iso || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : String(iso || "").slice(0, 16);
}

export function eventDedupeKey(e: DedupeEvent): string {
  return `${normalizeTitleKey(e.title)}|${normVenue(e.venueName)}|${dayTimeKey(e.dateStart)}`;
}

/** Richer record wins a tie: has poster > longer description > has tickets > lower id. */
function richness(e: DedupeEvent): number {
  return (
    (e.posterImageUrl ? 1000 : 0) +
    Math.min(500, (e.description?.length || 0)) +
    (e.ticketUrl ? 50 : 0)
  );
}

/**
 * Return events with same-day/same-time duplicates collapsed to one (the richest),
 * preserving the input order of first appearance.
 */
export function dedupeEvents<T extends DedupeEvent>(events: T[]): T[] {
  const best = new Map<string, T>();
  const order: string[] = [];
  for (const e of events) {
    const k = eventDedupeKey(e);
    const cur = best.get(k);
    if (!cur) {
      best.set(k, e);
      order.push(k);
      continue;
    }
    const better =
      richness(e) > richness(cur) || (richness(e) === richness(cur) && e.id < cur.id);
    if (better) best.set(k, e);
  }
  return order.map(k => best.get(k)!);
}

/** Duplicate groups (2+ rows sharing a key) — for an admin "find duplicates" report. */
export function findDuplicateEventGroups<T extends DedupeEvent>(events: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const e of events) {
    const k = eventDedupeKey(e);
    const arr = groups.get(k) || [];
    arr.push(e);
    groups.set(k, arr);
  }
  return Array.from(groups.values()).filter(g => g.length > 1);
}
