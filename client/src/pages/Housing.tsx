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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import AuthModal from "@/components/AuthModal";
import FeedAdCard from "@/components/ads/FeedAdCard";
import type { AdServePayload } from "@/lib/adTypes";
import {
  HOUSING_FILTERS,
  HOUSING_FILTER_LABEL,
  HOUSING_TYPE_BLURB,
  HOUSING_TYPE_LABEL,
  HOUSING_ACCENT_VAR,
  type HousingBoardResponse,
  type HousingFilter,
  type HousingPostView,
  type HousingType,
} from "@shared/housing";
import { parseHousingTagFilter } from "@shared/housingTags";
import { HousingCard, type HousingCardHandlers } from "@/components/housing/HousingCards";
import { HousingTagFilter } from "@/components/housing/HousingTagFilter";
import { HousingIcon, type HousingIconName } from "@/components/housing/HousingIcon";
import { Btn, CloseSeam, LiveDot, Mono, SectionTitle } from "@/components/housing/HousingPrimitives";
import "./Housing.css";
import { shareCardUrl } from "@shared/shareCards";
import SafetyGuide from "@/components/SafetyGuide";
import { trackProductEvent } from "@/lib/analytics";

/** One neon per step, borrowed from the three peer post types. */
const STEPS: Array<{ title: string; body: string; icon: HousingIconName; accent: string }> = [
  {
    title: "Say what you need",
    body: "One question, four answers. Offering a room, looking for housing, forming a HAÜS, or a managed unit.",
    icon: "add",
    accent: HOUSING_ACCENT_VAR.OFFERING,
  },
  {
    title: "It lands in the feed",
    body: "Housing shows up next to events and the other boards. People find you by scrolling.",
    icon: "boards",
    accent: HOUSING_ACCENT_VAR.LOOKING,
  },
  {
    title: "Tap chat",
    body: "No application, no gate. Interest turns straight into a conversation.",
    icon: "message",
    accent: HOUSING_ACCENT_VAR.FORMING,
  },
];

const SIGNS: Array<{ label: string; cls: string }> = [
  { label: "FOR RENT", cls: "s1" },
  { label: "NEED ROOMMATES", cls: "s2" },
  { label: "FORMING HOUSE", cls: "s3" },
  { label: "LOOKING FOR ROOM", cls: "s4" },
];

const POST_OPTIONS: HousingType[] = ["OFFERING", "LOOKING", "FORMING"];

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
  const [filter, setFilter] = useState<HousingFilter>("ALL");
  const [showAuth, setShowAuth] = useState(false);

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
    const onPop = () =>
      setTagsState(parseHousingTagFilter(new URLSearchParams(window.location.search).get("tags")));
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

  const posts = data?.posts ?? [];
  useEffect(() => {
    if (!isLoading) trackProductEvent("time_to_content", "housing", performance.now() - contentStartedAt.current);
  }, [isLoading]);
  const stats = data?.stats;

  const saveMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/housing/${postId}/save`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Could not save");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/housing"] }),
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
      navigate(`/the-hauz/${post.id}`);
    },
    onSave: (post) => {
      if (!requireAuth()) return;
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
      navigate(`/the-hauz/${post.id}?chat=1`);
    },
    onJoin: (post) => {
      if (!requireAuth()) return;
      navigate(`/the-hauz/${post.id}?join=1`);
    },
    onWaitlist: (post) => {
      if (!requireAuth()) return;
      navigate(`/the-hauz/${post.id}?waitlist=1`);
    },
    onBuildHaus: (post) => {
      if (!requireAuth()) return;
      navigate(`/the-hauz/${post.id}?build=1`);
    },
  };

  const openCompose = (type: HousingType | "PM") => {
    if (!requireAuth()) return;
    navigate(`/the-hauz/new?type=${type.toLowerCase()}`);
  };

  // Only Forming cards span both columns, so every other type is a half slot.
  const oddHalfCards = useMemo(
    () => posts.filter((p: HousingPostView) => p.type !== "FORMING").length % 2 === 1,
    [posts],
  );

  /**
   * The leftover half slot alternates between a served ad (Mr. S, CockBlock,
   * whatever is live) and the house post prompt, so the board keeps asking for
   * supply instead of only ever selling. Decided once per mount so it does not
   * flicker between renders. The prompt is also the fallback whenever no ad is
   * eligible, so the slot is never empty.
   */
  const [slotPrefersAd] = useState(() => Math.random() < 0.5);
  const adQuery = useQuery<{ ads: AdServePayload[] }>({
    queryKey: ["/api/ads/serve", "housing", user?.id ?? "guest"],
    enabled: oddHalfCards && slotPrefersAd,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/ads/serve?surface=feed&tab=boards", { credentials: "include" });
      if (!res.ok) return { ads: [] };
      return res.json();
    },
  });
  const slotAd = slotPrefersAd ? (adQuery.data?.ads?.[0] ?? null) : null;

  const statBlocks = useMemo(
    () => [
      { n: stats?.activePosts ?? 0, l: "Active posts" },
      { n: stats?.roomsOpen ?? 0, l: "Rooms and units" },
      { n: stats?.formingHouses ?? 0, l: "Forming a HAÜS" },
    ],
    [stats],
  );

  return (
    <div className="hz">
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
          </div>
        </div>
      </div>

      <SafetyGuide context="housing" />

      {/* How it works */}
      <div className="hz-band">
        <div className="hz-pad">
          <div className="hz-wrap">
            <SectionTitle kicker="How it works">Under a minute</SectionTitle>
            <div className="hz-steps">
              {STEPS.map((step, i) => (
                <div
                  className="hz-step hz-panel pdx-glass-rebind"
                  key={step.title}
                  style={
                    {
                      "--c": step.accent,
                      "--_c": step.accent,
                      "--hz-accent": step.accent,
                    } as React.CSSProperties
                  }
                >
                  <div className="hz-step__top">
                    <Mono accent>{`0${i + 1}`}</Mono>
                    <HousingIcon name={step.icon} size={16} />
                  </div>
                  <b>{step.title}</b>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pdx-seam" aria-hidden="true" />
      <div className="hz-stats">
        {statBlocks.map((s) => (
          <div key={s.l}>
            <b>{s.n}</b>
            <span>
              <Mono micro>{s.l}</Mono>
            </span>
          </div>
        ))}
      </div>

      {/* Post to the board */}
      <div className="hz-pad hz-pad--tight">
        <div className="hz-wrap">
          <div className="hz-panel">
            <SectionTitle kicker="Post to the board">What are you looking for?</SectionTitle>
            <div className="hz-ask">
              {POST_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => openCompose(t)}
                  style={
                    {
                      "--c": HOUSING_ACCENT_VAR[t],
                      "--hz-accent": HOUSING_ACCENT_VAR[t],
                    } as React.CSSProperties
                  }
                >
                  <b>{HOUSING_TYPE_LABEL[t]}</b>
                  <small>{HOUSING_TYPE_BLURB[t]}</small>
                </button>
              ))}
              <button
                type="button"
                onClick={() => openCompose("PM")}
                style={
                  {
                    "--c": HOUSING_ACCENT_VAR.MANAGED,
                    "--hz-accent": HOUSING_ACCENT_VAR.MANAGED,
                  } as React.CSSProperties
                }
              >
                <b>Managed property</b>
                <small>Whole unit for rent. Apply to become a verified property manager.</small>
              </button>
            </div>
            <p className="hz-ask__note">
              Zaylist never handles rent, deposits, or fees. Money is always arranged directly between
              people.
            </p>
          </div>

          <div className="hz-filter">
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
            <div className="hz-panel hz-empty">Loading the board.</div>
          ) : isError ? (
            <div className="hz-panel hz-empty">
              The board did not load. Try again in a moment.
              <div style={{ marginTop: 12 }}>
                <Btn kind="neon" onClick={() => void refetch()}>
                  Try again
                </Btn>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="hz-panel hz-empty">
              {tags.length
                ? "No posts match all of those tags. Try dropping one."
                : filter === "SAVED"
                  ? "Nothing saved yet. Tap save on a post and it waits here."
                  : "Nothing here yet. Yas, be the first."}
            </div>
          ) : (
            <div className="hz-feed">
              {posts.map((p: HousingPostView) => (
                <HousingCard key={p.id} post={p} h={handlers} />
              ))}
              {/*
                Forming cards span both columns, so when the number of half width
                cards is odd one of them has nothing to pair with. Rather than
                leave a hole or stretch a room listing to look like a Forming
                post, fill the slot with the thing the board actually needs:
                another post. Only rendered when the count is genuinely odd.
              */}
              {oddHalfCards ? (
                slotAd ? (
                  <div className="hz-adslot">
                    <FeedAdCard ad={slotAd} />
                  </div>
                ) : (
                  <button type="button" className="hz-fill" onClick={() => openCompose("OFFERING")}>
                    <Mono accent>Post to the board</Mono>
                    <b>Got a room?</b>
                    <small>
                      A room, a search, or a household you are starting. It takes under a minute and it is free.
                    </small>
                    <span className="hz-fill__cta">
                      <HousingIcon name="add" size={15} />
                      Post it
                    </span>
                  </button>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>

      <CloseSeam line="Post it. Scroll it. Chat." url="zaylist.com/hausing" />

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" /> : null}
    </div>
  );
}
