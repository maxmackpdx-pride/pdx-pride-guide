import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import BoardLoadingState from "@/components/BoardLoadingState";
import {
  HUB_FEED_TABS,
  parseHubFeedTab,
  type HubFeedResponse,
  type HubFeedTab,
} from "@shared/hubFeed";
import type { EventListing } from "@shared/multiDayEvents";
import FeaturedEventAd from "./FeaturedEventAd";
import HubFeedCard from "./HubFeedCard";
import HubPost from "./HubPost";

// ── Featured event ads ──────────────────────────────────────────────────────
// Add an entry to FEATURED (title matcher + slideshow) and the matching event
// auto-features at the top of the feed. Rules:
//  • The `anchor` (Yes Coach / Stank) shows every other time; the in-between
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

  const featuredAd = featured && featured.event ? (
    <FeaturedEventAd
      event={featured.event}
      slides={featured.slides}
      onDismiss={() => dismissFeatured(featured.key)}
    />
  ) : null;

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Post to feed sits at the top of the feed (not a second hub page). */}
      {canPost ? (
        <HubPost embedded />
      ) : (
        <div className="card" style={{ padding: "15px 17px" }}>
          <div className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)", marginBottom: 6 }}>
            Post to the feed
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--board-muted)" }}>
            Coming soon for members. Admins, event hosts, and directory venue owners can post now.
          </p>
        </div>
      )}

      <div className="card" style={{ padding: "15px 17px" }}>
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)", marginBottom: 6 }}>
          Scene feed
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--board-muted)" }}>
          New events, board posts, RSVPs, and beach check-ins stack on top. Scene staples stay pinned below.
        </p>
      </div>

      <div className="hs" style={{ display: "flex", gap: 22, overflowX: "auto", padding: "0 2px 2px" }}>
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
        <div className="card hub-empty" style={{ textAlign: "center", padding: "28px 20px" }}>
          <BoardLoadingState label="Loading scene feed" />
        </div>
      )}

      {error && !loading && (
        <div className="card hub-empty" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 15, color: "var(--board-text)" }}>
            Could not load the feed.
          </p>
          <button
            type="button"
            className="ico"
            onClick={() => feedQuery.refetch()}
            style={{ marginTop: 14, color: "var(--panel-cyan)", justifyContent: "center", width: "100%" }}
          >
            Try again →
          </button>
        </div>
      )}

      {!loading && !error && !hasContent && (
        <div className="card hub-empty" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 15, color: "var(--board-text)" }}>{emptyCopy(filter)}</p>
        </div>
      )}

      {!loading && !error && hasContent && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item) => (
            <HubFeedCard key={item.id} item={item} />
          ))}
          {items.length > 0 && pinned.length > 0 && (
            <div className="kick" style={{ letterSpacing: ".14em", padding: "4px 2px 0", color: "var(--board-muted)" }}>
              On the board
            </div>
          )}
          {pinned.map((item) => (
            <HubFeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}