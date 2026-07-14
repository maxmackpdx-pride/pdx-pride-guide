import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BoardLoadingState from "@/components/BoardLoadingState";
import {
  HUB_FEED_TABS,
  parseHubFeedTab,
  type HubFeedResponse,
  type HubFeedTab,
} from "@shared/hubFeed";
import type { EventListing } from "@shared/multiDayEvents";
import FeaturedEventAd from "./FeaturedEventAd";
import FeedAffiliateAd from "./FeedAffiliateAd";
import HubFeedCard from "./HubFeedCard";
import HubPost from "./HubPost";

// ── Featured event ads ──────────────────────────────────────────────────────
// Add an entry to FEATURED (title matcher + slideshow) and the matching event
// auto-features at the top of the feed. Rules:
//  • The `anchor` (Yes Coach / Stank) shows every other time, the in-between
//    slots pick a RANDOM one of the other eligible featured events.
//  • Each ad hides for the rest of the Pacific day when dismissed (X), and
//    disappears for good once its event has ended (auto-expire).
// See docs/featured-event-card.md for the full template.
type FeaturedConfig = {
  key: string;                       // unique id (drives dismiss key + slides folder)
  anchor?: boolean;                  // the every-other-slot event (Yes Coach)
  match: (title: string) => boolean; // how to find the event by title
  slides: string[];                  // extra slideshow frames after the poster
};

const STANK_SLIDES = Array.from({ length: 11 }, (_, i) =>
  `/posters/stank-slides/slide-${String(i + 1).padStart(2, "0")}.jpg`,
);

const FEATURED: FeaturedConfig[] = [
  {
    key: "stank",
    anchor: true,
    // "stank" + "yes coach" in any order, tolerating any separators.
    match: (t) => /stank\W*yes\W*coach|yes\W*coach\W*stank/i.test(t) || /\bstank\b/i.test(t),
    slides: STANK_SLIDES,
  },
  // Add more featured events here — they rotate through the non-anchor slots.
];

const dismissKeyFor = (key: string) => `hub-promo-${key}-dismissed-day`;
const ROTATION_KEY = "hub-featured-rotation";

function pacificDayKey(ms = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function withPacificTz(raw: string): string {
  return /[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}-07:00`;
}

function eventEndMs(e: EventListing): number {
  const start = new Date(withPacificTz(e.dateStart)).getTime();
  if (e.dateEnd) {
    let end = new Date(withPacificTz(e.dateEnd)).getTime();
    if (end < start) end += 86_400_000; // end time crosses midnight (e.g. 9pm–2am)
    return end;
  }
  return start + 6 * 3_600_000; // no end time: assume a ~6h run
}

function emptyCopy(tab: HubFeedTab): string {
  switch (tab) {
    case "all":
      return "No new scene activity yet. Pinned boards and highlights stay below.";
    case "events":
      return "No new event listings or host updates yet.";
    case "posts":
      return "No new scene posts or beach check-ins yet. The beach boards are pinned below.";
    case "rsvps":
      return "No new RSVPs yet. Be the first to say you are going.";
    case "boards":
      return "No new board posts yet. The Pride Werk highlight stays below.";
    default:
      return "Nothing new in this feed yet.";
  }
}

type Props = {
  canPostToFeed?: boolean;
};

type PostOptions = {
  canPost: boolean;
  hostedEvents: Array<{ id: number; title: string; venueName: string; dayOfWeek?: string | null }>;
};

export default function HubFeed({ canPostToFeed = false }: Props) {
  const [filter, setFilter] = useState<HubFeedTab>("all");
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);

  const today = pacificDayKey();
  const isDismissedToday = (key: string) => {
    try { return window.localStorage.getItem(dismissKeyFor(key)) === today; } catch { return false; }
  };
  // Only fetch events if at least one featured ad could still show today.
  const anyFeaturedPossible = FEATURED.some((f) => !isDismissedToday(f.key));

  // Server is source of truth: admins, event hosts, venue owners, approved promoters.
  const postOptionsQuery = useQuery<PostOptions>({
    queryKey: ["/api/hub/feed/post-options"],
    queryFn: async () => {
      const r = await fetch("/api/hub/feed/post-options", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load post options");
      return r.json();
    },
  });
  const canPost = postOptionsQuery.data?.canPost ?? canPostToFeed;

  const feedQuery = useQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ tab: filter, limit: "30" });
      const r = await fetch(`/api/hub/feed?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load feed");
      return r.json();
    },
  });

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events", { credentials: "include" }).then((r) => r.json()),
    staleTime: 300_000,
    enabled: anyFeaturedPossible,
  });

  // Eligible = has a matching event, not dismissed today, event hasn't ended.
  const eligibleFeatured = useMemo(() => {
    const now = Date.now();
    return FEATURED
      .map((f) => ({ ...f, event: events.find((e) => f.match(e.title || "")) }))
      .filter((f) => f.event && !isDismissedToday(f.key) && now <= eventEndMs(f.event));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, dismissTick, today]);

  // Pick once per mount: anchor every other time, otherwise a random other one.
  useEffect(() => {
    if (chosenKey || eligibleFeatured.length === 0) return;
    const anchors = eligibleFeatured.filter((f) => f.anchor);
    const others = eligibleFeatured.filter((f) => !f.anchor);
    let n = 0;
    try {
      n = Number(window.localStorage.getItem(ROTATION_KEY) || "0") || 0;
      window.localStorage.setItem(ROTATION_KEY, String(n + 1));
    } catch { /* ignore */ }
    const randomOther = () => others[Math.floor(Math.random() * others.length)];
    const preferAnchor = n % 2 === 0;
    const pick = preferAnchor
      ? (anchors[0] ?? randomOther())
      : (others.length ? randomOther() : anchors[0]);
    setChosenKey(pick?.key ?? null);
  }, [eligibleFeatured, chosenKey]);

  const featured = eligibleFeatured.find((f) => f.key === chosenKey) ?? null;

  const dismissFeatured = (key: string) => {
    try { window.localStorage.setItem(dismissKeyFor(key), pacificDayKey()); } catch { /* ignore */ }
    // Hide the slot for the rest of this load; it re-rotates on the next visit.
    setChosenKey("__dismissed__");
    setDismissTick((t) => t + 1);
  };

  const items = feedQuery.data?.items ?? [];
  const pinned = feedQuery.data?.pinned ?? [];
  const loading = feedQuery.isLoading;
  const error = feedQuery.isError;
  const hasContent = items.length > 0 || pinned.length > 0;

  /** Inline affiliate slots at ~40% (CockBlock) and ~80% (Mr-S). Not sticky. */
  type FeedRow =
    | { kind: "post"; item: (typeof items)[number] }
    | { kind: "affiliate"; brand: "cockblock" | "mrs"; key: string };

  const feedRows = useMemo((): FeedRow[] => {
    const rows: FeedRow[] = items.map(item => ({ kind: "post", item }));
    if (rows.length === 0) return rows;

    const idx40 = Math.floor(items.length * 0.4);
    const idx80 = Math.floor(items.length * 0.8);

    // Insert 80% first so the 40% index is not shifted by the later splice.
    rows.splice(Math.min(idx80, rows.length), 0, {
      kind: "affiliate",
      brand: "mrs",
      key: "feed-aff-mrs",
    });
    rows.splice(Math.min(idx40, rows.length), 0, {
      kind: "affiliate",
      brand: "cockblock",
      key: "feed-aff-cockblock",
    });
    return rows;
  }, [items]);

  const featuredAd = featured && featured.event ? (
    <FeaturedEventAd
      event={featured.event}
      slides={featured.slides}
      onDismiss={() => dismissFeatured(featured.key)}
    />
  ) : null;

  return (
    <div className="reveal hub-feed">
      {/* Post to feed sits at the top of the feed (not a second hub page). */}
      {canPost ? (
        <HubPost embedded />
      ) : (
        <div className="card hub-feed-panel">
          <div className="kick hub-feed-panel__kick">Post to the feed</div>
          <p className="hub-feed-panel__copy">
            Coming soon for members. Admins, event hosts, and directory venue owners can post now.
          </p>
        </div>
      )}

      <div className="card hub-feed-panel">
        <div className="kick hub-feed-panel__kick">Scene feed</div>
        <p className="hub-feed-panel__copy">
          New events, board posts, RSVPs, and beach check-ins stack on top. Scene staples stay pinned below.
        </p>
      </div>

      <div className="hs hub-feed-tabs">
        {HUB_FEED_TABS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`seg${filter === f.key ? " on" : ""}`}
            onClick={() => setFilter(parseHubFeedTab(f.key))}
          >
            {f.label}
          </button>
        ))}
      </div>

      {featuredAd}

      {loading && (
        <div className="card hub-empty hub-feed-empty hub-feed-empty--load">
          <BoardLoadingState label="Loading scene feed" />
        </div>
      )}

      {error && !loading && (
        <div className="card hub-empty hub-feed-empty">
          <p className="hub-feed-empty__msg">Could not load the feed.</p>
          <button
            type="button"
            className="ico hub-feed-retry"
            onClick={() => feedQuery.refetch()}
          >
            Try again →
          </button>
        </div>
      )}

      {!loading && !error && !hasContent && (
        <div className="card hub-empty hub-feed-empty">
          <p className="hub-feed-empty__msg">{emptyCopy(filter)}</p>
        </div>
      )}

      {!loading && !error && hasContent && (
        <div className="hub-feed-stack">
          {feedRows.map((row) =>
            row.kind === "affiliate" ? (
              <FeedAffiliateAd key={row.key} brand={row.brand} />
            ) : (
              <HubFeedCard key={row.item.id} item={row.item} />
            ),
          )}
          {items.length > 0 && pinned.length > 0 && (
            <div className="kick hub-feed-pinned">On the board</div>
          )}
          {pinned.map((item) => (
            <HubFeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}