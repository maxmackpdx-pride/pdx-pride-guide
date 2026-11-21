import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import { CardHeartButton } from "../CardHeartButton";
import { useState } from "react";
import { Heart } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useHeart, type HeartSnapshot } from "@/hooks/useHearts";
import { useSavedEvents } from "@/hooks/useSavedEvents";

type ReadQuery = { isPending: boolean; isError: boolean; error: unknown; refetch: () => Promise<unknown> };

export function EventReadStatus({ label, query }: { label: string; query: ReadQuery }) {
  if (query.isPending) return <p role="status">Loading {label.toLowerCase()}…</p>;
  const restricted = query.error instanceof Error && /^(401|403):/.test(query.error.message);
  return <p role="status">{restricted ? `${label} are restricted for this account.` : `${label} are unavailable.`}{" "}
    {!restricted && <button type="button" onClick={() => void query.refetch()}>Try again</button>}
  </p>;
}

export function EventPrivateSaveButton({ eventId, poster = false }: { eventId: number; poster?: boolean }) {
  const { user } = useAuth();
  const saves = useSavedEvents();
  const [auth, setAuth] = useState(false);
  const saved = saves.savedIds.has(eventId);
  return <>
    <button type="button" className={poster ? "osave" : "evz-x__savet"} aria-pressed={saved}
      disabled={saves.loading || saves.pending} onClick={() => !user ? setAuth(true) : saves.error ? void saves.retry() : saves.toggleSave(eventId)}>
      {saves.pending ? "Saving…" : saves.error ? "Retry private saves" : saved ? "Saved privately · Remove" : "Save privately to My Schedule"}
    </button>
    {auth && <AuthModal onClose={() => setAuth(false)} />}
  </>;
}

/**
 * The heart on an expanded event card (Tucker's ruling, Nov 19, 2026):
 * the heart means "you're interested" — the same function as the front
 * card's heart, driving the one shared interested (follow) state from
 * useHeart, never a separate save/favorite state. Filled = interested.
 * `variant` picks the footer's skin: "poster" for the FlyerBoard open
 * card (.oheart), "expanded" for EventzExpanded (.evz-x__heart).
 */
export function EventInterestedHeart({ eventId, snapshot, variant }: { eventId: number; snapshot: HeartSnapshot; variant: "poster" | "expanded" }) {
  const { hearted, signedIn, pending, toggle } = useHeart("event", String(eventId), snapshot);
  const [auth, setAuth] = useState(false);
  if (eventId <= 0) return null;
  return <>
    <button type="button" className={variant === "poster" ? "oheart" : "evz-x__heart"} aria-pressed={hearted}
      aria-label={hearted ? `Remove interest in ${snapshot.title}` : `Mark interest in ${snapshot.title}`}
      title={hearted ? "Interested" : "Mark interest"}
      disabled={pending}
      onClick={(e) => { e.stopPropagation(); signedIn ? toggle() : setAuth(true); }}>
      <Heart size={variant === "poster" ? 20 : 19} aria-hidden="true" fill={hearted ? "currentColor" : "none"} />
    </button>
    {auth && <AuthModal onClose={() => setAuth(false)} />}
  </>;
}

/** All closed event sizes use the same interest record as the expanded footer. */
export function EventFrontHeart({ listing, className }: { listing: EventListing; className: string }) {
  const [auth, setAuth] = useState(false);
  const heart = useHeart("event", String(listing.id), {
    title: listing.title, subtitle: listing.venueName, image: listing.posterImageUrl,
    href: eventPath(listing.id, listing.title, listing.dayOfWeek), accent: listing.accentColor,
  });
  return <>
    <CardHeartButton className={className} active={heart.hearted} disabled={heart.pending || heart.loading}
      aria-label={heart.hearted ? `Remove interest in ${listing.title}` : `Mark interest in ${listing.title}`}
      onClick={e => { e.stopPropagation(); if (heart.signedIn) heart.toggle(); else setAuth(true); }}/>
    {auth && <AuthModal onClose={() => setAuth(false)}/>}
  </>;
}

export function EventGoingButton({ eventId, past, poster = false }: { eventId: number; past: boolean; poster?: boolean }) {
  const rsvp = useEventRsvp();
  const [options, setOptions] = useState(false);
  const going = rsvp.myEventIds.has(eventId);
  const pending = rsvp.isRsvpPending(eventId);
  if (eventId <= 0) return null;
  return <>
    <button type="button" className={poster ? "ointerested" : "evz-going"} aria-pressed={going}
      aria-expanded={going ? options : undefined} disabled={pending || rsvp.loading}
      onClick={() => rsvp.error ? void rsvp.retry() : going ? setOptions(!options) : rsvp.toggleRsvp(eventId)}>
      {rsvp.error ? "Retry attendance" : past ? "I WENT" : "I'M GOING"}
    </button>
    {going && options && <div className="evz-rsvp-options" role="group" aria-label="Remove my attendance">
      <p>Remove your RSVP and heart?</p>
      <button type="button" disabled={pending} onClick={() => { rsvp.toggleRsvp(eventId, "un-rsvp"); setOptions(false); }}>Un-RSVP</button>
      <button type="button" disabled={pending} onClick={() => { rsvp.toggleRsvp(eventId, "cannot-go"); setOptions(false); }}>Just can’t go</button>
      <button type="button" onClick={() => setOptions(false)}>Keep my spot</button>
    </div>}
    {rsvp.showAuth && <AuthModal onClose={() => rsvp.setShowAuth(false)} />}
  </>;
}

/** The same attendance removal is available from Info and the footer. */
export function EventRemoveAttendance({ eventId }: { eventId: number }) {
  const rsvp = useEventRsvp();
  if (!rsvp.myEventIds.has(eventId)) return null;
  return <button type="button" className="evz-x__managebtn" disabled={rsvp.isRsvpPending(eventId)}
    onClick={() => rsvp.toggleRsvp(eventId)}>Remove my attendance</button>;
}
