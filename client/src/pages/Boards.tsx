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
  Heart,
  MapPin,
  Search,
  Users,
  BriefcaseBusiness,
  Gift,
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
  toBoardPosts,
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
const intentIcon = (intent: BoardIntent) =>
  intent === "forming" || intent === "offering"
    ? Users
    : intent === "connection"
      ? Heart
      : intent === "hiring" || intent === "available"
        ? BriefcaseBusiness
        : intent === "giving"
          ? Gift
          : Search;

function PostArt({ post }: { post: BoardPost }) {
  const cat = boardCategories.find((c) => c.id === post.category)!;
  const Icon = intentIcon(post.intent);
  const [broken, setBroken] = useState(false);
  return (
    <div className={`ab-art ab-art--${post.intent}`} aria-hidden="true">
      {post.photo && !broken ? (
        <img
          className="ab-art__photo"
          src={post.photo}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <ResourceCardMotif name={post.title} category={cat.motif} />
          <Icon className="ab-art__symbol" strokeWidth={1.2} />
        </>
      )}
      {post.intent === "forming" && (
        <div className="ab-household">
          <span>{post.householdCount}</span>
          <span>+</span>
          <span>
            <Users size={20} />
          </span>
          <small>
            {post.openSlots
              ? `${post.openSlots} open ${post.openSlots === 1 ? "spot" : "spots"}`
              : "Building a Hoüz"}
          </small>
        </div>
      )}
      {post.intent === "connection" && <span className="ab-art__quote">“</span>}
      <img className="ab-art__brand" src={`/brand/family/${cat.logo}`} alt="" />
    </div>
  );
}

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
      source={mizzedSource(p)}
      onClose={onClose}
    />
  );
}

export default function Boards() {
  usePageSeo(
    "All Boards | Zaylist",
    "Housing, Gigz, Giftz, Sellz, and Mizzed Connections. Find your people and your next thing.",
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
  const allPosts = feeds
    .flatMap((feed, index) =>
      feed.data ? toBoardPosts(boardCategories[index].id, feed.data) : [],
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
  const saved = new Set(user ? savedQuery.data || [] : []);
  const saveMutation = useMutation({
    mutationFn: ({ post, wasSaved }: { post: BoardPost; wasSaved: boolean }) =>
      apiRequest(
        wasSaved ? "DELETE" : "PUT",
        `/api/boards/${post.category}/posts/${post.id}/save`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/boards/saved"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
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
  const relevant = feeds.filter(
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
  const results = categoryPosts.filter(
    (p) =>
      (intent === "all" || p.intent === intent) &&
      (!savedOnly || saved.has(p.key)) &&
      [p.title, p.description, p.area, p.detail, intentLabels[p.intent]]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const clear = () => update({ q: null, intent: null, saved: null }, true);
  const select = (board: Selection | null) => {
    update({ board, q: null, intent: null, saved: null, post: null });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const close = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/boards/saved"] });
    if (locallyOpened.current) {
      locallyOpened.current = false;
      window.history.back();
    } else update({ post: null }, true);
    requestAnimationFrame(() => lastOpener.current?.focus());
  };
  const open = (key: string, opener?: HTMLButtonElement) => {
    lastOpener.current = opener || lastOpener.current;
    locallyOpened.current = true;
    update({ post: key }, !!validPost);
  };
  const postNew = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (selection === "housing") {
      navigate("/the-hauz/new");
      return;
    }
    if (selection === "mizzed") {
      navigate("/mizzed/new");
      return;
    }
    if (selection && selection !== "all") setCompose(selection);
  };
  const posted = (id: number) => {
    const category = compose!;
    setCompose(null);
    void queryClient.invalidateQueries({
      queryKey: [boardCategories.find((c) => c.id === category)!.endpoint],
    });
    open(`${category}:${id}`);
  };
  useEffect(() => setLimit(24), [selection, query, intent, savedOnly]);
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
                <BrowseFilters title="Filter board posts" active={intent !== "all"}>
                  <label>Post type
                    <select value={intent} onChange={e => update({ intent: e.target.value === "all" ? null : e.target.value }, true)}>
                      <option value="all">All types</option>
                      {intents.map(i => <option key={i} value={i}>{intentLabels[i]}</option>)}
                    </select>
                  </label>
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
                  Choose a doorway
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
                          ? "Housing"
                          : selectedCategory.id === "mizzed"
                            ? "Mizzed"
                            : selectedCategory.label}
                      </button>
                      <Link className="ab-back" href={`${selectedCategory.route}?view=tools`}>
                        My posts & board tools <ArrowRight size={14} />
                      </Link>
                    </>
                  ) : (
                    <p className="ab-note">
                      To post, choose the board where it belongs.
                    </p>
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
                  {(query || intent !== "all" || savedOnly) && (
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
                        <PostArt post={post} />
                        <div className="ab-card__body">
                          <div className="ab-card__eyebrow">
                            <span>{intentLabels[post.intent]}</span>
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
                                saveMutation.isPending ||
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
                        query || intent !== "all" || savedOnly
                          ? "Clear filters"
                          : selectedCategory
                            ? "Start a post"
                            : "Choose a board"
                      }
                      onAction={
                        query || intent !== "all" || savedOnly
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
        {compose === "gigz" && (
          <GigComposer onClose={() => setCompose(null)} onPosted={posted} />
        )}
        {compose === "giftz" && (
          <GiftComposer onClose={() => setCompose(null)} onPosted={posted} />
        )}
        {compose === "sellz" && (
          <SellzComposer onClose={() => setCompose(null)} onPosted={posted} />
        )}
      </Suspense>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />
      )}
    </div>
  );
}
