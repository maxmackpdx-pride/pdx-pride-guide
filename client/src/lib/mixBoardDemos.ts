import type { BoardPost } from './allBoards';

function rank(key: string) {
  let value = 2166136261;
  for (const letter of key) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
  return value >>> 0;
}

/** Keep real posts in their current order; spread examples across the remaining board. */
export function mixBoardDemos(posts: BoardPost[]): BoardPost[] {
  const real = posts.filter(post => !post.isDemo);
  const categories = new Map<string, BoardPost[]>();
  const groupKey = (post: BoardPost) => `${post.category}:${post.intent}`;
  for (const post of posts) {
    if (!post.isDemo) continue;
    const category = groupKey(post);
    const group = categories.get(category) || [];
    group.push(post);
    categories.set(category, group);
  }
  // Stable identities keep examples from jumping around after a save or feed refresh.
  for (const group of categories.values()) group.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
  const mixed: BoardPost[] = [];
  let previous = real.length ? groupKey(real[real.length - 1]) : undefined;
  while (categories.size) {
    const choices = [...categories.entries()].sort(([a, aa], [b, bb]) => bb.length - aa.length || rank(a) - rank(b));
    const [category, group] = choices.find(([category]) => category !== previous) || choices[0];
    mixed.push(group.shift()!);
    if (!group.length) categories.delete(category);
    previous = category;
  }
  return [...real, ...mixed];
}
