import { useState } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { FeedbackModal } from "@/components/FeedbackForm";
import { timeAgo } from "@/lib/boardFeed";
import { eventPath } from "@shared/eventSlug";
import { hubFeedBadgeColor, type HubFeedItem } from "@shared/hubFeed";

type Props = {
  item: HubFeedItem;
};

function dayDotClass(day?: string | null) {
  const map: Record<string, string> = {
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
    MON: "d-mon",
    TUE: "d-tue",
    WED: "d-wed",
    Thu: "d-thu",
    Fri: "d-fri",
    Sat: "d-sat",
    Sun: "d-sun",
  };
  return day ? map[day] ?? "" : "";
}

function eventHref(item: HubFeedItem): string | null {
  if (!item.event) return null;
  return eventPath(item.event.id, item.event.title, item.event.dayOfWeek);
}

export default function HubFeedCard({ item }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const badgeColor = hubFeedBadgeColor(item.kind);
  const href = item.link || eventHref(item);
  const when = item.pinned ? "On the board" : item.createdAt ? timeAgo(item.createdAt) : "";

  const eventBlock = item.event ? (
    <Link
      href={eventHref(item) || "/events"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        marginTop: 12,
        padding: "12px 14px",
        background: "var(--ink-900)",
        border: "1px solid var(--panel-border-2)",
        borderRadius: 11,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span className={`dot ${dayDotClass(item.event.dayOfWeek)}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          {item.event.title}
        </div>
        <div className="kick" style={{ letterSpacing: ".05em", marginTop: 4 }}>
          {item.event.venueName}
          {item.event.goingCount != null && item.event.goingCount > 0
            ? ` · ${item.event.goingCount} going`
            : ""}
        </div>
      </div>
    </Link>
  ) : null;

  const beachBlock = item.beachLabel && !item.event ? (
    <div className="kick" style={{ marginTop: 10, letterSpacing: ".08em", color: "var(--panel-cyan)" }}>
      {item.beachLabel}
    </div>
  ) : null;

  const ctaBlock = item.ctaAction === "feedback" && item.ctaLabel ? (
    <button
      type="button"
      onClick={() => setFeedbackOpen(true)}
      style={{
        marginTop: 14,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--panel-lime)",
        border: "1px solid var(--panel-lime)",
        borderRadius: 8,
        padding: "9px 16px",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {item.ctaLabel}
    </button>
  ) : null;

  const body = (
    <div
      className={`card fitem${item.pinned ? " hub-feed-pin" : ""}`}
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        ...(item.pinned ? { borderColor: "var(--panel-border-2)" } : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <UserAvatar
          photoUrl={item.author.photoUrl}
          avatarChoice={item.author.avatarChoice}
          avatarRing={item.author.avatarRing}
          displayName={item.author.displayName}
          username={item.author.username ?? undefined}
          size={44}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#fff",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {item.author.displayName}
              </div>
              <div className="kick" style={{ fontSize: 10.5, letterSpacing: ".06em", marginTop: 5 }}>
                {item.action}
                {when ? ` · ${when}` : ""}
              </div>
            </div>
            <span
              className="kick"
              style={{
                flex: "none",
                fontSize: 10,
                letterSpacing: ".1em",
                color: badgeColor,
                border: `1px solid ${badgeColor}`,
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              {item.badge}
            </span>
          </div>
          {item.text && (
            <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--board-text)" }}>
              {item.text}
            </p>
          )}
          {eventBlock}
          {beachBlock}
          {ctaBlock}
        </div>
      </div>
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );

  if (href && !item.event && item.ctaAction !== "feedback") {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {body}
      </Link>
    );
  }

  return body;
}