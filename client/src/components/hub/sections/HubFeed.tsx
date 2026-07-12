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
import { DAY_TEXT_COLORS } from "@shared/prideWeek";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import EventModal from "@/components/EventModal";
import HubFeedCard from "./HubFeedCard";
import HubPost from "./HubPost";

const STANK_PROMO_DISMISS_KEY = "hub-promo-stank-yes-coach-dismissed";

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
  const [adEventOpen, setAdEventOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STANK_PROMO_DISMISS_KEY) === "1";
  });

  const feedQuery = useQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ tab: filter, limit: "30" });
      const r = await fetch(`/api/hub/feed?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load feed");
      return r.json();
    },
  });

  // Featured promo: find the Stank Yes Coach event to link the top card to.
  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events", { credentials: "include" }).then((r) => r.json()),
    staleTime: 300_000,
    enabled: !promoDismissed,
  });
  const stankEvent = promoDismissed
    ? undefined
    : events.find((e) => /stank\s*yes\s*coach|yes\s*coach\s*stank/i.test(e.title || ""));

  const dismissPromo = () => {
    setPromoDismissed(true);
    try { window.localStorage.setItem(STANK_PROMO_DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  const items = feedQuery.data?.items ?? [];
  const pinned = feedQuery.data?.pinned ?? [];
  const loading = feedQuery.isLoading;
  const error = feedQuery.isError;
  const hasContent = items.length > 0 || pinned.length > 0;

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {stankEvent && (() => {
        const day = stankEvent.dayOfWeek || "";
        const accent = DAY_TEXT_COLORS[day] || "#19E3FF";
        const poster = resolveEventPosterUrl(stankEvent.id, stankEvent.posterImageUrl);
        return (
          <div
            style={{
              position: "relative",
              borderRadius: 18,
              overflow: "hidden",
              border: `2px solid ${accent}`,
              boxShadow: `0 0 44px -12px ${accent}`,
              background: "#0d0d0d",
            }}
          >
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissPromo}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 3,
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "none",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 15,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            {poster && (
              <img
                src={poster}
                alt={stankEvent.title}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            )}
            <div style={{ padding: "14px 16px 16px" }}>
              <div
                className="kick"
                style={{
                  letterSpacing: ".16em",
                  color: accent,
                  textTransform: "uppercase",
                  fontSize: 11,
                }}
              >
                Don't miss{day ? ` · ${day}` : ""} · {stankEvent.venueName}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {stankEvent.ticketUrl && (
                  <a
                    href={stankEvent.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: accent,
                      color: "#08080a",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      fontSize: 14,
                      padding: "12px 14px",
                      borderRadius: 12,
                      textDecoration: "none",
                    }}
                  >
                    Get tickets →
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setAdEventOpen(true)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: accent,
                    border: `1.5px solid ${accent}`,
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    fontSize: 14,
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                  }}
                >
                  RSVP →
                </button>
              </div>
            </div>
            {adEventOpen && (
              <EventModal event={stankEvent} onClose={() => setAdEventOpen(false)} />
            )}
          </div>
        );
      })()}

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