import { useState } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { FeedbackModal } from "@/components/FeedbackForm";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import BoardPostOverlay from "@/components/board/BoardPostOverlay";
import { timeAgo } from "@/lib/boardFeed";
import { eventPath } from "@shared/eventSlug";
import { hubFeedBadgeColor, type HubFeedEventEmbed, type HubFeedItem } from "@shared/hubFeed";

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

function eventRowsForItem(item: HubFeedItem): HubFeedEventEmbed[] {
  if (item.events?.length) return item.events;
  if (item.event) return [item.event];
  return [];
}

function EventFeedRow({
  event,
  showPoster,
}: {
  event: HubFeedEventEmbed;
  showPoster: boolean;
}) {
  const href = eventPath(event.id, event.title, event.dayOfWeek);
  return (
    <Link
      href={href}
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
      {showPoster && event.poster ? (
        <UserAvatar
          photoUrl={event.poster.photoUrl}
          avatarChoice={event.poster.avatarChoice}
          avatarRing={event.poster.avatarRing}
          displayName={event.poster.displayName}
          username={event.poster.username ?? undefined}
          logoFit={event.poster.venueLogo}
          size={34}
        />
      ) : null}
      <span className={`dot ${dayDotClass(event.dayOfWeek)}`} />
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
          {event.title}
        </div>
        <div className="kick" style={{ letterSpacing: ".05em", marginTop: 4 }}>
          {event.venueName}
          {event.goingCount != null && event.goingCount > 0
            ? ` · ${event.goingCount} going`
            : ""}
        </div>
      </div>
    </Link>
  );
}

export default function HubFeedCard({ item }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [spottedOpen, setSpottedOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const badgeColor = hubFeedBadgeColor(item.kind);
  const href = item.link || eventHref(item);
  const when = item.pinned ? "On the board" : item.createdAt ? timeAgo(item.createdAt) : "";

  // Board posts glow in their category color: gigs purple, gifts acid-yellow,
  // missed connections magenta.
  const BOARD_ACCENTS: Record<string, string> = {
    gig: "var(--panel-purple)",
    gifting: "var(--panel-lime)",
    spotted: "var(--panel-magenta)",
  };
  const glow = BOARD_ACCENTS[item.kind];
  const isSpotted = item.kind === "spotted";
  // Board posts with an author (gigs, gifts) show the post title as a bold
  // subject line, matching the board's expanded card.
  const showSubject = (item.kind === "gig" || item.kind === "gifting") && !!item.title;
  // Gig/gift cards open the real board card as an overlay on top of the feed.
  const isBoard = (item.kind === "gig" || item.kind === "gifting") && item.boardPostId != null;

  const bundledEvents = eventRowsForItem(item);
  const showPosterOnRows = bundledEvents.length > 1;
  const eventBlock = bundledEvents.length > 0
    ? bundledEvents.map((event) => (
      <EventFeedRow key={event.id} event={event} showPoster={showPosterOnRows} />
    ))
    : null;

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

  // Rainbow top seam only on glowing board cards in the feed (gig / gift / MC),
  // not plain activity rows (RSVP, check-in, announcements).
  const isGlowCard = Boolean(glow) || isSpotted || isBoard;

  const body = (
    <div
      className={`card fitem${item.pinned ? " hub-feed-pin" : ""}${isGlowCard ? " fitem--glow" : ""}`}
      onClick={isSpotted ? () => setSpottedOpen(true) : isBoard ? () => setBoardOpen(true) : undefined}
      onKeyDown={(isSpotted || isBoard) ? (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); isSpotted ? setSpottedOpen(true) : setBoardOpen(true); }
      } : undefined}
      role={(isSpotted || isBoard) ? "button" : undefined}
      tabIndex={(isSpotted || isBoard) ? 0 : undefined}
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        ...((isSpotted || isBoard) ? { cursor: "pointer" } : {}),
        ...(glow
          ? { border: `1px solid ${glow}`, boxShadow: `0 0 22px -9px ${glow}` }
          : item.pinned
            ? { borderColor: "var(--panel-border-2)" }
            : {}),
      }}
    >
      {isSpotted ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--panel-magenta)",
                boxShadow: "0 0 8px var(--panel-magenta)",
                flex: "none",
              }}
            />
            <span
              className="kick"
              style={{
                fontSize: 10.5,
                letterSpacing: ".14em",
                color: "var(--panel-magenta)",
                textTransform: "uppercase",
              }}
            >
              Missed Connection{when ? ` · ${when}` : ""}
            </span>
          </div>
          {(item.title || item.text) && (
            <h3
              className="display"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 27,
                color: "#fff",
                lineHeight: 1.02,
                margin: "11px 0 0",
              }}
            >
              {item.title || item.text}
            </h3>
          )}
          {item.text && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "var(--board-text)",
              }}
            >
              {item.text}
            </p>
          )}
          {item.place && (
            <div
              className="kick"
              style={{
                marginTop: 14,
                fontSize: 10.5,
                letterSpacing: ".12em",
                color: "var(--panel-magenta)",
                textTransform: "uppercase",
              }}
            >
              {item.place} · Anonymous
            </div>
          )}
          <div
            className="kick"
            style={{
              marginTop: 12,
              fontSize: 10.5,
              letterSpacing: ".12em",
              color: "var(--panel-magenta)",
              textTransform: "uppercase",
            }}
          >
            Reply privately →
          </div>
        </div>
      ) : (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <UserAvatar
          photoUrl={item.author.photoUrl}
          avatarChoice={item.author.avatarChoice}
          avatarRing={item.author.avatarRing}
          displayName={item.author.displayName}
          username={item.author.username ?? undefined}
          logoFit={item.author.venueLogo}
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
          {showSubject && (
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 19,
                color: "#fff",
                textTransform: "uppercase",
                lineHeight: 1.08,
                margin: "12px 0 0",
              }}
            >
              {item.title}
            </h4>
          )}
          {item.text && (
            <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--board-text)" }}>
              {item.text}
            </p>
          )}
          {item.photoUrl && (
            <img
              src={item.photoUrl}
              alt=""
              style={{
                display: "block",
                marginTop: 12,
                maxWidth: "100%",
                maxHeight: 360,
                borderRadius: 11,
                border: "1px solid var(--panel-border-2)",
                objectFit: "cover",
              }}
            />
          )}
          {eventBlock}
          {beachBlock}
          {ctaBlock}
        </div>
      </div>
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );

  // Missed-connection cards open the board's detail card in place (same overlay
  // you get tapping a post on the board), rather than deep-linking away.
  if (isSpotted) {
    return (
      <>
        {body}
        {spottedOpen && item.spotted && (
          <SpottedDetailModal
            postId={item.spotted.id}
            title={item.title || item.text || "Missed connection"}
            body={item.text || ""}
            place={item.place || ""}
            kindLabel={item.spotted.kindLabel}
            kindColor={item.spotted.kindColor}
            onClose={() => setSpottedOpen(false)}
          />
        )}
      </>
    );
  }

  // Gig/gift cards open the real board card as an overlay in place, so closing
  // returns to the exact feed scroll spot (no navigation).
  if (isBoard) {
    return (
      <>
        {body}
        {boardOpen && item.boardPostId != null && (
          <BoardPostOverlay
            kind={item.kind === "gig" ? "gig" : "gifting"}
            postId={item.boardPostId}
            onClose={() => setBoardOpen(false)}
          />
        )}
      </>
    );
  }

  if (href && !item.event && item.ctaAction !== "feedback") {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {body}
      </Link>
    );
  }

  return body;
}