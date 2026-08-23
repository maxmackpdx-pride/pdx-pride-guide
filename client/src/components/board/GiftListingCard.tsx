import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  applyGiftingRaise,
  beginInFlight,
  endInFlight,
  GIFTING_KEY,
  restoreQueries,
  snapshotQueries,
} from "@/lib/optimisticCache";
import { HeartHandshake, RefreshCw, Share2, ShieldAlert, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { CSSProperties, MouseEvent } from "react";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import { isOpenGrabPost, timeAgo } from "@/lib/boardFeed";

export type GiftingPost = {
  id: number;
  userId: number;
  postType: "GIFT" | "ISO";
  title: string;
  description: string;
  category: string;
  neighborhood: string;
  pickupPreference: string;
  photoUrls: string[];
  status: string;
  createdAt: string;
  expiresAt: string;
  username: string;
  displayName?: string | null;
  posterPhotoUrl?: string | null;
  posterAvatarRing?: string | null;
  avatarChoice?: number;
  interestCount: number;
  viewerSelected?: boolean;
  isMine?: boolean;
  interests?: Array<{ id: number; userId: number; note: string; status: string; username: string; displayName?: string; photoUrl?: string | null; avatarChoice?: number; avatarRing?: string | null }>;
};

/** Deep-glass board accents (SoT §2.4) - Gifting board is lime; grab keeps orange cue. */
const ACCENT = {
  GIFT: "#CCFF00",
  ISO: "#CCFF00",
  GRAB: "#ff8c00",
} as const;

/**
 * Decorative line motifs for deep-glass board cards (Card System §17).
 * Stroke SVGs / quote marks - opacity + placement via .board-glass-motif CSS.
 * Always a single root element (no Fragment) so stacking selectors match.
 */
export function BoardGlassMotif({
  variant,
}: {
  variant: "gift" | "search" | "dollar" | "binoculars" | "quote" | "quote-pair";
}) {
  if (variant === "quote" || variant === "quote-pair") {
    return (
      <span className="board-glass-motif board-glass-motif--quote-wrap" aria-hidden="true">
        <span className="board-glass-motif board-glass-motif--quote">“</span>
        {variant === "quote-pair" ? (
          <span className="board-glass-motif board-glass-motif--quote board-glass-motif--quote-end">
            ”
          </span>
        ) : null}
      </span>
    );
  }

  // Line SVGs from Card System §17 (viewBox 0 0 48 48)
  if (variant === "gift") {
    return (
      <span className="board-glass-motif board-glass-motif--gift" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M8 20h32v6H8zM11 26v14h26V26M24 20v20M24 20c-2-6-9-9-11-6s2 6 11 6M24 20c2-6 9-9 11-6s-2 6-11 6" />
        </svg>
      </span>
    );
  }
  if (variant === "search") {
    return (
      <span className="board-glass-motif board-glass-motif--search" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="21" cy="21" r="12" />
          <path d="M30 30l9 9" />
        </svg>
      </span>
    );
  }
  if (variant === "dollar") {
    return (
      <span className="board-glass-motif board-glass-motif--dollar" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M24 8v32M31 15c0-3-3-5-7-5s-7 2-7 5 3 4 7 5 7 2 7 5-3 5-7 5-7-2-7-5" />
        </svg>
      </span>
    );
  }
  // binoculars (gigs looking)
  return (
    <span className="board-glass-motif board-glass-motif--binoculars" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="16" cy="26" r="8" />
        <circle cx="32" cy="26" r="8" />
        <path d="M24 26c0-3 2-5 4-5M24 26c0-3-2-5-4-5M16 18c0-3 2-5 5-5M32 18c0-3-2-5-5-5" />
      </svg>
    </span>
  );
}

export function ghostLetter(category: string) {
  return (category || "?").trim().charAt(0).toUpperCase();
}

export function kindLabel(post: GiftingPost) {
  if (isOpenGrabPost(post)) return "Open grab";
  if (post.postType === "ISO") return "In search of";
  return "Gift";
}

export function thumbGradient(post: GiftingPost) {
  if (isOpenGrabPost(post)) return "linear-gradient(135deg,#ff8c00,#ccff00)";
  if (post.postType === "ISO") return "linear-gradient(135deg,#ccff00,#a8e600)";
  return "linear-gradient(135deg,#ccff00,#9fd600)";
}

export function cardAccent(post: GiftingPost) {
  if (isOpenGrabPost(post)) return ACCENT.GRAB;
  return post.postType === "ISO" ? ACCENT.ISO : ACCENT.GIFT;
}

export function giftingMotifVariant(post: GiftingPost): "gift" | "search" {
  return post.postType === "ISO" ? "search" : "gift";
}

function cardStatus(post: GiftingPost) {
  if (post.status === "PENDING") return "Pending admin review";
  if (post.viewerSelected && post.postType === "GIFT") return "Hand raised";
  if (post.viewerSelected && post.postType === "ISO") return "Offer sent";
  if (post.postType === "ISO") return "Open · make an offer";
  if (isOpenGrabPost(post)) return "First come · grab it";
  if (post.interestCount >= 3) return "3 of 3 hands up";
  return `${post.interestCount} of 3 hands up`;
}

function cardCta(post: GiftingPost) {
  if (post.viewerSelected && post.postType === "GIFT") return "Hand raised";
  if (post.viewerSelected && post.postType === "ISO") return "Offer sent";
  if (post.postType === "ISO") return "Offer it";
  if (isOpenGrabPost(post)) return "Grab it";
  if (post.interestCount >= 3) return "Full";
  return "Raise hand";
}

type Props = {
  post: GiftingPost;
  expanded: boolean;
  onToggle: () => void;
  onRequireAuth: () => void;
  /** Called after the post is deleted (so an overlay host can close). */
  onDeleted?: () => void;
};

export default function GiftListingCard({ post, expanded, onToggle, onRequireAuth, onDeleted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [reportText, setReportText] = useState("");
  const raisePendingRef = useRef(new Set<number>());

  const accent = cardAccent(post);
  const showDots = post.postType === "GIFT" && !isOpenGrabPost(post);
  const grab = isOpenGrabPost(post);

  const actionMutation = useMutation({
    mutationFn: async ({ url, data }: { url: string; data?: any }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      return res;
    },
    onMutate: async ({ url }) => {
      const isRaise = /\/(interest|offer)$/.test(url);
      if (!isRaise) return { isRaise: false };
      const snap = await snapshotQueries(queryClient, GIFTING_KEY);
      applyGiftingRaise(queryClient, post.id);
      return { isRaise: true, snap };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.snap) restoreQueries(queryClient, ctx.snap);
      toast({ title: "Could not update", description: err.message, variant: "destructive" });
    },
    onSettled: (_data, _err, vars) => {
      if (/\/(interest|offer)$/.test(vars.url)) endInFlight(raisePendingRef.current, post.id);
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gifting/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gifting/mine"] });
      toast({ title: "Post deleted" });
      onDeleted?.();
    },
    onError: (err: any) => toast({ title: "Could not delete", description: err.message, variant: "destructive" }),
  });

  const handleDelete = () => {
    if (!confirm(`Delete "${post.title}"? This removes it from the board.`)) return;
    deleteMutation.mutate(post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/z/gifz?post=${post.id}`;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: post.title, url });
      else await navigator.clipboard.writeText(url);
      toast({ title: canShare ? "Shared" : "Link copied" });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast({ title: "Could not share", variant: "destructive" });
      }
    }
  };

  const submitResponse = (endpoint: "interest" | "offer") => {
    if (!user) return onRequireAuth();
    const trimmed = note.trim();
    // Open Grab can proceed without a note; gift interest / ISO offer need one
    if (!isOpenGrabPost(post) && !trimmed) {
      return toast({ title: "Add a short note first", variant: "destructive" });
    }
    if (!beginInFlight(raisePendingRef.current, post.id)) return;
    actionMutation.mutate({ url: `/api/gifting/${post.id}/${endpoint}`, data: { note: trimmed } });
    setNote("");
  };

  const glassVars = {
    "--listing-accent": accent,
    "--c": accent,
    "--_c": accent,
    position: "relative",
  } as CSSProperties;
  const isDemo = post.username === "hausing_demo";

  return (
    <article
      id={`board-post-${post.id}`}
      className={[
        "board-listing-card board-listing-card--makeover board-listing-card--glass",
        post.postType === "ISO" ? "is-iso is-dashed" : "is-giving",
        expanded ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={glassVars}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        // Don't steal Space/Enter from the reply note textarea (or any field).
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {isDemo ? <span className="pdx-demo-sticker" aria-hidden="true">DEMO</span> : null}
      <BoardGlassMotif variant={giftingMotifVariant(post)} />
      <div className="board-listing-card__row">
        <div
          className="board-listing-card__thumb"
          style={post.photoUrls?.[0] ? undefined : { background: thumbGradient(post) }}
        >
          {post.photoUrls?.[0] ? (
            <img src={post.photoUrls[0]} alt="" />
          ) : (
            <>
              <span className="board-listing-card__ghost" aria-hidden="true">
                {ghostLetter(post.category)}
              </span>
              <div className="board-listing-card__thumb-fallback" aria-hidden="true" />
            </>
          )}
          {grab && <span className="board-listing-card__grab-badge">Grab</span>}
          {!grab && (post.photoUrls?.length || 0) > 0 && (
            <span className="board-listing-card__thumb-badge">▦ {post.photoUrls.length}</span>
          )}
        </div>
        <div className="board-listing-card__main">
          <div className="board-listing-card__tags">
            <span className="board-listing-card__kind board-listing-card__kind--text">
              {kindLabel(post)}
            </span>
            <span className="board-listing-card__time">{timeAgo(post.createdAt)}</span>
          </div>
          <h4 className="board-listing-card__title">{post.title}</h4>
          <div className="board-listing-card__poster">
            <UserAvatar
              photoUrl={post.posterPhotoUrl}
              avatarChoice={post.avatarChoice}
              avatarRing={post.posterAvatarRing}
              displayName={post.displayName}
              username={post.username}
              href={memberProfileHref(post.username)}
              onClick={(e: MouseEvent) => e.stopPropagation()}
              size={18}
            />
            <span>@{post.username} · {post.neighborhood || "Portland"}</span>
          </div>
          <div className="board-listing-card__footer">
            <div className="board-listing-card__status-wrap">
              {showDots && (
                <div className="board-listing-card__dots">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className={`board-listing-card__dot${i < post.interestCount ? " is-filled" : ""}`}
                    />
                  ))}
                </div>
              )}
              <span className="board-listing-card__status">{cardStatus(post)}</span>
            </div>
            <span className="board-listing-card__cta">{cardCta(post)} →</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
          {post.photoUrls?.length ? (
            <div className="gifting-photo-gallery" aria-label={`${post.photoUrls.length} listing photos`}>
              {post.photoUrls.map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt={`${post.title}, photo ${index + 1} of ${post.photoUrls.length}`} />
              ))}
            </div>
          ) : null}
          <p>{post.description}</p>
          <div className="gifting-details">{post.category} · {post.pickupPreference}</div>
          <div className="gifting-listing-actions">
            <button type="button" onClick={handleShare}><Share2 size={14} /> Share listing</button>
            {post.viewerSelected ? <span>Selected · check your inbox to coordinate</span> : null}
          </div>
          {!post.isMine && !["GIFTED", "FOUND", "EXPIRED", "PENDING"].includes(post.status) && (
            <div className="gifting-response">
              <textarea
                placeholder={
                  grab
                    ? "Say hi (optional), then head over."
                    : post.postType === "GIFT"
                      ? "Short note: why you would use this."
                      : "Tell them what you have."
                }
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={240}
              />
              <button
                onClick={() => submitResponse(post.postType === "GIFT" ? "interest" : "offer")}
                disabled={
                  actionMutation.isPending
                  || post.viewerSelected
                  || (!grab && post.postType === "GIFT" && post.interestCount >= 3)
                }
              >
                {post.viewerSelected
                  ? post.postType === "GIFT" ? "Hand raised" : "Offer sent"
                  : grab
                    ? "On my way, grab it"
                    : post.postType === "GIFT" && post.interestCount >= 3
                      ? "Full, poster is choosing"
                      : post.postType === "GIFT"
                        ? "I'm interested"
                        : "I have this"}
              </button>
            </div>
          )}
          {post.isMine && (
            <div className="gifting-owner">
              {post.status === "PENDING" && (
                <p className="gifting-pending-note">
                  Held for admin review. Only you see this on the board until it&apos;s approved.
                </p>
              )}
              {post.interests?.length ? (
                <div className="gifting-interest-list">
                  {post.interests.map(i => (
                    <div key={i.id} className="gifting-interest-row">
                      <UserAvatar
                        photoUrl={i.photoUrl}
                        avatarChoice={i.avatarChoice}
                        avatarRing={i.avatarRing}
                        displayName={i.displayName}
                        username={i.username}
                        href={memberProfileHref(i.username)}
                        size={28}
                      />
                      <span>{i.displayName || i.username}: {i.note}</span>
                      {i.status === "INTERESTED" && (
                        <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/interests/${i.id}/choose` })}>
                          Pick
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No responses yet.</p>
              )}
              {post.postType === "GIFT" && (
                <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-gifted` })}>
                  <HeartHandshake size={14} /> Mark Gifted
                </button>
              )}
              {post.postType === "ISO" && (
                <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/mark-found` })}>
                  <HeartHandshake size={14} /> Mark Found
                </button>
              )}
              <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/reopen` })}>
                <RefreshCw size={14} /> Reopen one spot
              </button>
              <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/renew` })}>
                <RefreshCw size={14} /> Renew once
              </button>
              <button
                type="button"
                className="gifting-delete-btn"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <X size={14} /> Delete post
              </button>
            </div>
          )}
          <details className="gifting-report">
            <summary><ShieldAlert size={13} /> Report</summary>
            <input
              placeholder="What's wrong?"
              value={reportText}
              onChange={e => setReportText(e.target.value)}
            />
            <button onClick={() => actionMutation.mutate({ url: `/api/gifting/${post.id}/report`, data: { reason: reportText } })}>
              Send report
            </button>
          </details>
        </div>
      )}
    </article>
  );
}
