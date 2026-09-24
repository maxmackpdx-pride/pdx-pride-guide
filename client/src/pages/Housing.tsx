import BrowseToolbar from "@/components/BrowseToolbar";
import BrowseStatus from "@/components/BrowseStatus";
import SectionBreadcrumb from "@/components/SectionBreadcrumb";
import { SearchInput } from "@/components/ds";
/**
 * HAUSING - the Housing board.
 *
 * A trusted community board where queer Portland finds rooms, roommates, and
 * households. Not a rental marketplace: people post in their own words, discovery
 * happens in the feed, and conversations do the matching.
 *
 * Spec: docs/HAUS_HOUSING_SPEC_v0.2.md
 * Design: docs/design-handoff-hausing/
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  applyHousingSavedToggle,
  beginInFlight,
  endInFlight,
  HOUSING_KEY,
  restoreQueries,
  snapshotQueries,
} from "@/lib/optimisticCache";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import AuthModal from "@/components/AuthModal";
import HousingPostOverlay from "@/components/housing/HousingPostOverlay";
import {
  HOUSING_FILTERS,
  HOUSING_FILTER_LABEL,
  HOUSING_ACCENT_VAR,
  type HousingBoardResponse,
  type HousingFilter,
  type HousingPostView,
  type HousingRequestKind,
  type HousingType,
} from "@shared/housing";
import { parseHousingTagFilter } from "@shared/housingTags";
import { HousingCard, type HousingCardHandlers } from "@/components/housing/HousingCards";
import { GlowEffect } from "@/components/ui/glow-effect";
import { HousingTagFilter } from "@/components/housing/HousingTagFilter";
import { Btn, CloseSeam, LiveDot, Mono, SectionTitle } from "@/components/housing/HousingPrimitives";
import "./Housing.css";
import { shareCardUrl } from "@shared/shareCards";
import SafetyGuide from "@/components/SafetyGuide";
import { trackProductEvent } from "@/lib/analytics";

const SIGNS: Array<{ label: string; cls: string }> = [
  { label: "FOR RENT", cls: "s1" },
  { label: "NEED ROOMMATES", cls: "s2" },
  { label: "FORMING HOUSE", cls: "s3" },
  { label: "LOOKING FOR ROOM", cls: "s4" },
];

const RAILS: Array<{ type: HousingType; eyebrow: string; title: string; description: string; action: string }> = [
  { type: "OFFERING", eyebrow: "ROOMS WITH PEOPLE IN THEM", title: "Rooms offered", description: "Meet the household before you message.", action: "Post a room" },
  { type: "LOOKING", eyebrow: "THE PEOPLE", title: "Looking for housing", description: "Find someone whose next place could be yours.", action: "Post your search" },
  { type: "FORMING", eyebrow: "BUILD IT TOGETHER", title: "Forming a Haüz", description: "Find your people, then find the place.", action: "Start a Haüz" },
  { type: "MANAGED", eyebrow: "VERIFIED LISTINGS", title: "Managed properties", description: "Explore a whole place and its real listing.", action: "List a property" },
];

function HousingRail({ type, eyebrow, title, description, action, posts, handlers, onCompose }: {
  type: HousingType; eyebrow: string; title: string; description: string; action: string;
  posts: HousingPostView[]; handlers: HousingCardHandlers; onCompose: (type: HousingType | "PM") => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  return (
    <section className="hz-board-section" aria-label={title} style={{ "--hz-accent": HOUSING_ACCENT_VAR[type] } as React.CSSProperties}>
      <div className="hz-board-section__head">
        <div><Mono micro>{eyebrow}</Mono><h3>{title}<span>.</span></h3><p>{description}</p></div>
        <button type="button" onClick={() => onCompose(type === "MANAGED" ? "PM" : type)}>{action} ↗</button>
      </div>
      {posts.length ? (
        <>
          <div className="hz-board-rail" dir="rtl" ref={track}>
            {posts.map(post => <div className="hz-board-rail__item" dir="ltr" key={post.id} style={{ "--hz-edge-color": HOUSING_ACCENT_VAR[post.type] } as React.CSSProperties}>
              <GlowEffect
                colors={[HOUSING_ACCENT_VAR[post.type], `color-mix(in srgb, ${HOUSING_ACCENT_VAR[post.type]} 88%, white)`]}
                mode="static"
                blur="medium"
                className="hz-board-rail__glow"
              />
              <HousingCard post={post} h={handlers} />
            </div>)}
          </div>
          {posts.length > 1 && <div className="hz-board-rail__controls">
            <span>SWIPE TO EXPLORE</span>
            <button type="button" aria-label={`Previous ${title}`} onClick={() => track.current?.scrollBy({ left: 380, behavior: "smooth" })}>→</button>
            <button type="button" aria-label={`Next ${title}`} onClick={() => track.current?.scrollBy({ left: -380, behavior: "smooth" })}>←</button>
          </div>}
        </>
      ) : <p className="hz-board-section__empty">No {title.toLowerCase()} yet. Start this rail with a post.</p>}
    </section>
  );
}

export default function Housing() {
  const contentStartedAt = useRef(performance.now());
  usePageSeo(
    "THE HAÜZ · Housing board",
    "Rooms, roommates, and people building a household together in queer Portland. A community board, not a listings site.",
    { image: shareCardUrl("housing"), imageAlt: "THE HAÜZ - housing board on Zaylist" },
  );

  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const savePendingRef = useRef(new Set<number>());
  const [savePendingIds, setSavePendingIds] = useState<Set<number>>(() => new Set());
  const [filter, setFilter] = useState<HousingFilter>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter")?.toUpperCase() === "SAVED") return "SAVED";
    const type = params.get("type")?.toUpperCase();
    return type && HOUSING_FILTERS.includes(type as HousingFilter)
      ? type as HousingFilter
      : "ALL";
  });
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(() => {
    const id = Number(new URLSearchParams(window.location.search).get("post"));
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [selectedIntent, setSelectedIntent] = useState<HousingRequestKind | "BUILD" | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("build") === "1") return "BUILD";
    if (params.get("join") === "1") return "JOIN";
    if (params.get("waitlist") === "1") return "WAITLIST";
    if (params.get("chat") === "1") return "CHAT";
    return null;
  });
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) params.set("q", searchQuery.trim()); else params.delete("q");
    if (filter === "ALL") params.delete("type"); else if (filter !== "SAVED") params.set("type", filter);
    if (filter === "SAVED") params.set("filter", "SAVED"); else params.delete("filter");
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [filter, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedPostId) params.set("post", String(selectedPostId)); else params.delete("post");
    for (const key of ["chat", "join", "waitlist", "build"]) params.delete(key);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [selectedPostId]);

  /*
   * Tag filters live in the URL, not in component state. Opening a listing and
   * coming back is a browser navigation, and anything held in state here would
   * be gone by the time they land. The URL survives back, refresh, and a link
   * someone pastes to a friend.
   */
  const [tags, setTagsState] = useState<string[]>(() =>
    parseHousingTagFilter(new URLSearchParams(window.location.search).get("tags")),
  );

  const setTags = useCallback((next: string[]) => {
    setTagsState(next);
    const params = new URLSearchParams(window.location.search);
    if (next.length) params.set("tags", next.join(","));
    else params.delete("tags");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, []);

  // Back and forward move through filter states, so follow the URL when they do.
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setTagsState(parseHousingTagFilter(params.get("tags")));
      setSearchQuery(params.get("q") || "");
      const selected = Number(params.get("post"));
      setSelectedPostId(Number.isInteger(selected) && selected > 0 ? selected : null);
      const type = params.get("type")?.toUpperCase() as HousingFilter;
      setFilter(params.get("filter") === "SAVED" ? "SAVED" : HOUSING_FILTERS.includes(type) ? type : "ALL");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery<HousingBoardResponse>({
    queryKey: ["/api/housing", filter, tags.join(",")],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === "SAVED") params.set("filter", "SAVED");
      else if (filter !== "ALL") params.set("type", filter);
      if (tags.length) params.set("tags", tags.join(","));
      const res = await fetch(`/api/housing?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Could not load the board");
      return res.json();
    },
  });

  const posts = (data?.posts ?? []).filter(post => !searchQuery.trim() || [post.displayName, post.headline].join(" ").toLowerCase().includes(searchQuery.trim().toLowerCase()));
  useEffect(() => {
    if (!isLoading) trackProductEvent("time_to_content", "housing", performance.now() - contentStartedAt.current);
  }, [isLoading]);
  const boardEmpty = !isLoading && !isError && posts.length === 0;
  const showDemoSeed = boardEmpty && filter === "ALL" && tags.length === 0 && !searchQuery.trim();
  const { data: demoBoard } = useQuery<HousingBoardResponse>({
    queryKey: ["/api/housing", "demo"],
    enabled: showDemoSeed,
    queryFn: async () => {
      const res = await fetch("/api/housing?demo=1", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load demo posts");
      return res.json();
    },
  });
  const demoPosts = demoBoard?.posts ?? [];
  const displayedPosts = posts.length ? posts : showDemoSeed ? demoPosts : [];
  const selectedInFeed = displayedPosts.find(post => post.id === selectedPostId);
  const selectedQuery = useQuery<HousingPostView>({
    queryKey: ["/api/housing", selectedPostId],
    enabled: selectedPostId !== null && !selectedInFeed,
    queryFn: async () => {
      const res = await fetch(`/api/housing/${selectedPostId}`, { credentials: "include" });
      if (!res.ok) throw new Error("This Haüz post could not load");
      return res.json();
    },
  });
  const selectedPost = selectedInFeed ?? selectedQuery.data;

  const saveMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/housing/${postId}/save`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Could not save");
      return res.json();
    },
    onMutate: async (postId: number) => {
      const snap = await snapshotQueries(queryClient, HOUSING_KEY);
      applyHousingSavedToggle(queryClient, postId);
      return { snap };
    },
    onError: (_err, _postId, ctx) => {
      restoreQueries(queryClient, ctx?.snap);
    },
    onSettled: (_data, _err, postId) => {
      endInFlight(savePendingRef.current, postId);
      setSavePendingIds(new Set(savePendingRef.current));
      queryClient.invalidateQueries({ queryKey: [...HOUSING_KEY] });
    },
  });

  const requireAuth = (): boolean => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  const handlers: HousingCardHandlers = {
    activeTags: tags,
    onOpen: (post) => {
      // Opening a card that shows an update chip counts as seeing it.
      if (post.saved && post.lastChangeLabel && user) {
        fetch(`/api/housing/${post.id}/seen`, { method: "POST", credentials: "include" }).catch(
          () => undefined,
        );
        queryClient.setQueriesData<HousingBoardResponse>({ queryKey: ["/api/housing"] }, (old) => {
          if (!old || !Array.isArray(old.posts)) return old;
          return {
            ...old,
            posts: old.posts.map((p: HousingPostView) =>
              p.id === post.id ? { ...p, lastChangeLabel: null } : p,
            ),
          };
        });
      }
      setSelectedIntent(null);
      setSelectedPostId(post.id);
    },
    onSave: (post) => {
      if (!requireAuth()) return;
      if (!beginInFlight(savePendingRef.current, post.id)) return;
      setSavePendingIds(new Set(savePendingRef.current));
      saveMutation.mutate(post.id);
    },
    onShare: (post) => {
      const url = `${window.location.origin}/the-hauz/${post.id}`;
      if (navigator.share) {
        navigator.share({ title: post.displayName || post.headline, url }).catch(() => undefined);
        return;
      }
      navigator.clipboard?.writeText(url);
      toast({ title: "Listing link copied" });
    },
    // Asking to chat is asking in, and nothing opens until the other side accepts.
    onChat: (post) => {
      if (!requireAuth()) return;
      setSelectedIntent("CHAT"); setSelectedPostId(post.id);
    },
    onJoin: (post) => {
      if (!requireAuth()) return;
      setSelectedIntent("JOIN"); setSelectedPostId(post.id);
    },
    onWaitlist: (post) => {
      if (!requireAuth()) return;
      setSelectedIntent("WAITLIST"); setSelectedPostId(post.id);
    },
    onBuildHaus: (post) => {
      if (!requireAuth()) return;
      setSelectedIntent("BUILD"); setSelectedPostId(post.id);
    },
    savePendingIds,
  };

  const openCompose = (type: HousingType | "PM") => {
    if (!requireAuth()) return;
    navigate(`/the-hauz/new?type=${type.toLowerCase()}`);
  };

  return (
    <div className="hz pdx-glass-rebind">
      <span className="hz-wash" aria-hidden="true" />
      <span className="hz-grain" aria-hidden="true" />

      <div className="hz-run">
        <LiveDot />
        <Mono accent>THE HAÜZ · Housing board</Mono>
      </div>
      <div className="pdx-seam hz-seam--head" aria-hidden="true" />

      {/* Hero */}
      <div className="hz-hero">
        <span className="hz-hero__fx" aria-hidden="true" />
        <div className="hz-signs" aria-hidden="true">
          {SIGNS.map(({ label, cls }) => (
            <svg
              key={cls}
              className={`hz-sign hz-sign--${cls}`}
              viewBox="0 0 240 92"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinejoin="round"
            >
              <rect x="6" y="6" width="228" height="80" rx="7" />
              <path d="M6 26h228" />
              <text
                x="120"
                y="66"
                textAnchor="middle"
                fill="currentColor"
                stroke="none"
                fontFamily="var(--font-display)"
                fontWeight="900"
                fontSize={label.length > 12 ? 26 : 34}
                letterSpacing="1.5"
              >
                {label}
              </text>
            </svg>
          ))}
        </div>
        <span className="hz-hero__dots" aria-hidden="true" />
        <span className="hz-hero__scrim" aria-hidden="true" />
        <div className="hz-pad">
          <div className="hz-wrap">
            <SectionBreadcrumb section="The Haüz" />
            <h1 className="hz-title hz-hero__title hz-hero__title--brand">
              <img className="hz-hero__brand-logo" src="/brand/family/the-hauz.svg" alt="THE HAÜZ" />
              <span className="hz-beta">Beta</span>
            </h1>
            <p className="hz-hero__lede">
              Rooms, roommates, and people building a household together. It is a community board, not a
              listings site. No fees, no applications, no money through Zaylist. You post, you scroll, you
              chat.
            </p>
            <div className="hz-hero__mantra">
              <Mono>Find a room · find people · find a home</Mono>
            </div>
            <a className="hz-chip hz-chip--btn" href="#housing-listings" style={{ marginTop: 16 }}>Browse the listings ↓</a>
            <button type="button" className="hz-chip hz-chip--btn hz-board-post" onClick={() => { if (requireAuth()) navigate("/the-hauz/new"); }}>Post to The Haüz ↗</button>
          </div>
        </div>
      </div>

      <div className="hz-pad hz-pad--tight">
        <div className="hz-wrap">
          <BrowseToolbar label="Search and filter The Haüz">
          <SearchInput id="housing-search" label="Search The Haüz" aria-label="Search The Haüz" placeholder="Search household names and headlines" value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} onClear={() => setSearchQuery("")} />
          <div className="hz-filter" id="housing-listings" tabIndex={-1} style={{ scrollMarginTop: "calc(var(--site-header-height, 0px) + 16px)" }}>
            <Mono micro>Show me</Mono>
            <div className="hz-tabs" role="tablist">
              {HOUSING_FILTERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  className="hz-tab"
                  aria-selected={filter === k}
                  onClick={() => setFilter(k)}
                >
                  {HOUSING_FILTER_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <HousingTagFilter applied={tags} onApply={setTags} />
          {(searchQuery || tags.length > 0 || filter !== "ALL") && <button type="button" className="events-clear-filters" onClick={() => { setSearchQuery(""); setTags([]); setFilter("ALL"); }}>Clear filters</button>}
          </BrowseToolbar>
        </div>
      </div>

      {/* Feed */}
      <div className="hz-pad">
        <div className="hz-wrap">
          <div className="hz-feedhead">
            <SectionTitle
              kicker={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
              right={<Mono micro>Newest first</Mono>}
            >
              {filter === "SAVED" ? "Saved for later" : "Active on the board"}
            </SectionTitle>
          </div>

          {isLoading ? (
            <BoardFeedSkeleton label="Loading the board" shape="housing" count={4} />
          ) : isError ? (
            <BrowseStatus error title="The Haüz couldn’t load" description="Your filters are still here. Try loading the board again." onAction={() => void refetch()} />
          ) : posts.length === 0 ? (
            <div>
              <div className="browse-status" role="status">
                {searchQuery.trim() ? "No households match your search. Try another name or clear your filters." : tags.length
                  ? "No posts match all of those tags. Try dropping one."
                  : filter === "SAVED"
                    ? "Nothing saved yet. Tap save on a post and it waits here."
                    : "Nothing here yet. Be the first, or look at the DEMO posts from @hausing_demo."}
                {filter !== "SAVED" ? (
                  <div style={{ marginTop: 12 }}>
                    <Btn kind="solid" onClick={() => {
                      if (!requireAuth()) return;
                      navigate("/the-hauz/new");
                    }}>
                      Post to THE HAÜZ
                    </Btn>
                  </div>
                ) : null}
              </div>
              {RAILS.filter(rail => filter === "ALL" || filter === "SAVED" || filter === rail.type).map(rail => <HousingRail key={rail.type} {...rail} posts={displayedPosts.filter(post => post.type === rail.type)} handlers={handlers} onCompose={openCompose} />)}
            </div>
          ) : (
            <div className="hz-board-rails">
              {RAILS.filter(rail => filter === "ALL" || filter === "SAVED" || filter === rail.type).map(rail => <HousingRail key={rail.type} {...rail} posts={displayedPosts.filter(post => post.type === rail.type)} handlers={handlers} onCompose={openCompose} />)}
            </div>
          )}
        </div>
      </div>

      <SafetyGuide context="housing" />
      <CloseSeam line="Post it. Scroll it. Chat." url="zaylist.com/the-hauz" />

      {selectedPostId !== null && selectedQuery.isError && !selectedInFeed && <div className="hz-board-link-error" role="alert">This post is unavailable. <button type="button" onClick={() => { setSelectedPostId(null); setSelectedIntent(null); }}>Back to the board</button></div>}
      {selectedPost && <HousingPostOverlay key={selectedPost.id} post={selectedPost} userId={user?.id} initialDetail initialIntent={selectedIntent} sharePath={postId => `/the-hauz/${postId}`} onClose={() => { setSelectedPostId(null); setSelectedIntent(null); }} onRequireAuth={() => setShowAuth(true)} onSelectPost={postId => { setSelectedIntent(null); setSelectedPostId(postId); }} />}

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
    </div>
  );
}
