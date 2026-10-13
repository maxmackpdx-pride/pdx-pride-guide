import RoomComposer from "@/components/board/RoomComposer";
import "./Housing.css";
import "@/components/board/UnifiedBoardTools.css";
import UnifiedBoardArt from "@/components/board/UnifiedBoardArt";
import BoardFollowButton from "@/components/BoardFollowButton";
import { housingFilterGroups, housingTagLabel } from "@shared/housingTags";
import { boardFeaturePosts, filterBoardFeatures, canSaveBoardPost } from "@/lib/boardFeatures";
import { HousingComposer } from "@/components/housing/HousingComposer";
import { MizzedComposer } from "@/components/SpottedCardGrid";
import type { LinkableMissedConnectionEvent } from "@/components/MissedConnectionsPanel";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  MapPin,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { SearchInput } from "@/components/ds";
import { BrowseFilters } from "@/components/discovery/EventzBrowse";
import BrowseStatus from "@/components/BrowseStatus";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import { apiRequest, queryClient, parseApiError } from "@/lib/queryClient";
import {
  boardCategories,
  intentLabels,
  parseBoardPostKey,
  type BoardCategory,
  type BoardIntent,
  type BoardPayload,
  type BoardPost,
} from "@/lib/allBoards";
import { mizzedSource } from "@/lib/mizzedSource";
import type { HousingPostView } from "@shared/housing";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import "@/components/discovery/EventzBrowse.css";
import "@/components/discovery/EventzDetail.css";
import "./AllBoards.css";

const BoardPostOverlay = lazy(
  () => import("@/components/board/BoardPostOverlay"),
);
const HousingPostOverlay = lazy(
  () => import("@/components/housing/HousingPostOverlay"),
);
const SpottedDetailModal = lazy(
  () => import("@/components/SpottedDetailModal"),
);
const GigComposer = lazy(() =>
  import("./PrideWork").then((m) => ({ default: m.GigComposer })),
);
const GiftComposer = lazy(() =>
  import("./Gifting").then((m) => ({ default: m.GiftComposer })),
);
const SellzComposer = lazy(() =>
  import("./Sellz").then((m) => ({ default: m.SellzComposer })),
);
type Selection = BoardCategory | "all";
function BoardDetail({
  postKey,
  onClose,
  onRequireAuth,
  onSelect,
}: {
  postKey: string;
  onClose: () => void;
  onRequireAuth: () => void;
  onSelect: (key: string) => void;
}) {
  const selected = parseBoardPostKey(postKey)!;
  const { user } = useAuth();
  const cat = boardCategories.find((c) => c.id === selected.category)!;
  const ownQuery =
    selected.category === "housing" || selected.category === "mizzed";
  const detail = useQuery<HousingPostView | MissedConnectionPost>({
    queryKey: [cat.endpoint, selected.id, user?.id],
    queryFn: () =>
      apiRequest("GET", `${cat.endpoint}/${selected.id}`).then((r) => r.json()),
    enabled: ownQuery,
    retry: 1,
  });
  if (!ownQuery)
    return (
      <BoardPostOverlay
        key={postKey}
        presentation="eventz"
        kind={
          selected.category === "gigz"
            ? "gig"
            : selected.category === "giftz"
              ? "gifting"
              : "sellz"
        }
        postId={selected.id}
        onClose={onClose}
      />
    );
  if (!detail.data)
    return (
      <div className="ab-detail-status" role="status">
        <BrowseStatus
          title={detail.isError ? "This post could not load" : "Loading post…"}
          description={
            detail.isError
              ? "It may have closed, or the connection may be interrupted."
              : "Your board is still here."
          }
          actionLabel={detail.isError ? "Try again" : undefined}
          onAction={detail.isError ? () => void detail.refetch() : undefined}
        />
        <button type="button" className="eb-tool" onClick={onClose}>
          Back to boards
        </button>
      </div>
    );
  if (selected.category === "housing")
    return (
      <HousingPostOverlay
        key={postKey}
        presentation="eventz"
        post={detail.data as HousingPostView}
        userId={user?.id}
        initialDetail
        initialIntent={new URLSearchParams(window.location.search).get("build") === "1" ? "BUILD" : new URLSearchParams(window.location.search).get("join") === "1" ? "JOIN" : new URLSearchParams(window.location.search).get("waitlist") === "1" ? "WAITLIST" : new URLSearchParams(window.location.search).get("chat") === "1" ? "CHAT" : null}
        onClose={onClose}
        onRequireAuth={onRequireAuth}
        onSelectPost={(id) => onSelect(`housing:${id}`)}
        sharePath={(id) => `/boards?board=housing&post=housing:${id}`}
      />
    );
  const p = detail.data as MissedConnectionPost;
  return (
    <SpottedDetailModal
      key={postKey}
      presentation="eventz"
      postId={p.id}
      title={p.title}
      body={p.body}
      place={p.placeName || p.venueHint || ""}
      kindLabel={p.dayOfWeek || "Looking for you"}
      kindColor={cat.color}
      isMine={p.isMine}
      status={p.status}
      isDemo={p.isDemo}
      source={mizzedSource(p)}
      onClose={onClose}
    />
  );
}

export default function Boards() {
  usePageSeo(
    "All Boards | Zaylist",
    "My Hoüz, Gigz, Giftz, Sellz, and Mizzed Connections. Find your people and your next thing.",
  );
  const { user } = useAuth();
  const { toast } = useToast();
  const [path, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const rawSelection = params.get("board");
  const selection: Selection | null =
    rawSelection === "all" || boardCategories.some((c) => c.id === rawSelection)
      ? (rawSelection as Selection)
      : null;
  const query = params.get("q") || "";
  const rawIntent = params.get("intent");
  const intent: BoardIntent | "all" =
    rawIntent && Object.hasOwn(intentLabels, rawIntent)
      ? (rawIntent as BoardIntent)
      : "all";
  const savedOnly = params.get("saved") === "1";
  const mineOnly = params.get("mine") === "1";
  const featureFilters = {itemCategory: params.get("category") || "", condition: params.get("condition") || "", price: params.get("price") || "", remote: params.get("remote") === "1", source: params.get("source") || "", neighborhood: params.get("neighborhood") || "", sort: params.get("sort") || "newest", tags:(params.get("tags") || "").split(",").filter(Boolean)};
  const hasFeatureFilters = Object.entries(featureFilters).some(([key,value])=>key === "sort" ? value !== "newest" : Array.isArray(value) ? value.length > 0 : Boolean(value));
  const postKey = params.get("post");
  const validPost = postKey && parseBoardPostKey(postKey) ? postKey : null;
  const [showAuth, setShowAuth] = useState(false),
    [compose, setCompose] = useState<BoardCategory | null>(null),
    [limit, setLimit] = useState(24);
  const lastOpener = useRef<HTMLButtonElement | null>(null);
  const locallyOpened = useRef(false);
  const selectedCategory = boardCategories.find((c) => c.id === selection);
  const update = (patch: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(patch))
      value ? next.set(key, value) : next.delete(key);
    navigate(`${path}${next.size ? "?" + next.toString() : ""}`, { replace });
  };
  const feeds = useQueries({
    queries: boardCategories.map((cat) => ({
      queryKey: [cat.endpoint, "all-boards", user?.id],
      queryFn: () =>
        apiRequest("GET", cat.endpoint).then(
          (r) => r.json() as Promise<BoardPayload>,
        ),
    })),
  });
  const ownerFeeds = useQueries({queries: boardCategories.map(cat => ({
    queryKey: [cat.endpoint + "/mine", "all-boards", user?.id],
    enabled: !!user && mineOnly,
    queryFn: () => apiRequest("GET", cat.endpoint + "/mine").then(r => r.json() as Promise<BoardPayload>),
  }))});
  const postingStatus = useQuery<{postingOpen:boolean;message:string}>({queryKey:["/api/gifting/status"]});
  const pm = useQuery<{approved:boolean;manager?:{name?:string;company?:string}}>({queryKey:["/api/housing/pm/me"],enabled:!!user});
  const postableEvents = useQuery<LinkableMissedConnectionEvent[]>({queryKey:["/api/missed-connections/postable-events","board"], enabled:!!user && compose === "mizzed", queryFn:()=>apiRequest("GET","/api/missed-connections/postable-events?scope=board").then(r=>r.json())});
  const activeFeeds = mineOnly && user ? ownerFeeds : feeds;
  const allPosts = activeFeeds
    .flatMap((feed, index) =>
      feed.data ? boardFeaturePosts(boardCategories[index].id, feed.data, user?.id, mineOnly) : [],
    )
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id,
    );
  const savedQuery = useQuery<string[]>({
    queryKey: ["/api/boards/saved", user?.id],
    queryFn: () => apiRequest("GET", "/api/boards/saved").then((r) => r.json()),
    enabled: !!user,
  });
  const saved = new Set(user ? [...(savedQuery.data || []), ...allPosts.filter(p=>p.saved).map(p=>p.key)] : []);
  const saveMutation = useMutation({
    mutationFn: ({ post, wasSaved }: { post: BoardPost; wasSaved: boolean }) =>
      apiRequest(
        wasSaved ? "DELETE" : "PUT",
        `/api/boards/${post.category}/posts/${post.id}/save`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/boards/saved"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/housing/mine"] });
      void queryClient.invalidateQueries({
        queryKey: ["/api/sellz/saved/ids"],
      });
    },
    onError: (error) =>
      toast({
        title: "Could not update saved posts",
        description: parseApiError(error, "Please try again."),
        variant: "destructive",
      }),
  });
  const relevant = activeFeeds.filter(
    (_, index) =>
      !selection ||
      selection === "all" ||
      boardCategories[index].id === selection,
  );
  const loading = relevant.some((f) => f.isPending),
    failed = relevant.some((f) => f.isError);
  const categoryPosts = allPosts.filter(
    (p) => !selection || selection === "all" || p.category === selection,
  );
  const intents = Array.from(new Set(categoryPosts.map((p) => p.intent)));
  const results = filterBoardFeatures(categoryPosts.filter(
    (p) =>
      (intent === "all" || p.intent === intent) &&
      (!savedOnly || saved.has(p.key)) &&
      [p.title, p.description, p.area, p.detail, intentLabels[p.intent]]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  ), featureFilters);
  const clear = () => update({ q: null, intent: null, saved: null, mine:null,category:null,condition:null,price:null,remote:null,source:null,neighborhood:null,sort:null,tags:null }, true);
  const select = (board: Selection | null) => {
    update({ board, q: null, intent: null, saved: null, post: null, mine:null,category:null,condition:null,price:null,remote:null,source:null,neighborhood:null,sort:null,tags:null });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const close = () => {
    for(const cat of boardCategories){void queryClient.invalidateQueries({queryKey:[cat.endpoint]});void queryClient.invalidateQueries({queryKey:[cat.endpoint+"/mine"]});}
    void queryClient.invalidateQueries({ queryKey: ["/api/boards/saved"] });
    if (locallyOpened.current) {
      locallyOpened.current = false;
      window.history.back();
    } else update({ post: null,build:null,join:null,waitlist:null,chat:null }, true);
    requestAnimationFrame(() => lastOpener.current?.focus());
  };
  const open = (key: string, opener?: HTMLButtonElement) => {
    lastOpener.current = opener || lastOpener.current;
    locallyOpened.current = true;
    update({ post: key,compose:null,build:null,join:null,waitlist:null,chat:null }, !!validPost);
  };
  const postNew = () => {
    if (!user) {
      update({compose:"1"},true);
      setShowAuth(true);
      return;
    }
    if (selection === "giftz" && postingStatus.data?.postingOpen !== true) {toast({title:postingStatus.data?.message || "Checking Giftz posting availability"});return;}
    if (selection && selection !== "all") setCompose(selection);
  };
  const posted = (id: number) => {
    const category = compose!;
    const endpoint = boardCategories.find(c=>c.id === category)!.endpoint;
    setCompose(null);
    void queryClient.invalidateQueries({queryKey:[endpoint]});
    void queryClient.invalidateQueries({queryKey:[endpoint+"/mine"]});
    locallyOpened.current = false;
    update({compose:null,post:`${category}:${id}`,build:null,join:null,waitlist:null,chat:null},true);
  };
  useEffect(() => {if(params.get("compose") === "1" && selection && selection !== "all") {if(user) setCompose(selection); else setShowAuth(true);}},[search,user?.id]);
  useEffect(() => setLimit(24), [selection, query, intent, savedOnly,mineOnly]);
  return (
    <div
      className="eb-page ab-page pdx-glass-rebind"
      style={
        {
          "--c": selectedCategory?.color || "var(--room-hauz)",
        } as CSSProperties
      }
    >
      <header className="eb-frame ab-header">
        <div>
          <p className="eb-kicker">Portland · Community boards</p>
          <h1>
            ALL <span>BOARDS</span>
            <i aria-hidden="true">↗</i>
          </h1>
          <p>Find your people. Find your next thing.</p>
        </div>
        <Link className="eb-tool" href="/z">
          Z/Lists <ArrowRight size={16} />
        </Link>
      </header>
      <div className="eb-frame">
        {selection === null ? (
          <section className="ab-entry" aria-labelledby="ab-entry-title">
            <div className="ab-section-heading">
              <h2 id="ab-entry-title">What brings you here?</h2>
              <p>Pick a door. There’s a lot on the other side.</p>
            </div>
            <div className="ab-door-grid">
              {boardCategories.map((cat, index) => (
                <button
                  type="button"
                  key={cat.id}
                  className="ab-door pdx-glass-rebind"
                  onClick={() => select(cat.id)}
                  style={{ "--c": cat.color } as CSSProperties}
                  aria-label={`Explore ${cat.label}`}
                >
                  <ResourceCardMotif name={cat.label} category={cat.motif} />
                  <img src={`/brand/family/${cat.logo}`} alt={cat.label} />
                  <span>{cat.description}</span>
                  <small>
                    {feeds[index].isPending
                      ? "Loading…"
                      : feeds[index].isError
                        ? "Open board"
                        : `${allPosts.filter((p) => p.category === cat.id).length} posts`}
                    <ArrowRight size={18} />
                  </small>
                </button>
              ))}
              <button
                type="button"
                className="ab-door ab-door--all pdx-glass-rebind"
                onClick={() => select("all")}
              >
                <LayoutGrid size={36} />
                <strong>View all</strong>
                <span>A little bit of everything.</span>
                <small>
                  Explore all five boards <ArrowRight size={18} />
                </small>
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="ab-controls">
              <div
                className="ab-category-dock"
                role="group"
                aria-label="Board categories"
              >
                {boardCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    className="ab-category pdx-glass-rebind"
                    style={{ "--c": cat.color } as CSSProperties}
                    aria-pressed={selection === cat.id}
                    onClick={() => select(cat.id)}
                  >
                    {cat.id === "mizzed" ? "Mizzed" : cat.label}
                  </button>
                ))}
              </div>
              <div className="eb-search-row">
                <SearchInput
                  aria-label="Search community boards"
                  placeholder={
                    selectedCategory
                      ? `Search ${selectedCategory.label.toLowerCase()}…`
                      : "Search all boards…"
                  }
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    update({ q: e.target.value }, true)
                  }
                  onClear={() => update({ q: null }, true)}
                />
                <BrowseFilters title="Filter board posts" active={intent !== "all" || hasFeatureFilters}>
                  <label>Post type
                    <select value={intent} onChange={e => update({ intent: e.target.value === "all" ? null : e.target.value }, true)}>
                      <option value="all">All types</option>
                      {intents.map(i => <option key={i} value={i}>{intentLabels[i]}</option>)}
                    </select>
                  </label>
                  <label>Neighborhood<input value={featureFilters.neighborhood} onChange={e=>update({neighborhood:e.target.value || null},true)} /></label>
                  <label>Sort<select value={featureFilters.sort} onChange={e=>update({sort:e.target.value},true)}><option value="newest">Newest</option><option value="oldest">Oldest</option>{selection === "sellz" && <><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></>}</select></label>
                  {(selection === "giftz" || selection === "sellz") && <label>Category<select value={featureFilters.itemCategory} onChange={e=>update({category:e.target.value || null},true)}><option value="">All categories</option>{Array.from(new Set(categoryPosts.map(p=>p.itemCategory).filter(Boolean))).map(c=><option key={c} value={c}>{c}</option>)}</select></label>}
                  {selection === "sellz" && <><label>Condition<select value={featureFilters.condition} onChange={e=>update({condition:e.target.value || null},true)}><option value="">All conditions</option>{Array.from(new Set(categoryPosts.map(p=>p.condition).filter(Boolean))).map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Price<select value={featureFilters.price} onChange={e=>update({price:e.target.value || null},true)}><option value="">Any price</option><option value="under25">Under $25</option><option value="25to100">$25–$100</option><option value="over100">Over $100</option></select></label></>}
                  {selection === "housing" && <details className="ab-more-preferences"><summary>More housing preferences</summary><fieldset><legend className="sr-only">My Hoüz tags</legend>{housingFilterGroups().map(group=><details key={group.category.id}><summary>{group.category.label}</summary>{group.tags.map(tag=><label key={tag.id}><input type="checkbox" checked={featureFilters.tags.includes(tag.id)} onChange={e=>update({tags:(e.target.checked?[...featureFilters.tags,tag.id]:featureFilters.tags.filter(id=>id!==tag.id)).join(",") || null},true)} />{housingTagLabel(tag.id)}</label>)}</details>)}</fieldset></details>}
                  {selection === "gigz" && <label><input type="checkbox" checked={featureFilters.remote} onChange={e=>update({remote:e.target.checked?"1":null},true)} />Remote opportunities</label>}
                  {selection === "mizzed" && <label>Where you connected<select value={featureFilters.source} onChange={e=>update({source:e.target.value || null},true)}><option value="">All connections</option><option value="events">Events</option><option value="placez">Placez</option><option value="outzide">OutZide</option><option value="spot">That one spot by the…</option></select></label>}
                </BrowseFilters>
                <button
                  type="button"
                  className="eb-tool ab-saved"
                  aria-label="Show saved posts"
                  aria-pressed={savedOnly}
                  onClick={() =>
                    user
                      ? update({ saved: savedOnly ? null : "1" }, true)
                      : setShowAuth(true)
                  }
                >
                  <Bookmark
                    size={18}
                    fill={savedOnly ? "currentColor" : "none"}
                  />
                  <span>Saved</span>
                </button>
              </div>
              <div className="eb-browse-actions">
                <button type="button" className="eb-tool" aria-pressed={mineOnly} onClick={()=>user?update({mine:mineOnly?null:"1",saved:null},true):setShowAuth(true)} title="Edit your posts and manage active, pending, and completed listings">My posts</button>
                <button type="button" className="eb-tool eb-view-all" aria-pressed={selection === "all"} onClick={() => select("all")}>
                  <LayoutGrid size={18} aria-hidden="true" />View all
                </button>
              </div>
            </div>
            <div className="ab-browse">
              <aside className="ab-sidebar">
                <button
                  type="button"
                  className="ab-back"
                  onClick={() => select(null)}
                >
                  <ArrowLeft size={16} />
                  Choose a category
                </button>
                <section className="eb-panel ab-filter-panel">
                  <h2>{selectedCategory?.label || "All boards"}</h2>
                  <p>
                    {selectedCategory?.prompt ||
                      "Homes, work, good finds, and second chances. All in one place."}
                  </p>
                  <div
                    className="ab-intents"
                    role="group"
                    aria-label="Post type"
                  >
                    <button
                      type="button"
                      aria-pressed={intent === "all"}
                      onClick={() => update({ intent: null }, true)}
                    >
                      All types<span>{categoryPosts.length}</span>
                    </button>
                    {intents.map((i) => (
                      <button
                        type="button"
                        key={i}
                        aria-pressed={intent === i}
                        onClick={() => update({ intent: i }, true)}
                      >
                        {intentLabels[i]}
                        <span>
                          {categoryPosts.filter((p) => p.intent === i).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedCategory ? (
                    <>
                      <button
                        type="button"
                        className="eb-tool ab-post"
                        onClick={postNew}
                      >
                        <Plus size={16} />
                        Post in{" "}
                        {selectedCategory.id === "housing"
                          ? "My Hoüz"
                          : selectedCategory.id === "mizzed"
                            ? "Mizzed"
                            : selectedCategory.label}
                      </button>
                      {selectedCategory.id === "housing" && mineOnly && <button type="button" className="ab-back" onClick={()=>{if(!user){setShowAuth(true);return;}update({type:"PM",compose:"1"});}}>Property managers · Contact Tucker</button>}
                      <BoardFollowButton board={selectedCategory.id === "housing" ? "houz" : selectedCategory.id} />
                      <Link className="ab-back" href={`/map?layer=${selectedCategory.id === "housing" ? "houz" : selectedCategory.id}`}><MapPin size={14} />Explore on Mapz</Link>

                    </>
                  ) : (
                    <p className="ab-note">To post, choose the board where it belongs.</p>
                  )}
                </section>
              </aside>
              <section
                className="ab-results"
                aria-label="Board posts"
                aria-busy={loading}
              >
                <div className="eb-result-head">
                  <p aria-live="polite">
                    {loading
                      ? "Loading boards…"
                      : `${results.length} ${results.length === 1 ? "post" : "posts"}${savedOnly ? " · Saved" : ""}`}
                  </p>
                  {(query || intent !== "all" || savedOnly || mineOnly || hasFeatureFilters) && (
                    <button type="button" className="eb-clear" onClick={clear}>
                      Clear filters
                    </button>
                  )}
                </div>
                {failed && (
                  <BrowseStatus
                    error
                    title="Some posts couldn’t load"
                    description="You can still browse the boards that loaded."
                    actionLabel="Try again"
                    onAction={() =>
                      relevant.forEach((f) => {
                        if (f.isError) void f.refetch();
                      })
                    }
                  />
                )}
                {savedOnly && savedQuery.isError && (
                  <BrowseStatus
                    error
                    title="Saved posts couldn’t load"
                    description="Your bookmarks are still saved. Try again to view them."
                    actionLabel="Try again"
                    onAction={() => void savedQuery.refetch()}
                  />
                )}
                {categoryPosts.some(post=>post.isDemo) && <p className="ab-note" role="note">Demo posts show how Boards works. They are examples, not available listings.</p>}
                <div className="ab-card-grid">
                  {results.slice(0, limit).map((post) => {
                    const cat = boardCategories.find(
                      (c) => c.id === post.category,
                    )!;
                    const isSaved = saved.has(post.key);
                    return (
                      <article
                        key={post.key}
                        className={`ab-card ab-card--${post.intent} pdx-glass-rebind`}
                        style={{ "--c": cat.color } as CSSProperties}
                      >
                        <UnifiedBoardArt post={post} />
                        <div className="ab-card__body">
                          <div className="ab-card__eyebrow">
                            <span>{intentLabels[post.intent]}</span>{post.isDemo && <span className="ab-demo-badge">DEMO · EXAMPLE ONLY</span>}{mineOnly && <span>{post.status}</span>}
                          </div>
                          <h3>
                            <button
                              type="button"
                              onClick={(e) => open(post.key, e.currentTarget)}
                            >
                              {post.title}
                            </button>
                          </h3>
                          <p className="ab-card__detail">
                            {post.detail || post.description}
                          </p>
                          {post.value && (
                            <strong className="ab-card__value">
                              {post.value}
                            </strong>
                          )}
                          {post.area && (
                            <p className="ab-card__location">
                              <MapPin size={13} />
                              {post.area}
                            </p>
                          )}
                          <div className="ab-card__footer">
                            <button
                              type="button"
                              className="ab-save"
                              aria-label={`${isSaved ? "Unsave" : "Save"} ${post.title}`}
                              aria-pressed={isSaved}
                              disabled={
                                saveMutation.isPending || (!isSaved && !canSaveBoardPost(post)) ||
                                (!!user && savedQuery.isPending)
                              }
                              onClick={() =>
                                user
                                  ? saveMutation.mutate({
                                      post,
                                      wasSaved: isSaved,
                                    })
                                  : setShowAuth(true)
                              }
                            >
                              <Bookmark
                                size={16}
                                fill={isSaved ? "currentColor" : "none"}
                              />
                              {isSaved ? "Saved" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="ab-open"
                              aria-label={`Open ${post.title}`}
                              onClick={(e) => open(post.key, e.currentTarget)}
                            >
                              Open <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {!loading &&
                  !(savedOnly && savedQuery.isPending) &&
                  !failed &&
                  !results.length &&
                  !(savedOnly && savedQuery.isError) && (
                    <BrowseStatus
                      title={
                        savedOnly
                          ? "No saved posts here yet"
                          : query || intent !== "all"
                            ? "No posts match your filters"
                            : "Nothing posted here yet"
                      }
                      description={
                        savedOnly
                          ? "Save a card to find it here while it’s available."
                          : query
                            ? `No matches for “${query}”. Try a broader search.`
                            : intent !== "all"
                              ? "Try another type or clear your filters."
                              : "Choose a board to start a post for your community."
                      }
                      actionLabel={
                        query || intent !== "all" || savedOnly || mineOnly || hasFeatureFilters
                          ? "Clear filters"
                          : selectedCategory
                            ? "Start a post"
                            : "Choose a board"
                      }
                      onAction={
                        query || intent !== "all" || savedOnly || mineOnly || hasFeatureFilters
                          ? clear
                          : selectedCategory
                            ? postNew
                            : () => select(null)
                      }
                    />
                  )}
                {results.length > limit && (
                  <button
                    type="button"
                    className="eb-tool ab-more"
                    onClick={() => setLimit((n) => n + 24)}
                  >
                    Show more posts <ArrowRight size={16} />
                  </button>
                )}
              </section>
            </div>
          </>
        )}
      </div>
      <Suspense
        fallback={
          <p className="ab-detail-status" role="status">
            Opening…
          </p>
        }
      >
        {validPost && (
          <BoardDetail
            postKey={validPost}
            onClose={close}
            onRequireAuth={() => setShowAuth(true)}
            onSelect={(key) => open(key)}
          />
        )}
        {compose === "housing" && <RoomComposer id="boards-housing-composer" room="hauz" kicker="New post" title="Post to My Hoüz" onClose={()=>{setCompose(null);update({compose:null},true);}}><div className="ab-housing-composer"><HousingComposer initialType={params.get("type")?.toUpperCase() === "PM" ? "PM" : ({offering:"OFFERING",looking:"LOOKING",forming:"FORMING",managed:"MANAGED"} as const)[intent as "offering"|"looking"|"forming"|"managed"] || null} isPropertyManager={!!pm.data?.approved} managerName={pm.data?.manager?.company || pm.data?.manager?.name || null} viewerDisplayName={user?.displayName ?? null} onClose={()=>{setCompose(null);update({compose:null},true);}} onPosted={posted} /></div></RoomComposer>}
        {compose === "mizzed" && <RoomComposer id="boards-mizzed-composer" room="mizzed" kicker="New connection" title="Post a connection" intro="Anonymous posts. Private replies. Reveal when you’re both ready." onClose={()=>{setCompose(null);update({compose:null},true);}}>{postableEvents.isError ? <BrowseStatus error title="Event choices could not load" description="Try again to link your connection to an event." actionLabel="Try again" onAction={()=>void postableEvents.refetch()} /> : <MizzedComposer linkableEvents={postableEvents.data || []} initialSource={{eventId:params.get("event") || undefined,placeId:params.get("place") || undefined,beachId:params.get("beach") || undefined}} onPosted={()=>{setCompose(null);update({compose:null},true);void queryClient.invalidateQueries({queryKey:["/api/missed-connections"]});}} />}</RoomComposer>}
        {compose === "gigz" && (
          <GigComposer initialType={intent === "available" ? "LOOKING_FOR_WORK" : "POSTING_GIG"} onClose={() => {setCompose(null);update({compose:null},true);}} onPosted={posted} />
        )}
        {compose === "giftz" && (
          <GiftComposer initialType={intent === "iso" ? "ISO" : "GIFT"} initialPickupPreference={intent === "grab" ? "Open Grab" : undefined} onClose={() => {setCompose(null);update({compose:null},true);}} onPosted={posted} />
        )}
        {compose === "sellz" && (
          <SellzComposer onClose={() => {setCompose(null);update({compose:null},true);}} onPosted={posted} />
        )}
      </Suspense>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />
      )}
    </div>
  );
}
