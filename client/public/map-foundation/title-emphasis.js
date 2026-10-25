/* One-word emphasis for cut-out ("ransom note") titles.
 * Every title is the base treatment (white on black) with EXACTLY ONE whole word inverted
 * (black on a paper tile). Which word is a pure function of the seed (the place id), so a place
 * always shows the same title on every surface: places page, Today rail, Outzide map, hero tunnel.
 * Single-word titles: that word is the emphasized word (same as the previous design, where every
 * word was tiled). Words with fewer than 3 letters/digits ("of", "&", "a") are skipped when any
 * longer word exists, so the tile never lands on a connective. */
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const weight = (w) => (w.match(/[\p{L}\p{N}]/gu) || []).length;
export const titleWords = (title) => String(title ?? '').split(/\s+/).filter(Boolean);
/** Index (into titleWords(title)) of the one inverted word, or -1 for an empty title. */
export function pickEmphasisWord(title, seed = title) {
  const words = titleWords(title);
  if (!words.length) return -1;
  let pool = words.map((w, i) => i).filter((i) => weight(words[i]) >= 3);
  if (!pool.length) pool = words.map((w, i) => i).filter((i) => weight(words[i]) >= 1);
  if (!pool.length) pool = words.map((w, i) => i);
  return pool[hash(`${seed}:emphasis`) % pool.length];
}
/** [{text, emphasis}] - exactly one entry has emphasis:true (none for an empty title). */
export function emphasizeTitle(title, seed = title) {
  const words = titleWords(title);
  const at = pickEmphasisWord(title, seed);
  return words.map((text, i) => ({ text, emphasis: i === at }));
}
