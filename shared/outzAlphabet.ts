export const OUTZ_ALPHABET_RANGES = ['All', 'A–E', 'F–J', 'K–O', 'P–T', 'U–Z', '#'] as const;
export type OutzAlphabetRange = typeof OUTZ_ALPHABET_RANGES[number];
export function outzAlphabetMatches(name: string, range: OutzAlphabetRange): boolean {
  if (range === 'All') return true;
  const first = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/^[^\p{L}\p{N}]+/u, '').charAt(0).toUpperCase();
  if (range === '#') return !/^[A-Z]$/.test(first);
  return first >= range.charAt(0) && first <= range.charAt(2);
}
