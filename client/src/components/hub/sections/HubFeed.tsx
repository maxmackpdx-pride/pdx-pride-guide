import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ds";

type FeedFilter = "all" | "events" | "posts" | "rsvps" | "boards";

type FeedItem = {
  id: string;
  cat: FeedFilter;
  name: string;
  ring?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  time: string;
  head: string;
  typeLabel: string;
  text?: string;
  media?: string;
  isVideo?: boolean;
  isEvent?: boolean;
  isRsvp?: boolean;
  isBoard?: boolean;
  evTitle?: string;
  evWhen?: string;
  goingCount?: number;
  boardLabel?: string;
  boardTitle?: string;
  boardText?: string;
  place?: string;
  day?: string;
  likes: number;
  comments: number;
};

const FEED_FILTERS: Array<{ key: FeedFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "events", label: "Events" },
  { key: "posts", label: "Posts" },
  { key: "rsvps", label: "RSVPs" },
  { key: "boards", label: "Boards" },
];

// No live feed API yet (that lands in a later PR). Until then the feed shows a
// real empty state rather than fabricated sample posts.
const FEED: FeedItem[] = [];

function dayDotClass(day?: string) {
  const map: Record<string, string> = {
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
  };
  return day ? map[day] ?? "" : "";
}

type Props = {
  onGoPost: (postType?: string) => void;
};

export default function HubFeed({ onGoPost }: Props) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const feed = FEED.filter((f) => (filter === "all" ? true : f.cat === filter));

  const composeShortcuts = [
    { key: "photo", label: "Photo", paths: ["M4 5h16v14H4z", "M8 11l2.5 3L14 9l3 4"] },
    { key: "video", label: "Video", paths: ["M4 6h11v12H4z", "M15 10l5-3v10l-5-3"] },
    { key: "update", label: "Update", paths: ["M12 5v14", "M5 12h14"] },
    {
      key: "checkin",
      label: "Check-in",
      paths: ["M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z", "M12 12.6a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2"],
    },
  ];

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card" style={{ padding: "15px 17px" }}>
        <button
          type="button"
          onClick={() => onGoPost()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            textAlign: "left",
            background: "var(--ink-850)",
            border: "1px solid var(--panel-border-2)",
            borderRadius: 99,
            padding: "12px 18px",
            color: "var(--board-muted)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="var(--panel-cyan)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Share a photo, video, or update...
        </button>
        <div style={{ display: "flex", gap: 6, marginTop: 13, paddingTop: 13, borderTop: "1px solid var(--panel-border)" }}>
          {composeShortcuts.map((c) => (
            <button
              key={c.key}
              type="button"
              className="ico"
              onClick={() => onGoPost(c.key)}
              style={{ flex: 1, justifyContent: "center", padding: 8, borderRadius: 8, background: "transparent", border: "none" }}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {c.paths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </svg>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hs" style={{ display: "flex", gap: 22, overflowX: "auto", padding: "0 2px 2px" }}>
        {FEED_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`seg${filter === f.key ? " on" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {feed.length === 0 && (
        <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: ".02em",
            }}
          >
            Your feed is quiet
          </div>
          <p style={{ margin: "10px auto 18px", maxWidth: 340, fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
            {filter === "all"
              ? "Nothing here yet. Share a photo, check in somewhere, or RSVP to an event to get things going."
              : "Nothing here yet in this filter."}
          </p>
          {filter === "all" && (
            <Button variant="neon" accent="cyan" size="sm" onClick={() => onGoPost()}>
              Share something
            </Button>
          )}
        </div>
      )}

      {feed.map((it) => (
        <article key={it.id} className="card fitem" style={{ padding: "18px 20px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <UserAvatar
              displayName={it.name}
              photoUrl={it.photoUrl}
              avatarChoice={it.avatarChoice}
              avatarRing={it.ring}
              size={38}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1.2 }}>{it.name}</div>
              <div className="kick" style={{ letterSpacing: ".1em", marginTop: 2 }}>
                {it.head} · {it.time}
              </div>
            </div>
            <span className="kick" style={{ letterSpacing: ".14em" }}>
              {it.typeLabel}
            </span>
          </div>

          {it.text && (
            <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.55, color: "var(--board-text)" }}>{it.text}</p>
          )}

          {it.media && (
            <div style={{ position: "relative", marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid var(--panel-border)" }}>
              <img src={it.media} alt="" style={{ display: "block", width: "100%", height: 300, objectFit: "cover" }} />
              {it.isVideo && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.22)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(6,6,10,.62)", border: "1.5px solid rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="#fff" style={{ marginLeft: 3 }}>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}

          {it.isEvent && (
            <div className="subtile" style={{ marginTop: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span className={`dot ${dayDotClass(it.day)}`} style={{ alignSelf: "flex-start", marginTop: 7 }} />
              <div style={{ flex: 1, minWidth: 170 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: 1.05, textTransform: "uppercase" }}>
                  {it.evTitle}
                </div>
                <div className="kick" style={{ letterSpacing: ".06em", marginTop: 6 }}>{it.evWhen}</div>
              </div>
              <Button variant="neon" accent="cyan" size="sm">
                RSVP
              </Button>
            </div>
          )}

          {it.isRsvp && (
            <div className="subtile" style={{ marginTop: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span className={`dot ${dayDotClass(it.day)}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff", textTransform: "uppercase", lineHeight: 1.05 }}>
                  {it.evTitle}
                </div>
                <div className="kick" style={{ letterSpacing: ".06em", marginTop: 5 }}>
                  {it.evWhen} · {it.goingCount} going
                </div>
              </div>
            </div>
          )}

          {it.isBoard && (
            <div className="subtile" style={{ marginTop: 14, padding: "15px 16px" }}>
              <div className="kick" style={{ letterSpacing: ".18em" }}>{it.boardLabel}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff", textTransform: "uppercase", margin: "6px 0" }}>
                {it.boardTitle}
              </div>
              <div style={{ fontSize: 14, color: "var(--board-muted)", lineHeight: 1.5 }}>{it.boardText}</div>
            </div>
          )}

          {it.place && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 13, color: "var(--board-muted)" }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
              <span className="kick" style={{ letterSpacing: ".08em" }}>{it.place}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--panel-border)" }}>
            <span className="ico">
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z" />
              </svg>
              {it.likes}
            </span>
            <span className="ico">
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {it.comments}
            </span>
            <span className="ico" style={{ marginLeft: "auto" }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8h16v-8" />
                <path d="M12 16V4" />
                <path d="M8 8l4-4 4 4" />
              </svg>
              Share
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}