import { parsePacificDateTime } from './missedConnections';

export type SearchableEvent = {
  title: string; venueName: string; description?: string | null;
  neighborhood?: string | null; dateStart: string; dayOfWeek?: string | null;
  searchTalent?: string[];
  /** ALL_AGES | 18_PLUS | 21_PLUS | UNVERIFIED (anything else/missing never matches an age search). */
  ageRequirement?: string | null;
};
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const aliases: Record<string, string> = Object.fromEntries(DAYS.flatMap(day => [[day.slice(0, 3), day], [day + 's', day]]));
Object.assign(aliases, { tues: 'tuesday', thurs: 'thursday', thur: 'thursday', weds: 'wednesday' });
function words(value: string): string[] {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
}
// Optimal string alignment includes adjacent transpositions (e.g. "firday").
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i-1][j]+1, rows[i][j-1]+1, rows[i-1][j-1]+Number(a[i-1] !== b[j-1]));
    if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) rows[i][j] = Math.min(rows[i][j], rows[i-2][j-2]+1);
  }
  return rows[a.length][b.length];
}
function closeWord(query: string, candidate: string): boolean {
  // A one-letter difference in a short word changes its meaning too easily:
  // "bear" must not match "gear" and bury Bearracuda results.
  const limit = query.length >= 8 ? 2 : query.length >= 5 ? 1 : 0;
  return limit > 0 && Math.abs(query.length-candidate.length) <= limit && distance(query, candidate) <= limit;
}
const cache = new WeakMap<SearchableEvent, string[]>();
function eventWords(event: SearchableEvent): string[] {
  const cached = cache.get(event);
  if (cached) return cached;
  const start = parsePacificDateTime(event.dateStart);
  const day = start == null ? event.dayOfWeek : new Intl.DateTimeFormat('en-US', {weekday:'long', timeZone:'America/Los_Angeles'}).format(start);
  const result = [...new Set(words([event.title, event.venueName, event.description, event.neighborhood, day, ...(event.searchTalent ?? [])].filter(Boolean).join(' ')))];
  cache.set(event, result);
  return result;
}
/**
 * Age phrases in a query ("all ages", "21+", "18 and over", "over 21") become a filter on the event's ageRequirement
 * instead of text terms, so "all ages" finds ALL_AGES listings even though the description never says it.
 * UNVERIFIED listings are never claimed as all ages.
 */
export function extractAgeIntent(query: string): { age: string | null; rest: string } {
  let age: string | null = null;
  const take = (pattern: RegExp, value: (m: RegExpMatchArray) => string) => {
    const match = query.match(pattern);
    if (match) { age = age ?? value(match); query = query.replace(pattern, ' '); }
  };
  take(/\ball[\s-]*ages?\b/i, () => 'ALL_AGES');
  take(/\b(?:family|kid)[\s-]*friendly\b/i, () => 'ALL_AGES');
  take(/(?:^|[^\p{L}\p{N}])(21|18)\s*(?:\+|plus\b|and\s*(?:over|up|older)\b)/iu, m => `${m[1]}_PLUS`);
  take(/\b(?:over|age|ages)\s*(21|18)\b/i, m => `${m[1]}_PLUS`);
  return { age, rest: query };
}
export function createEventSearch(rawQuery: string): (event: SearchableEvent) => boolean {
  const { age: wantedAge, rest: query } = extractAgeIntent(rawQuery);
  const terms = words(query).filter(term => term !== 'the' && term !== 'at' && term !== 'on').slice(0, 24).map(term => aliases[term] ?? term);
  return event => {
    if (wantedAge && event.ageRequirement !== wantedAge) return false;
    if (!terms.length) return true;
    const candidates = eventWords(event);
    return terms.every(term => {
      // Weekday queries refer to the listing date, not another night mentioned in its description.
      const day = DAYS.find(day => day === term || closeWord(term, day));
      if (day) {
        const start = parsePacificDateTime(event.dateStart);
        const actual = start == null ? (event.dayOfWeek ?? '').toLowerCase() : new Intl.DateTimeFormat('en-US', {weekday:'long',timeZone:'America/Los_Angeles'}).format(start).toLowerCase();
        return (aliases[actual] ?? actual) === day;
      }
      return candidates.some(word => word === term || (term.length >= 3 && word.startsWith(term)) || closeWord(term, word));
    });
  };
}
