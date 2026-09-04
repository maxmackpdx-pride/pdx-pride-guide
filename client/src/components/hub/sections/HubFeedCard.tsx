import { useState, type CSSProperties, type MouseEvent } from "react";
import { Link, useLocation } from "wouter";
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
import { ChangeBadge } from "@/components/ds/ChangeBadge";
import type { Event } from "@shared/schema";
import FeedEventDeck from "./FeedEventDeck";

function stopCardNav(e: MouseEvent) {
  e.stopPropagation();
}

type Props = {
  item: HubFeedItem;
};

type VoteResponse = {
  score: number;
  viewerVote: -1 | 0 | 1;
  authorKarma: number;
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

function openLabelFor(item: HubFeedItem): string {
  switch (item.kind) {
    case "spotted":
      return "Open connection";
    case "gig":
      return "Open GIGZ post";
    case "gifting":
      return "Open GIFTZ post";
    case "sellz":
      return "Open SELLZ listing";
    case "housing":
      return "Open HAÜZ listing";
    case "checkin":
    case "beach":
      return "Open beach board";
    default:
      return "Open update";
  }
}

export default function HubFeedCard({ item }: Props) {
  const [, navigate] = useLocation();
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
  const [voteOverride, setVoteOverride] = useState<VoteResponse | null>(null);
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
  const engagement = item.engagement
    ? {
        ...item.engagement,
        score: voteOverride?.score ?? item.engagement.score,
        viewerVote: voteOverride?.viewerVote ?? item.engagement.viewerVote,
      }
    : null;
  const authorKarma = voteOverride?.authorKarma ?? item.authorKarma;

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

  const voteMutation = useMutation({
    mutationFn: async (value: -1 | 0 | 1) => {
      if (!engagement) throw new Error("This post is not open for voting");
      const response = await apiRequest(
        "POST",
        `/api/content/HUB/${engagement.contentId}/vote`,
        { value },
      );
      return response.json() as Promise<VoteResponse>;
    },
    onSuccess: (data) => {
      setVoteOverride(data);
      void queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
    },
    onError: (err) => {
      toast({
        title: "Vote did not save",
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
  const showSubject = (
    item.kind === "gig"
    || item.kind === "gifting"
    || item.kind === "sellz"
    || item.kind === "housing"
  ) && !!item.title;
  // GIGZ and GIFTZ reuse the shared board overlay. SELLZ has its own listing
  // surface and keeps the canonical `/sellz?post=id` navigation path.
  const isBoard = (item.kind === "gig" || item.kind === "gifting") && item.boardPostId != null;
  const canNavigateCard = Boolean(
    href
    && !isSpotted
    && !isBoard
    && !item.event
    && !item.events?.length
    && item.ctaAction !== "feedback",
  );

  const openCard = () => {
    if (isSpotted) {
      setSpottedOpen(true);
      return;
    }
    if (isBoard) {
      setBoardOpen(true);
      return;
    }
    if (canNavigateCard && href) navigate(href);
  };

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
      className="hub-feed-card__cta pdx-glass-rebind"
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
    (isSpotted || isBoard || canNavigateCard) ? "hub-feed-card--clickable" : "",
    // Looking always gets the rainbow top seam (fitem--glow::before engine)
    (isGlowCard || isLooking) ? "fitem--glow" : "",
    isLooking ? "hub-feed-card--looking" : "",
  ].filter(Boolean).join(" ");

  const body = (
    <article
      className={cardClass}
      style={accentStyle}
      onClick={(isSpotted || isBoard || canNavigateCard) ? openCard : undefined}
      aria-label={`${item.author.displayName}: ${item.action}`}
    >
      {isSpotted ? (
        <div>
          <div className="hub-feed-mc__head">
            <span className="hub-feed-mc__dot" />
            <span className="kick hub-feed-mc__kick">
              MIZZED CONNECTION{when ? ` · ${when}` : ""}
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
              {authorKarma != null && (
                <div className="kick hub-feed-card__karma" aria-label={`${authorKarma} author karma`}>
                  {authorKarma} karma
                </div>
              )}
              <div className="kick hub-feed-card__meta">
                <span>{item.action}</span>
                {when && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {item.createdAt && !item.pinned ? (
                      <time dateTime={item.createdAt}>{when}</time>
                    ) : (
                      <span>{when}</span>
                    )}
                  </>
                )}
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
              <ChangeBadge label={item.changeLabel} className="hub-feed-card__change" />
              {showFollowShortcut && (
                <button
                  type="button"
                  className={`foll hub-feed-card__foll${isFollowing ? " on" : ""} pdx-glass-rebind`}
                  disabled={followMutation.isPending}
                  aria-busy={followMutation.isPending}
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
                className="kick hub-feed-card__badge pdx-glass-rebind"
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
            <img
              src={item.photoUrl}
              alt={item.title ? `${item.title} photo` : `Photo shared by ${item.author.displayName}`}
              className="hub-feed-card__photo"
              loading="lazy"
            />
          )}
          {eventBlock}
          {beachBlock}
          {ctaBlock}
          {engagement && (
            <div
              className="hub-feed-card__engagement"
              aria-label="Community response"
              onClick={stopCardNav}
            >
              <div className="hub-feed-card__vote-group">
                <button
                  type="button"
                  className={`hub-feed-card__vote${engagement.viewerVote === 1 ? " is-on" : ""}`}
                  aria-label="Upvote this post"
                  aria-pressed={engagement.viewerVote === 1}
                  disabled={voteMutation.isPending}
                  onClick={() => voteMutation.mutate(engagement.viewerVote === 1 ? 0 : 1)}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <output className="hub-feed-card__score" aria-live="polite" aria-label={`${engagement.score} net votes`}>
                  {engagement.score}
                </output>
                <button
                  type="button"
                  className={`hub-feed-card__vote${engagement.viewerVote === -1 ? " is-on is-down" : ""}`}
                  aria-label="Downvote this post"
                  aria-pressed={engagement.viewerVote === -1}
                  disabled={voteMutation.isPending}
                  onClick={() => voteMutation.mutate(engagement.viewerVote === -1 ? 0 : -1)}
                >
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
              <span className="kick hub-feed-card__replies">
                {engagement.replies} {engagement.replies === 1 ? "reply" : "replies"}
              </span>
            </div>
          )}
          {(isSpotted || isBoard) && (
            <button
              type="button"
              className="hub-feed-card__open"
              onClick={(e) => {
                e.stopPropagation();
                openCard();
              }}
            >
              {openLabelFor(item)} <span aria-hidden="true">→</span>
            </button>
          )}
          {canNavigateCard && href && (
            <Link href={href} className="hub-feed-card__open" onClick={stopCardNav}>
              {openLabelFor(item)} <span aria-hidden="true">→</span>
            </Link>
          )}
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
    </article>
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

  return body;
}
