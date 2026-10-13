import { useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowDown, ArrowUp, CalendarDays, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import type { HubFeedEventEmbed, HubFeedItem } from "@shared/hubFeed";
import { hubFeedBadgeColor } from "@shared/hubFeed";
import { parsePacificDateTime } from "@shared/missedConnections";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import UserAvatar from "@/components/UserAvatar";
import RedgifsMedia from "@/components/RedgifsMedia";
import ReportAccount from "@/components/profile/ReportAccount";
import BlockMemberButton from "@/components/profile/BlockMemberButton";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/timeAgo";
import { avatarHrefFor } from "@/lib/avatarLinks";

type Reply = { id: number; body: string; createdAt: string; author: { username: string; displayName?: string | null; photoUrl?: string | null; avatarChoice?: number; avatarRing?: string | null } };
function eventWhen(event: HubFeedEventEmbed) {
  const time = parsePacificDateTime(event.dateStart);
  return time == null ? event.dayOfWeek || "" : new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(time);
}

export default function HubCompactPost({ item, when, openControl, events, onOpenEvent, engagement, onVote, votePending, isFollowing, onToggleFollow }: {
  item: HubFeedItem; when: string; openControl: ReactNode; events: HubFeedEventEmbed[];
  onOpenEvent: (id: number, attendance?: boolean) => void;
  engagement: HubFeedItem["engagement"];
  onVote: (value: -1 | 0 | 1) => void; votePending: boolean;
  isFollowing: boolean; onToggleFollow: () => void;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const isConnection = item.kind === "spotted";
  const isListing = ["gig", "gifting", "sellz", "housing"].includes(item.kind);
  const actor = item.postedBy ?? item.author;
  const username = actor.anonymous ? null : actor.username;
  const own = !!user && username?.toLowerCase() === user.username?.toLowerCase();
  const replies = useQuery<{ replies: Reply[]; count: number }>({
    queryKey: ["/api/content/HUB/replies", engagement?.contentId, user?.id],
    enabled: expanded && !!engagement && !!user,
    queryFn: () => apiRequest("GET", `/api/content/HUB/${engagement!.contentId}/replies`).then(response => response.json()),
  });
  const reply = useMutation({
    mutationFn: () => apiRequest("POST", `/api/content/HUB/${engagement!.contentId}/replies`, { body: draft.trim() }).then(response => response.json()),
    onSuccess: () => {
      setDraft("");
      void cache.invalidateQueries({ queryKey: ["/api/content/HUB/replies", engagement?.contentId] });
      void cache.invalidateQueries({ queryKey: ["/api/hub/feed"] });
    },
    onError: error => toast({ title: parseApiError(error, "Could not post your reply"), variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/hub/feed/posts/${engagement!.contentId}`),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["/api/hub/feed"] });
      void cache.invalidateQueries({ queryKey: ["/api/hub/feed/head"] });
      void cache.invalidateQueries({ queryKey: ["/api/hub/feed/posts/mine"] });
      toast({ title: "Post removed" });
    },
    onError: error => toast({ title: parseApiError(error, "Could not remove your post"), variant: "destructive" }),
  });
  const text = item.text || "";
  const shortened = text.length > 360 && !showFullText ? text.slice(0, 360).trimEnd() + "…" : text;
  const visibleEvents = showAllEvents ? events : events.slice(0, 3);
  const category = isConnection ? "MIZZED CONNECTION" : isListing
    ? ({ gig: "GIGZ", gifting: "GIFTZ", sellz: "SELLZ", housing: "My Hoüz" } as Record<string, string>)[item.kind]
    : item.kind === "event_update" ? "HOST UPDATE" : item.badge;
  const accent = item.kind === "housing"
    ? ({ OFFERING: "var(--neon-orange)", MANAGED: "var(--neon-violet)", FORMING: "var(--neon-yellow)", LOOKING: "var(--neon-cyan)" } as Record<string,string>)[item.listing?.status || item.badge.toUpperCase()] || hubFeedBadgeColor(item.kind)
    : hubFeedBadgeColor(item.kind);
  return <article className={`hub-item hub-item--${item.kind}${isListing ? " hub-item--listing" : ""}`}
    data-status={item.listing?.status || item.badge}
    style={{ "--hub-item-accent": accent } as CSSProperties}>
    <div className="hub-item__identity">
      {!isConnection && <UserAvatar photoUrl={item.author.photoUrl} avatarChoice={item.author.avatarChoice} avatarRing={item.author.avatarRing} displayName={item.author.displayName} username={item.author.username ?? undefined} logoFit={item.author.venueLogo} href={avatarHrefFor(item.author)} size={40} />}
      <div className="hub-item__identity-copy">
        {!isConnection && <div className="hub-item__author">{item.author.displayName}</div>}
        <div className="hub-item__meta"><time dateTime={item.createdAt}>{when}</time><span aria-hidden> · </span><span className="hub-item__category">{category}</span>{item.isDemo && <span className="hub-item__demo">DEMO</span>}</div>
        {item.postedBy && <div className="hub-item__posted-by">Posted by <Link href={avatarHrefFor(item.postedBy) || "#"}>{item.postedBy.displayName}</Link></div>}
      </div>
      {username && <details className="hub-item__tools">
        <summary aria-label={`Actions for ${item.author.displayName}'s post`}><MoreHorizontal size={20} aria-hidden /></summary>
        <div className="hub-item__tools-content"><Link href={`/u/${encodeURIComponent(username)}`}>View profile</Link>
          {own && engagement && <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()}>Remove my post</button>}
          {user && !own && <><button type="button" onClick={onToggleFollow}>{isFollowing ? "Unfollow" : "Follow"}</button><BlockMemberButton username={username} blocked={false} /><ReportAccount username={username} /></>}
        </div>
      </details>}
    </div>
    {item.changeLabel && <div className="hub-item__change">{item.changeLabel}</div>}
    {isConnection ? <>
      <h3>{item.title || "Missed connection"}</h3>
      {text && <p>{shortened}</p>}
      <div className="hub-item__context">{item.place || "Around town"} · Anonymous</div>
      {openControl}
    </> : isListing ? <div className={`hub-item__listing${item.photoUrl ? " hub-item__listing--photo" : ""}`}>
      {item.photoUrl && <img className="hub-item__thumbnail" src={item.photoUrl} alt={item.title || category} loading="lazy" />}
      <div className="hub-item__listing-copy"><h3>{item.title || item.action}</h3>
        {item.listing?.price && <strong className="hub-item__price">{item.listing.price}</strong>}
        {text && <p>{shortened}</p>}
        {item.listing && <p className="hub-item__facts">{[item.listing.location, item.listing.timing, item.listing.compensation].filter(Boolean).join(" · ")}</p>}
        {!item.listing?.price && item.kind === "gifting" && <strong className="hub-item__price">{/ISO|Looking/i.test(item.badge) ? "LOOKING" : "FREE"}</strong>}
        {openControl}
      </div>
    </div> : <>
      {item.title && <h3>{item.title}</h3>}
      {item.kind === "rsvp" && <p className="hub-item__rsvp">is going{events[0] ? <> to <strong>{events[0].title}</strong></> : ""}</p>}
      {text && <p>{item.kind === "rsvp" ? <q>{shortened}</q> : shortened}</p>}
      {item.photoUrl && <img className="hub-item__photo" src={item.photoUrl} alt={item.title || `Photo shared by ${item.author.displayName}`} loading="lazy" />}
      {item.mediaUrl && <RedgifsMedia url={item.mediaUrl} title={item.title || "Community post"} />}
      {item.source && <Link className="hub-item__context" href={item.source.href}>{item.source.label}</Link>}
      {!item.source && item.beachLabel && <div className="hub-item__context">{item.beachLabel}</div>}
      {!isListing && item.listing?.timing && <div className="hub-item__context">{item.listing.timing}</div>}
      {events.length > 0 && <div className="hub-item__events" aria-label={events.length > 1 ? `${events.length} events` : "Event"}>
        {visibleEvents.map(event => {
          const poster = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);
          return <div className="hub-item__event" key={event.id}>
            <button type="button" className="hub-item__event-main" onClick={() => onOpenEvent(event.id)} aria-label={`Open ${event.title} at ${event.venueName}`}>
            {poster && item.kind !== "rsvp" && item.kind !== "event_update" ? <img src={poster} alt={`${event.title} flyer`} loading="lazy" /> : <CalendarDays className="hub-item__event-icon" size={22} aria-hidden />}
            <span className="hub-item__event-copy">{item.kind !== "rsvp" && <strong>{event.title}</strong>}<span>{eventWhen(event)}</span><span>{event.venueName}{event.goingCount ? ` · ${event.goingCount} going` : ""}</span></span>
            </button>
            <button type="button" className="hub-item__event-action" onClick={() => onOpenEvent(event.id, true)} aria-label={`${event.viewerIsGoing ? "Manage RSVP for" : "RSVP to"} ${event.title}`}>{event.viewerIsGoing ? "GOING" : "RSVP"}</button>
          </div>;
        })}
        {events.length > 3 && <button className="hub-item__text-action" type="button" onClick={() => setShowAllEvents(value => !value)}>{showAllEvents ? "Show fewer events" : `Show all ${events.length} events`}</button>}
      </div>}
      {openControl}
    </>}
    {text.length > 360 && <button className="hub-item__text-action" type="button" onClick={() => setShowFullText(value => !value)}>{showFullText ? "Show less" : "Read more"}</button>}
    {engagement && <div className="hub-item__engagement">
      <button aria-label="Upvote this post" aria-pressed={engagement.viewerVote === 1} disabled={votePending || !user} onClick={() => onVote(engagement.viewerVote === 1 ? 0 : 1)}><ArrowUp size={19} aria-hidden /></button>
      <output aria-label={`${engagement.score} net votes`}>{engagement.score}</output>
      <button aria-label="Downvote this post" aria-pressed={engagement.viewerVote === -1} disabled={votePending || !user} onClick={() => onVote(engagement.viewerVote === -1 ? 0 : -1)}><ArrowDown size={19} aria-hidden /></button>
      <button className="hub-item__reply-toggle" aria-expanded={expanded} disabled={!user} onClick={() => setExpanded(value => !value)}><MessageCircle size={18} aria-hidden />{replies.data?.count ?? engagement.replies} {(replies.data?.count ?? engagement.replies) === 1 ? "reply" : "replies"}</button>
    </div>}
    {expanded && engagement && <section className="hub-item__thread" aria-label="Replies">
      {replies.isPending && <p role="status">Loading replies…</p>}
      {replies.isError && <p role="alert">Replies didn’t load. <button onClick={() => void replies.refetch()}>Try again</button></p>}
      {replies.data?.replies.map(row => <div className="hub-item__reply" key={row.id}><Link href={`/u/${encodeURIComponent(row.author.username)}`}>{row.author.displayName || row.author.username}</Link><time dateTime={row.createdAt}>{timeAgo(row.createdAt)}</time><p>{row.body}</p></div>)}
      <form onSubmit={event => { event.preventDefault(); if (draft.trim() && !reply.isPending) reply.mutate(); }}><label className="sr-only" htmlFor={`reply-${item.id}`}>Write a reply</label><textarea id={`reply-${item.id}`} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a reply…" maxLength={500} rows={2} /><button className="hub-reader__icon" type="submit" aria-label="Post reply" disabled={!draft.trim() || reply.isPending}><Send size={18} aria-hidden /></button></form>
    </section>}
  </article>;
}
