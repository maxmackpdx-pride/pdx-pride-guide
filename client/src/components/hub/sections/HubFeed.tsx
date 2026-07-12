import { useState } from "react";
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

// Stores the Pacific day the ad was dismissed on; it reappears the next day.
// (New key name so the old "dismissed forever" flag is ignored.)
const STANK_PROMO_DISMISS_KEY = "hub-promo-stank-dismissed-day";

// Slideshow images that rotate after the poster in the Stank ad (2s each).
// Add more files to /public/posters/stank-slides/ and list them here.
const STANK_SLIDES = Array.from({ length: 11 }, (_, i) =>
  `/posters/stank-slides/slide-${String(i + 1).padStart(2, "0")}.jpg`,
);

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

export default function HubFeed({ canPostToFeed = false }: Props) {
  const [filter, setFilter] = useState<HubFeedTab>("all");
  const [composing, setComposing] = useState(false);
  const [dismissedDay, setDismissedDay] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(STANK_PROMO_DISMISS_KEY) || "";
  });
  const dismissedToday = dismissedDay === pacificDayKey();

  const feedQuery = useQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ tab: filter, limit: "30" });
      const r = await fetch(`/api/hub/feed?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load feed");
      return r.json();
    },
  });

  // Featured promo: find the Stank Yes Coach event to feature at the top.
  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events", { credentials: "include" }).then((r) => r.json()),
    staleTime: 300_000,
    enabled: !dismissedToday,
  });
  const foundEvent = events.find((e) => /stank\s*yes\s*coach|yes\s*coach\s*stank/i.test(e.title || ""));
  // Show unless dismissed today or the event has already ended.
  const stankEvent = foundEvent && !dismissedToday && Date.now() <= eventEndMs(foundEvent)
    ? foundEvent
    : undefined;

  const dismissPromo = () => {
    const day = pacificDayKey();
    setDismissedDay(day);
    try { window.localStorage.setItem(STANK_PROMO_DISMISS_KEY, day); } catch { /* ignore */ }
  };

  const items = feedQuery.data?.items ?? [];
  const pinned = feedQuery.data?.pinned ?? [];
  const loading = feedQuery.isLoading;
  const error = feedQuery.isError;
  const hasContent = items.length > 0 || pinned.length > 0;

  const stankAd = stankEvent ? (
    <FeaturedEventAd event={stankEvent} onDismiss={dismissPromo} slides={STANK_SLIDES} />
  ) : null;

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card" style={{ padding: "15px 17px" }}>
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)", marginBottom: 6 }}>
          Scene feed
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--board-muted)" }}>
          New events, board posts, RSVPs, and beach check-ins stack on top. Scene staples stay pinned below.
        </p>
        {canPostToFeed && (
          <button
            type="button"
            onClick={() => setComposing((v) => !v)}
            style={{
              marginTop: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: composing ? "var(--board-muted)" : "var(--panel-cyan)",
              border: `1px solid ${composing ? "var(--panel-border)" : "var(--panel-cyan)"}`,
              borderRadius: 8,
              padding: "9px 16px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {composing ? "Close composer" : "Post to the feed"}
          </button>
        )}
      </div>

      {canPostToFeed && composing && <HubPost embedded />}

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

      {stankAd}

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