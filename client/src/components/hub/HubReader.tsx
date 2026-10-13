import { Image, Pencil, RefreshCw, X } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { HUB_PANEL_TABS, parseHubFeedTab, type HubFeedResponse, type HubFeedTab } from "@shared/hubFeed";
import { useAuth } from "@/context/AuthContext";
import { useHubPanel } from "@/context/HubPanelContext";
import { isLocalDemo } from "@/lib/localDemo";
import { getLocalDemoHubFeed } from "@/lib/localDemoHubFeed";
import UserAvatar from "@/components/UserAvatar";
import AuthModal from "@/components/AuthModal";
import HubFeaturedPromotion from "./HubFeaturedPromotion";
import FeedAffiliateAd from "./sections/FeedAffiliateAd";
import FeedAdCard from "@/components/ads/FeedAdCard";
import type { AdServePayload } from "@/lib/adTypes";
import HubFeedCard from "./sections/HubFeedCard";
import HubPost from "./sections/HubPost";

export default function HubReader({ panelOpen = true, onClose, canPostToFeed }: {
  panelOpen?: boolean; onClose?: () => void; canPostToFeed?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const { hasNewActivity, markHubSeen, latestActivityKey } = useHubPanel();
  const demo = isLocalDemo() && !user;
  const [filter, setFilter] = useState<HubFeedTab>("all");
  const [composing, setComposing] = useState(false);
  const [composeType, setComposeType] = useState<"text" | "photo">("text");
  const [showAuth, setShowAuth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const feed = useInfiniteQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed", filter, user?.id ?? "guest"],
    enabled: panelOpen && (!!user || demo),
    initialPageParam: null as string | null,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam }) => {
      if (demo) return getLocalDemoHubFeed(filter);
      const params = new URLSearchParams({ tab: filter, limit: "20" });
      if (pageParam) params.set("cursor", String(pageParam));
      const response = await fetch(`/api/hub/feed?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load your Hub");
      return response.json();
    },
    getNextPageParam: last => last.nextCursor || undefined,
  });
  const options = useQuery<{ canPost: boolean }>({
    queryKey: ["/api/hub/feed/post-options", user?.id ?? "guest"],
    enabled: panelOpen && !!user,
    queryFn: async () => {
      const response = await fetch("/api/hub/feed/post-options", { credentials: "include" });
      if (!response.ok) throw new Error("Could not load posting options");
      return response.json();
    },
  });
  const advertisements = useQuery<{ ads: AdServePayload[] }>({
    queryKey: ["/api/ads/serve", "feed", filter, user?.id],
    enabled: panelOpen && !!user,
    queryFn: async () => {
      const response = await fetch(`/api/ads/serve?surface=feed&tab=${filter}`, { credentials: "include" });
      return response.ok ? response.json() : { ads: [] };
    },
    staleTime: 60_000,
  });
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (feed.data?.pages ?? []).flatMap(page => page.items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id); return true;
    }));
  }, [feed.data]);
  const pinned = feed.data?.pages[0]?.pinned ?? [];
  useEffect(() => {
    const first = feed.data?.pages[0]?.items[0];
    const rendered = first ? `${first.id}|${first.createdAt}` : "";
    if (panelOpen && feed.data && !feed.isFetching && (filter !== "all" || rendered === latestActivityKey)) markHubSeen();
  }, [panelOpen, feed.data, feed.isFetching, markHubSeen, latestActivityKey, filter]);
  const canPost = !!user && (options.data?.canPost ?? canPostToFeed ?? false);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [filter, user?.id]);
  const compose = (type: "text" | "photo") => {
    if (!canPost) { if (!user) setShowAuth(true); return; }
    if (!composing || type === "photo") setComposeType(type);
    setComposing(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };
  const rows = useMemo(() => {
    type Row = { item: (typeof items)[number] } | { ad: AdServePayload } | { brand: "cockblock" | "mrs" };
    const result: Row[] = items.map(item => ({ item }));
    if (!items.length) return result;
    const ads = (advertisements.data?.ads ?? []).filter(ad => ad.format === "feed");
    for (const ad of [...ads].sort((a, b) => (b.scrollDepths?.[0] ?? 50) - (a.scrollDepths?.[0] ?? 50) || b.weight - a.weight)) {
      const index = ad.pinTop ? 0 : Math.min(result.length, Math.max(0, Math.floor(items.length * (ad.scrollDepths?.[0] ?? 40) / 100)));
      result.splice(index, 0, { ad });
    }
    if (!ads.length && (advertisements.isSuccess || advertisements.isError) && user) {
      result.splice(Math.floor(items.length * .8), 0, { brand: "mrs" });
      result.splice(Math.floor(items.length * .4), 0, { brand: "cockblock" });
    }
    return result;
  }, [items, advertisements.data, advertisements.isSuccess, advertisements.isError, user]);
  return <Tabs.Root className="hub-reader" value={filter} onValueChange={value => setFilter(parseHubFeedTab(value))}>
    <header className="hub-reader__header">
      <div className="hub-reader__heading">
        <div><h2>HUB</h2><p>Portland, right now.</p></div>
        <div className="hub-reader__utilities">
          <button className="hub-reader__action pdx-glass-rebind hub-reader__post" type="button" aria-label="Create a Hub post" disabled={!!user && !canPost} onClick={() => compose("text")}><Pencil size={16} aria-hidden /><span>Post</span></button>
          <button type="button" aria-label="Refresh Hub" className="hub-reader__icon" disabled={feed.isFetching || !user && !demo} onClick={() => void feed.refetch()}>
            <RefreshCw size={19} className={feed.isFetching ? "hub-reader__refreshing" : ""} aria-hidden />
          </button>
          <button type="button" aria-label="Close Hub" className="hub-reader__icon" onClick={onClose}><X size={22} aria-hidden /></button>
        </div>
      </div>
      <Tabs.List className="hub-reader__tabs" aria-label="Hub views">
        {HUB_PANEL_TABS.map(tab => <Tabs.Trigger className="hub-reader__tab" value={tab.key} key={tab.key}>{tab.label}</Tabs.Trigger>)}
      </Tabs.List>
      {hasNewActivity && feed.data && !feed.isFetching && <button className="hub-reader__new" onClick={() => void feed.refetch()}>New updates · Refresh Hub</button>}
      {(canPost || demo) && <div className="hub-reader__compose-trigger">
        <UserAvatar photoUrl={user?.photoUrl} avatarChoice={user?.avatarChoice} avatarRing={user?.avatarRing} displayName={user?.displayName || (demo ? "Tucker" : undefined)} username={user?.username} size={36} />
        <button type="button" onClick={() => compose("text")}>Share something with the scene…</button>
        <button type="button" className="hub-reader__icon" aria-label="Share a photo" onClick={() => compose("photo")}><Image size={19} aria-hidden /></button>
      </div>}
    </header>
    <Tabs.Content className="hub-reader__scroll" value={filter} ref={scrollRef} tabIndex={0}>
      {demo && <p className="hub-reader__demo">Demo posts · Sign in to see your Hub.</p>}
      {!user && !demo && <div className="hub-reader__state"><h3>Your scene is here.</h3><p>Sign in to see the Hub, follow your people and places, and share an update.</p><button className="hub-reader__action pdx-glass-rebind" onClick={() => setShowAuth(true)}>Log in / Join</button></div>}
      {!!feed.data?.pages[0]?.unavailableSources?.length && <p className="hub-reader__demo" role="status">{feed.data.pages[0].unavailableSources.join(", ")} updates are temporarily unavailable. The rest of your Hub is here.</p>}
      {composing && <section className="hub-reader__composer" aria-label="Create a Hub post"><HubPost compact embedded initialType={composeType} onPosted={() => { setComposing(false); scrollRef.current?.scrollTo({ top: 0 }); }} onCancel={() => setComposing(false)} /></section>}
      {(authLoading || feed.isPending && (!!user || demo)) && <div className="hub-reader__state" role="status"><p>Loading your Hub…</p><div className="hub-reader__skeleton" /><div className="hub-reader__skeleton" /></div>}
      {feed.isError && !feed.data && <div className="hub-reader__state" role="alert"><h3>Hub didn’t load.</h3><p>Your place is saved. Try again in a moment.</p><button className="hub-reader__action pdx-glass-rebind" onClick={() => void feed.refetch()}>Try again</button></div>}
      {rows.map((row, index) => "item" in row ? <div key={row.item.id}><HubFeedCard item={row.item} compact />{index === Math.min(2, rows.length - 1) && <HubFeaturedPromotion enabled={panelOpen && !!user} />}</div> : "ad" in row ? <div className="hub-reader__ad" key={`ad-${row.ad.id}`}><FeedAdCard ad={row.ad} /></div> : <div className="hub-reader__ad" key={`affiliate-${row.brand}`}><FeedAffiliateAd brand={row.brand} /></div>)}
      {feed.isSuccess && !items.length && <div className="hub-reader__state" role="status"><h3>{filter === "followed_boards" ? "Make this your scene." : filter === "outside" ? "No outside updates yet." : filter === "people" ? "No people updates yet." : "You’re caught up."}</h3><p>{filter === "followed_boards" ? "Follow a person, venue, board, community, or outdoor destination. Their updates will appear here." : filter === "outside" ? "Follow an OUTZ destination to see trail notes, visit plans, and rides here." : "Fresh activity will appear here as people post."}</p>{filter !== "all" && <button className="hub-reader__action pdx-glass-rebind" onClick={() => setFilter("all")}>View all</button>}</div>}
      {pinned.length > 0 && <section aria-label="Scene staples"><div className="hub-reader__section">Scene staples</div>{pinned.map(item => <HubFeedCard key={item.id} item={item} compact />)}</section>}
      {feed.isFetchNextPageError && <div className="hub-reader__state" role="alert"><p>Older updates didn’t load. The posts above are still here.</p><button className="hub-reader__action pdx-glass-rebind" onClick={() => void feed.fetchNextPage()}>Try again</button></div>}
    </Tabs.Content>
    <footer className="hub-reader__footer">
      {feed.hasNextPage ? <button className="hub-reader__action pdx-glass-rebind hub-reader__more" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>{feed.isFetchingNextPage ? "Loading older updates…" : "Load older updates"}</button> : <span>{feed.isSuccess && items.length ? "You’re caught up" : "Your people. Your places. Your Hub."}</span>}
    </footer>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
  </Tabs.Root>;
}
