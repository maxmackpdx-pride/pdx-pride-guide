import { parsePacificDateTime } from './missedConnections';

export type SearchableEvent = {
  title: string; venueName: string; description?: string | null;
  neighborhood?: string | null; dateStart: string; dayOfWeek?: string | null;
  searchTalent?: string[];
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
  const limit = query.length >= 8 ? 2 : query.length >= 4 ? 1 : 0;
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
export function createEventSearch(query: string): (event: SearchableEvent) => boolean {
  const terms = words(query).filter(term => term !== 'the' && term !== 'at' && term !== 'on').slice(0, 24).map(term => aliases[term] ?? term);
  return event => {
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
