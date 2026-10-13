import { toBoardPosts, type BoardCategory, type BoardPayload, type BoardPost } from "./allBoards";

export function boardFeaturePosts(category: BoardCategory, payload: BoardPayload, userId?: number, mine = false): BoardPost[] {
 const raw = Array.isArray(payload) ? payload : payload.posts;
 const byId = new Map(raw.map(p => [p.id, p]));
 return toBoardPosts(category, payload, mine).map(post => {
  const p = byId.get(post.id) as unknown as Record<string, any>;
  return {...post, isDemo: Boolean(p.isDemo), status: p.status, saved: Boolean(p.saved),
   isMine: Boolean(p.isMine || (userId && (p.userId === userId || p.author?.id === userId))),
   itemCategory: typeof p.category === "string" ? p.category : undefined, condition: p.condition,
   priceCents: p.priceCents, isRemote: Boolean(p.isRemote),
   source: p.eventId ? "events" : p.placeId ? "placez" : p.beachId ? "outzide" : "spot"};
 }).filter(post => !mine || post.isMine);
}

export function filterBoardFeatures(posts: BoardPost[], filters: {itemCategory?: string; condition?: string; price?: string; remote?: boolean; source?: string; neighborhood?: string; sort?: string}): BoardPost[] {
 return posts.filter(p => (!filters.itemCategory || p.itemCategory === filters.itemCategory)
  && (!filters.condition || p.condition === filters.condition)
  && (!filters.remote || p.isRemote)
  && (!filters.source || p.source === filters.source)
  && (!filters.neighborhood || p.area.toLowerCase().includes(filters.neighborhood.toLowerCase()))
  && (!filters.price || (p.priceCents !== undefined && (filters.price === "under25" ? p.priceCents < 2500 : filters.price === "25to100" ? p.priceCents >= 2500 && p.priceCents <= 10000 : p.priceCents > 10000))))
  .sort((a,b) => Number(a.isDemo) - Number(b.isDemo) || (filters.sort === "price-low" ? (a.priceCents ?? 0)-(b.priceCents ?? 0) : filters.sort === "price-high" ? (b.priceCents ?? 0)-(a.priceCents ?? 0) : filters.sort === "oldest" ? Date.parse(a.createdAt)-Date.parse(b.createdAt) : Date.parse(b.createdAt)-Date.parse(a.createdAt)));
}
