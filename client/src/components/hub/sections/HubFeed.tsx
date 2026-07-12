import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BoardLoadingState from "@/components/BoardLoadingState";
import {
  HUB_FEED_TABS,
  parseHubFeedTab,
  type HubFeedResponse,
  type HubFeedTab,
} from "@shared/hubFeed";
import HubFeedCard from "./HubFeedCard";

function emptyCopy(tab: HubFeedTab): string {
  switch (tab) {
    case "all":
      return "No new scene activity yet. Pinned boards and highlights stay below.";
    case "events":
      return "No new event listings or host updates yet.";
    case "posts":
      return "No new beach check-ins yet. The beach boards are pinned below.";
    case "rsvps":
      return "No new RSVPs yet. Be the first to say you are going.";
    case "boards":
      return "No new board posts yet. The Pride Werk highlight stays below.";
    default:
      return "Nothing new in this feed yet.";
  }
}

export default function HubFeed() {
  const [filter, setFilter] = useState<HubFeedTab>("all");

  const feedQuery = useQuery<HubFeedResponse>({
    queryKey: ["/api/hub/feed", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ tab: filter, limit: "30" });
      const r = await fetch(`/api/hub/feed?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Could not load feed");
      return r.json();
    },
  });

  const items = feedQuery.data?.items ?? [];
  const pinned = feedQuery.data?.pinned ?? [];
  const loading = feedQuery.isLoading;
  const error = feedQuery.isError;
  const hasContent = items.length > 0 || pinned.length > 0;

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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