import { useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UserAvatar from "@/components/UserAvatar";
import { FeedbackModal } from "@/components/FeedbackForm";
import SpottedDetailModal from "@/components/SpottedDetailModal";
import BoardPostOverlay from "@/components/board/BoardPostOverlay";
import EventModal from "@/components/EventModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { avatarHrefFor } from "@/lib/avatarLinks";
import { timeAgo } from "@/lib/boardFeed";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { eventPath } from "@shared/eventSlug";
import { hubFeedBadgeColor, type HubFeedEventEmbed, type HubFeedItem } from "@shared/hubFeed";
import type { Event } from "@shared/schema";
import FeedEventDeck from "./FeedEventDeck";

function stopCardNav(e: MouseEvent) {
  e.stopPropagation();
}

type Props = {
  item: HubFeedItem;
};

function eventHref(item: HubFeedItem): string | null {
  if (!item.event) return null;
  return eventPath(item.event.id, item.event.title, item.event.dayOfWeek);
}

function eventRowsForItem(item: HubFeedItem): HubFeedEventEmbed[] {
  // Recurring bulk series: one card, one row (badge "Recurring") - never expand N nights.
  if (item.badge === "Recurring" && item.event) return [item.event];
  if (item.events?.length) return item.events;
  if (item.event) return [item.event];
  return [];
}

export default function HubFeedCard({ item }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [spottedOpen, setSpottedOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<Event | null>(null);
  const [openingEventId, setOpeningEventId] = useState<number | null>(null);
  // Soft-launch: everyone follows everyone - Unfollow unless they already dropped them.
  const [followOverride, setFollowOverride] = useState<boolean | null>(null);
  const badgeColor = hubFeedBadgeColor(item.kind);
  const href = item.link || eventHref(item);
  const when = item.pinned ? "On the board" : item.createdAt ? timeAgo(item.createdAt) : "";

  // Person to follow/unfollow: real author or "posted by" host behind venue/event identity
  const followTarget =
    item.postedBy?.username && !item.postedBy.anonymous
      ? item.postedBy
      : item.author?.username && !item.author.anonymous && !item.author.venueLogo
        ? item.author
        : null;
  const followUsername = followTarget?.username?.replace(/^@/, "") || "";
  const isSelf =
    !!user &&
    !!followUsername &&
    user.username?.toLowerCase() === followUsername.toLowerCase();
  const showFollowShortcut = Boolean(user && followUsername && !isSelf);
  // Prefer server field; soft-launch default is following
  const isFollowing =
    followOverride !== null
      ? followOverride
      : item.viewerFollowsAuthor != null
        ? item.viewerFollowsAuthor
        : true;

  const followMutation = useMutation({
    mutationFn: async (nextFollowing: boolean) => {
      const method = nextFollowing ? "POST" : "DELETE";
      const res = await apiRequest(method, `/api/users/${encodeURIComponent(followUsername)}/follow`);
      return res.json() as Promise<{ isFollowing?: boolean }>;
    },
    onSuccess: (data) => {
      setFollowOverride(data?.isFollowing ?? !isFollowing);
      toast({
        title: data?.isFollowing ? "Following" : "Unfollowed",
        description: data?.isFollowing
          ? `You’re following @${followUsername} again`
          : `You won’t see @${followUsername} as a follow`,
        duration: 2200,
      });
      void queryClient.invalidateQueries({ queryKey: ["/api/users/me/follow-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users/me/people"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
    },
    onError: (err) => {
      toast({
        title: "Could not update follow",
        description: parseApiError(err, "Try again"),
        variant: "destructive",
      });
    },
  });

  /** Open the real event modal in place - stay on the feed (no navigation). */
  const openEventInPlace = async (eventId: number) => {
    if (openingEventId != null) return;
    setOpeningEventId(eventId);
    try {
      const res = await apiRequest("GET", `/api/events/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      const full = (await res.json()) as Event;
      setModalEvent(full);
    } catch {
      // Fallback: deep-link only if the modal payload can't load
      const embed = eventRowsForItem(item).find((e) => e.id === eventId);
      if (embed) {
        window.location.assign(eventPath(embed.id, embed.title, embed.dayOfWeek));
      }
    } finally {
      setOpeningEventId(null);
    }
  };

  // Board posts glow in SoT §2.4 deep-glass board accents.
  const BOARD_ACCENTS: Record<string, string> = {
    gig: "var(--board-gigs)",
    gifting: "#CCFF00",
    spotted: "#FF00CC",
    // HAUSING runs on the board's softened cyan.
    housing: "var(--panel-cyan)",
  };
  const glow = BOARD_ACCENTS[item.kind];
  const isSpotted = item.kind === "spotted";
  // Board posts with an author (gigs, gifts) show the post title as a bold
  // subject line, matching the board's expanded card.
  const showSubject = (item.kind === "gig" || item.kind === "gifting" || item.kind === "housing") && !!item.title;
  // Gig/gift cards open the real board card as an overlay on top of the feed.
  const isBoard = (item.kind === "gig" || item.kind === "gifting") && item.boardPostId != null;

  const bundledEvents = eventRowsForItem(item);
  // Events render as the profile-style poster deck: one card for a single event,
  // a fanned tap-to-cycle stack when there's more than one.
  const eventBlock = bundledEvents.length > 0
    ? <FeedEventDeck events={bundledEvents} onOpen={openEventInPlace} />
    : null;

  const beachBlock = item.beachLabel && !item.event ? (
    <div className="kick hub-feed-card__beach">{item.beachLabel}</div>
  ) : null;

  const ctaBlock = item.ctaAction === "feedback" && item.ctaLabel ? (
    <button
      type="button"
      className="hub-feed-card__cta"
      onClick={() => setFeedbackOpen(true)}
    >
      {item.ctaLabel}
    </button>
  ) : null;

  // Rainbow top seam only on glowing board cards in the feed (gig / gift / MC),
  // not plain activity rows (RSVP, check-in, announcements).
  const isGlowCard = Boolean(glow) || isSpotted || isBoard;

  // Looking gigs always keep the full rainbow top bar (§2.13 hub items).
  const isLooking = item.badge === "Looking" || (item.kind === "gig" && /looking/i.test(item.badge || ""));

  const feedAccent = glow || (!isSpotted ? badgeColor : undefined);
  const accentStyle = feedAccent
    ? ({
        "--hub-feed-accent": feedAccent,
        "--c": feedAccent,
        "--_c": feedAccent,
        "--listing-accent": feedAccent,
      } as CSSProperties)
    : undefined;

  const cardClass = [
    "card",
    "fitem",
    "hub-feed-card",
    item.pinned ? "hub-feed-card--pin" : "",
    glow ? "hub-feed-card--accent" : "",
    (isSpotted || isBoard) ? "hub-feed-card--clickable" : "",
    // Looking always gets the rainbow top seam (fitem--glow::before engine)
    (isGlowCard || isLooking) ? "fitem--glow" : "",
    isLooking ? "hub-feed-card--looking" : "",
  ].filter(Boolean).join(" ");

  const body = (
    <div
      className={cardClass}
      style={accentStyle}
      onClick={isSpotted ? () => setSpottedOpen(true) : isBoard ? () => setBoardOpen(true) : undefined}
      onKeyDown={(isSpotted || isBoard) ? (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); isSpotted ? setSpottedOpen(true) : setBoardOpen(true); }
      } : undefined}
      role={(isSpotted || isBoard) ? "button" : undefined}
      tabIndex={(isSpotted || isBoard) ? 0 : undefined}
    >
      {isSpotted ? (
        <div>
          <div className="hub-feed-mc__head">
            <span className="hub-feed-mc__dot" />
            <span className="kick hub-feed-mc__kick">
              Mizzed Connection{when ? ` · ${when}` : ""}
            </span>
          </div>
          {(item.title || item.text) && (
            <h3 className="display hub-feed-mc__title">
              {item.title || item.text}
            </h3>
          )}
          {item.text && (
            <p className="hub-feed-mc__body">{item.text}</p>
          )}
          {item.place && (
            <div className="kick hub-feed-mc__place">
              {item.place} · Anonymous
            </div>
          )}
          <div className="kick hub-feed-mc__reply">Reply privately →</div>
        </div>
      ) : (
      <div className="hub-feed-card__row">
        <UserAvatar
          photoUrl={item.author.photoUrl}
          avatarChoice={item.author.avatarChoice}
          avatarRing={item.author.avatarRing}
          displayName={item.author.displayName}
          username={item.author.username ?? undefined}
          logoFit={item.author.venueLogo}
          href={avatarHrefFor(item.author)}
          onClick={stopCardNav}
          size={44}
        />
        <div className="hub-feed-card__main">
          <div className="hub-feed-card__head">
            <div className="hub-feed-card__main">
              <div className="hub-feed-card__author">{item.author.displayName}</div>
              <div className="kick hub-feed-card__meta">
                {item.action}
                {when ? ` · ${when}` : ""}
              </div>
              {item.postedBy && (
                <div className="hub-feed-card__postedby">
                  <UserAvatar
                    photoUrl={item.postedBy.photoUrl}
                    avatarChoice={item.postedBy.avatarChoice}
                    avatarRing={item.postedBy.avatarRing}
                    displayName={item.postedBy.displayName}
                    username={item.postedBy.username ?? undefined}
                    href={avatarHrefFor(item.postedBy)}
                    onClick={stopCardNav}
                    size={20}
                  />
                  <span className="kick hub-feed-card__postedby-name">
                    Posted by {item.postedBy.displayName}
                  </span>
                </div>
              )}
            </div>
            <div className="hub-feed-card__head-actions">
              {showFollowShortcut && (
                <button
                  type="button"
                  className={`foll hub-feed-card__foll${isFollowing ? " on" : ""}`}
                  disabled={followMutation.isPending}
                  data-testid="feed-follow-shortcut"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    followMutation.mutate(!isFollowing);
                  }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
              <span
                className="kick hub-feed-card__badge"
                style={{ "--hub-feed-accent": badgeColor, "--c": badgeColor } as CSSProperties}
              >
                {item.badge}
              </span>
            </div>
          </div>
          {showSubject && (
            <h4 className="hub-feed-card__subject">{item.title}</h4>
          )}
          {item.text && (
            <p className="hub-feed-card__body">{item.text}</p>
          )}
          {item.photoUrl && (
            <img src={item.photoUrl} alt="" className="hub-feed-card__photo" />
          )}
          {eventBlock}
          {beachBlock}
          {ctaBlock}
        </div>
      </div>
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      {modalEvent && (
        <EventModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
          onEventUpdated={(ev) => setModalEvent(ev)}
        />
      )}
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

  // Don't wrap the whole card in a link when it embeds event rows - those open
  // EventModal in place. Other non-event deep links still navigate.
  if (href && !item.event && !item.events?.length && item.ctaAction !== "feedback") {
    return (
      <Link href={href} className="hub-feed-card-link">
        {body}
      </Link>
    );
  }

  return body;
}
