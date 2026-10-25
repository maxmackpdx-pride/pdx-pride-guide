import { toBoardPosts, type BoardCategory, type BoardPayload, type BoardPost, type BoardIntent } from "./allBoards";

export function boardFeaturePosts(category: BoardCategory, payload: BoardPayload, userId?: number, mine = false): BoardPost[] {
 const raw = Array.isArray(payload) ? payload : payload.posts;
 const byId = new Map(raw.map(p => [p.id, p]));
 return toBoardPosts(category, payload, mine).map(post => {
  const p = byId.get(post.id) as unknown as Record<string, any>;
  return {...post, motifChoice: typeof p.motifChoice === "string" ? p.motifChoice : undefined, isDemo: Boolean(p.isDemo), status: p.status, saved: Boolean(p.saved), tags: Array.isArray(p.tags) ? p.tags : [],
   isMine: Boolean(p.isMine || (userId && (p.userId === userId || p.author?.userId === userId))),
   itemCategory: typeof p.category === "string" ? p.category : undefined, condition: p.condition,
   priceCents: p.priceCents, isRemote: Boolean(p.isRemote),
   source: category === "outz" ? post.source : p.eventId ? "events" : p.placeId ? "placez" : p.beachId ? "outzide" : "spot"};
 }).filter(post => !mine || post.isMine);
}

export function filterBoardFeatures(posts: BoardPost[], filters: {itemCategory?: string; condition?: string; price?: string; remote?: boolean; source?: string; neighborhood?: string; sort?: string; tags?: string[]}): BoardPost[] {
 return posts.filter(p => (!filters.itemCategory || p.itemCategory === filters.itemCategory)
  && (!filters.condition || p.condition === filters.condition)
  && (!filters.tags?.length || filters.tags.every(tag=>p.tags?.includes(tag)))
  && (!filters.remote || p.isRemote)
  && (!filters.source || p.source === filters.source)
  && (!filters.neighborhood || p.area.toLowerCase().includes(filters.neighborhood.toLowerCase()))
  && (!filters.price || (p.priceCents !== undefined && (filters.price === "under25" ? p.priceCents < 2500 : filters.price === "25to100" ? p.priceCents >= 2500 && p.priceCents <= 10000 : p.priceCents > 10000))))
  .sort((a,b) => (filters.sort === "price-low" || filters.sort === "price-high" ? Number(a.isDemo) - Number(b.isDemo) : 0) || (filters.sort === "price-low" ? (a.priceCents ?? 0)-(b.priceCents ?? 0) : filters.sort === "price-high" ? (b.priceCents ?? 0)-(a.priceCents ?? 0) : filters.sort === "oldest" ? Date.parse(a.createdAt)-Date.parse(b.createdAt) : Date.parse(b.createdAt)-Date.parse(a.createdAt)));
}

export function canSaveBoardPost(post: BoardPost): boolean {
 if(post.isDemo)return false;
 const visible: Record<BoardCategory,string[]> = {housing:["ACTIVE","FILLED"],gigz:["LIVE"],giftz:["OPEN","THREE_INTERESTED","POSTER_CHOOSING","PICKUP_PENDING","REOPENED","LOOKING","OFFER_PENDING"],sellz:["ACTIVE","RESERVED"],mizzed:["ACTIVE"],outz:[]};
 return visible[post.category].includes(post.status || "");
}

/** Only controls available in the selected room may constrain its inventory. */
export function readBoardFeatureFilters(params: URLSearchParams, selection: BoardCategory | "all") {
 const read=(key:string)=>params.get(key)?.trim() || "";
 const price=read("price"),source=read("source"),sort=read("sort");
 return {itemCategory:selection==="giftz"||selection==="sellz"?read("category"):"",
  condition:selection==="sellz"?read("condition"):"",
  price:selection==="sellz"&&["under25","25to100","over100"].includes(price)?price:"",
  remote:selection==="gigz"&&params.get("remote")==="1",
  source:selection==="mizzed"&&["events","placez","outzide","spot"].includes(source)?source:"",
  neighborhood:read("neighborhood"),
  sort:["newest","oldest"].includes(sort)||selection==="sellz"&&["price-low","price-high"].includes(sort)?sort:"newest",
  tags:selection==="housing"?[...new Set(read("tags").split(",").map(tag=>tag.trim()).filter(Boolean))]:[]};
}
export function boardIntentForSelection(raw:string|null, selection:BoardCategory|"all"):BoardIntent|"all" {
 const intents:Record<BoardCategory,BoardIntent[]>={housing:["offering","looking","forming","managed"],gigz:["hiring","available"],giftz:["giving","iso","grab"],sellz:["selling"],mizzed:["connection"],outz:["buddy","ride","missed"]};
 const allowed=selection==="all"?Object.values(intents).flat():intents[selection];
 return allowed.includes(raw as BoardIntent)?raw as BoardIntent:"all";
}
