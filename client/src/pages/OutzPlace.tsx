import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ExternalLink, Lock, MapPin, MessageCircle, TentTree } from "lucide-react";
import { Badge, Button } from "@/components/ds";
import AuthModal from "@/components/AuthModal";
import BoardHero from "@/components/BoardHero";
import OutzMap, { outzAccentForName } from "@/components/OutzMap";
import { useAuth } from "@/context/AuthContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OUTZ_BUTTON_ACCENT, OUTZ_KIND_META, OUTZ_MOTIF, outzTempLabel } from "@/lib/outzKinds";
import {
  beachCheckinDateOptions,
  defaultDepartHour,
  formatBeachCheckinDateLabel,
  formatRiverBratsHour,
  formatRiverBratsWindow,
  pacificTodayDate,
} from "@shared/riverBrats";
import { outzPlaceFromSlug, type OutzSnapshot } from "@shared/outz";
import "./OutzPlace.css";

type OutzPayload = { data: OutzSnapshot };
type Checkin = {
  id: number;
  userId: number;
  arrivalHour: number;
  departHour: number;
  note?: string | null;
  displayName?: string;
  username?: string;
  isAnonymous?: boolean;
  isMine?: boolean;
  masked?: boolean;
};
type ChatPayload = {
  chatOpen: boolean;
  expiresAt: string | null;
  members: Array<{ userId: number; displayName?: string; username?: string }>;
  messages: Array<{ id: number; body: string; createdAt: string; displayName?: string; username?: string; isMine?: boolean }>;
};
type RatingPayload = { count: number; average: number | null; mine: number | null };
type WallPost = {
  id: number;
  postKind: "LOOKING_FOR_COMPANY" | "CARPOOL" | "TRIP_NOTE";
  body: string;
  tripDate: string | null;
  createdAt: string;
  displayName?: string;
  username?: string;
  isMine?: boolean;
  comments: Array<{ id: number; body: string; createdAt: string; displayName?: string; username?: string; isMine?: boolean }>;
};

const STAY_PRESENTATION: Record<string, { accent: string; label: string; logo?: string; motif: string }> = {
  "we-moon-land": { accent: "#ff1fa0", label: "QUEER STAY", motif: "adventure-map-waterfall-route.svg" },
  "bamboo-acres": { accent: "#ccff00", label: "QUEER STAY", motif: "alpine-lake-loop-lime.svg" },
  "triangle-recreation-camp": {
    accent: "#19e3ff",
    label: "QUEER CAMPGROUND",
    logo: "/directory-logos/Triangle_Recreation_Camp.png",
    motif: "topographic-twin-summits.svg",
  },
  "umpquas-last-resort": { accent: "#ff8c00", label: "TRIP LEAD", motif: "canyon-overlook-orange.svg" },
};

function formatChatClose(expiresAt: string | null) {
  if (!expiresAt) return "Check in to open the room";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Chat closed";
  const hours = Math.floor(ms / 3_600_000);
  return hours > 0 ? `Open for ${hours}h more` : "Open for less than an hour";
}

export default function OutzPlace() {
  const [, params] = useRoute("/outz/:placeSlug");
  const slug = params?.placeSlug;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [date, setDate] = useState(() => pacificTodayDate());
  const [selectedDates, setSelectedDates] = useState<string[]>(() => [pacificTodayDate()]);
  const [arrivalHour, setArrivalHour] = useState(10);
  const [departHour, setDepartHour] = useState(13);
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [postKind, setPostKind] = useState<WallPost["postKind"]>("LOOKING_FOR_COMPANY");
  const [postBody, setPostBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  const snapshotQuery = useQuery<OutzPayload>({
    queryKey: ["/api/outz"],
    queryFn: () => apiRequest("GET", "/api/outz").then(r => r.json()),
  });
  const snapshot = snapshotQuery.data?.data;
  const place = snapshot ? outzPlaceFromSlug(snapshot, slug) : null;
  const placeId = place?.id ?? null;

  /* The place contract carries no conditions or coordinates, so pull the full
     record when this listing is a featured destination or a catalog site. */
  const destination = snapshot?.destinations.find(entry => entry.id === placeId) ?? null;
  const catalogSite = snapshot?.catalog.find(entry => entry.id === placeId) ?? null;
  const stay = snapshot?.communityStays.find(entry => entry.id === placeId) ?? null;
  const stayPresentation = stay ? STAY_PRESENTATION[stay.id] ?? { accent: "#ff8c00", label: "TRIP LEAD", motif: "adventure-map-river-pass.svg" } : null;
  const coords: [number, number] | null = destination
    ? [destination.lat, destination.lng]
    : catalogSite
      ? [catalogSite.lat, catalogSite.lng]
      : stay?.lat != null && stay.lng != null
        ? [stay.lat, stay.lng]
        : null;
  const meta = place ? OUTZ_KIND_META[place.kind] : null;

  const checkinKey = ["/api/outz/checkins", placeId, date] as const;
  const checkinsQuery = useQuery<Checkin[]>({
    queryKey: checkinKey,
    queryFn: () => apiRequest("GET", `/api/outz/checkins?place=${encodeURIComponent(placeId!)}&date=${encodeURIComponent(date)}`).then(r => r.json()),
    enabled: Boolean(placeId),
  });
  const checkins = Array.isArray(checkinsQuery.data) ? checkinsQuery.data : [];
  const mine = checkins.find(checkin => checkin.isMine);
  const chatKey = ["/api/outz/chat", placeId] as const;
  const chatQuery = useQuery<ChatPayload>({
    queryKey: chatKey,
    queryFn: () => apiRequest("GET", `/api/outz/chat?place=${encodeURIComponent(placeId!)}`).then(r => r.json()),
    enabled: Boolean(placeId && user),
    refetchInterval: query => query.state.data?.chatOpen ? 8_000 : false,
  });
  const chatOpenForMe = Boolean(chatQuery.data?.chatOpen);
  const ratingKey = ["/api/outz/rating", placeId] as const;
  const ratingQuery = useQuery<RatingPayload>({
    queryKey: ratingKey,
    queryFn: () => apiRequest("GET", `/api/outz/rating?place=${encodeURIComponent(placeId!)}`).then(r => r.json()),
    enabled: Boolean(placeId),
  });
  const wallKey = ["/api/outz/wall", placeId] as const;
  const wallQuery = useQuery<WallPost[]>({
    queryKey: wallKey,
    queryFn: () => apiRequest("GET", `/api/outz/wall?place=${encodeURIComponent(placeId!)}`).then(r => r.json()),
    enabled: Boolean(placeId),
  });

  const dates = useMemo(() => beachCheckinDateOptions(), []);
  const saveCheckin = useMutation({
    mutationFn: () => apiRequest("POST", "/api/outz/checkins", { placeId, dates: selectedDates, arrivalHour, departHour, note, isAnonymous: anonymous }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outz/checkins", placeId] });
      queryClient.invalidateQueries({ queryKey: chatKey });
      const dayCount = selectedDates.length;
      toast({
        title: anonymous ? "Checked in anonymously" : "You’re in the chat",
        description: anonymous
          ? `You’re counted on ${dayCount === 1 ? "that day" : `${dayCount} days`}, but your profile stays out of the room.`
          : `Your ${dayCount === 1 ? "day is" : `${dayCount} days are`} saved. Say hi when you’re ready.`,
      });
    },
    onError: () => toast({ title: "Couldn’t save check-in", description: "Try again in a moment.", variant: "destructive" }),
  });
  const uncheck = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/outz/checkins/${mine?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outz/checkins", placeId] });
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });
  const sendMessage = useMutation({
    mutationFn: () => apiRequest("POST", "/api/outz/chat", { placeId, date, body: message }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
    onError: () => toast({ title: "Couldn’t send message", description: "Check in first, then try again.", variant: "destructive" }),
  });
  const saveRating = useMutation({
    mutationFn: (rating: number) => apiRequest("POST", "/api/outz/rating", { placeId, rating }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ratingKey }),
    onError: () => toast({ title: "Couldn’t save rating", description: "Try again in a moment.", variant: "destructive" }),
  });
  const createWallPost = useMutation({
    mutationFn: () => apiRequest("POST", "/api/outz/wall", { placeId, postKind, body: postBody, tripDate: date }).then(r => r.json()),
    onSuccess: () => {
      setPostBody("");
      queryClient.invalidateQueries({ queryKey: wallKey });
    },
    onError: () => toast({ title: "Couldn’t post to the wall", description: "Try again in a moment.", variant: "destructive" }),
  });
  const createComment = useMutation({
    mutationFn: ({ postId, body }: { postId: number; body: string }) => apiRequest("POST", `/api/outz/wall/${postId}/comments`, { body }).then(r => r.json()),
    onSuccess: (_result, variables) => {
      setCommentDrafts(current => ({ ...current, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: wallKey });
    },
    onError: () => toast({ title: "Couldn’t post comment", description: "Try again in a moment.", variant: "destructive" }),
  });

  usePageSeo(
    place ? `${place.name} · OUTZ | Zaylist` : "OUTZ place | Zaylist",
    place ? `${place.detail} Check in and join the group chat for this OUTZ destination.` : "OUTZ destination check-in and group chat.",
  );

  if (!snapshotQuery.isLoading && !place) {
    return <div className="outz-surface outz-place--missing"><h1>That OUTZ address isn’t current.</h1><Link href="/outz">Back to OUTZ</Link></div>;
  }

  const alert = destination?.alerts[0] ?? null;

  return (
    <div
      className="zine-page board-page outz-surface outz-place pdx-glass-rebind"
      style={meta ? ({ "--c": stayPresentation?.accent ?? meta.accent, "--outz-c": stayPresentation?.accent ?? meta.accent } as React.CSSProperties) : undefined}
    >
      <div className="outz-surface__terrain" aria-hidden="true" />
      <img className="outz-surface__topo" src={`${OUTZ_MOTIF}/topographic-ridge-basin-amber.svg`} alt="" aria-hidden="true" />

      {stay && stayPresentation ? (
        <header className="outz-stay-hero">
          <img className="outz-stay-hero__terrain" src={`${OUTZ_MOTIF}/${stayPresentation.motif}`} alt="" aria-hidden="true" />
          <div className="outz-stay-hero__copy">
            <div className="outz-stay-hero__crumb"><Link href="/">Zaylist</Link><span>/</span><Link href="/outz">OUTZ</Link><span>/</span>{stayPresentation.label}</div>
            <div className="outz-stay-hero__brand pdx-glass-card pdx-glass-rebind">
              {stayPresentation.logo
                ? <div className="outz-stay-hero__logo-well"><img src={stayPresentation.logo} alt={`${stay.name} logo`} /></div>
                : <div className="outz-stay-hero__wordmark" aria-hidden="true">{stay.name}</div>}
              <div className="outz-stay-hero__identity">
                <span>{stayPresentation.label} · OUTZ</span>
                <h1>{stay.name}</h1>
                <p>{stay.detail}</p>
              </div>
            </div>
            <div className="outz-stay-hero__meta">
              <span><MapPin size={15} aria-hidden="true" />{stay.region}</span>
              <span><TentTree size={15} aria-hidden="true" />{stay.kind === "campground" ? "Campground" : "Outdoor stay"}</span>
              <a href={stay.officialUrl} target="_blank" rel="noreferrer">Operator site <ExternalLink size={14} aria-hidden="true" /></a>
            </div>
          </div>
        </header>
      ) : (
        <div className="outz-hero">
          <img className="outz-hero__art" src={`${OUTZ_MOTIF}/adventure-map-alpine-waypoints.svg`} alt="" aria-hidden="true" />
          <BoardHero
            accent="orange"
            kicker={
              <span className="outz-hero__crumb">
                <Link href="/">Zaylist</Link>
                <span className="outz-hero__crumb-sep" aria-hidden="true">/</span>
                <Link href="/outz">OUTZ</Link>
              </span>
            }
            title={place?.name || "Loading place"}
            lede={place?.detail || "Loading official destination details."}
          />
        </div>
      )}

      {/* One facts band. Everything a trip decision needs, said once: what it is,
          who runs it, what the weather is doing, and where it sits. */}
      <section className="outz-section outz-place__brief" aria-label="Before you go">
        <img className="outz-section__art outz-section__art--right" src={`${OUTZ_MOTIF}/topographic-canyon-pass.svg`} alt="" aria-hidden="true" />
        <div className={`outz-place__facts${stay ? " outz-place__facts--stay" : ""}`}>
          <div className="outz-place__tags">
            {meta ? <Badge color={meta.color} variant="outline">{meta.label}</Badge> : null}
            <Badge variant="paper">{place?.sourceName}</Badge>
          </div>

          {destination ? (
            <dl className="outz-place__readings">
              <div><dt>Temp</dt><dd>{outzTempLabel(destination.airTempF)}</dd></div>
              <div><dt>Forecast</dt><dd>{destination.forecast || "—"}</dd></div>
              <div><dt>Wind</dt><dd>{destination.wind || "—"}</dd></div>
            </dl>
          ) : null}

          {stay ? <div className="outz-stay-facts">
              <article><span>Before you go</span><p>{stay.accessNote}</p></article>
              <article><span>Why it’s here</span><p>{stay.inclusionNote}</p></article>
            </div> : alert
            ? <div className="outz-place__alert outz-place__alert--bad"><strong>⚠ Alert:</strong><span>{alert.headline}</span></div>
            : destination
              ? <div className="outz-place__alert outz-place__alert--good"><strong>No active NWS alert.</strong><span>Conditions change fast. Confirm on the official page before you drive.</span></div>
              : <div className="outz-place__alert outz-place__alert--warn"><strong>No live conditions for this listing.</strong><span>Confirm access, reservations, and closures on the official page before you drive.</span></div>}

          <p className="outz-place__official">
            {place?.sourceStatus ? <><span>{stay ? "Listing review" : "Official status"}</span> {place.sourceStatus}</> : null}
            {place?.officialUrl
              ? <a href={place.officialUrl} target="_blank" rel="noreferrer">Official details ↗</a>
              : <em>Official source has no direct visitor page.</em>}
          </p>
        </div>

        <div className="outz-place__where">
          {coords && snapshot
            ? <div className="outz-place__map">
                <OutzMap
                  destinations={destination ? [destination] : []}
                  catalog={catalogSite ? [catalogSite] : []}
                  stays={stay ? [stay] : []}
                  center={coords}
                  zoom={stay && !destination && !catalogSite ? 9 : 11}
                  minimal
                  accent={place ? outzAccentForName(place.name, place.kind) : null}
                />
              </div>
            : null}
          <p className="outz-place__map-note">
            {coords
              ? stay ? "The pin shows the public town or region—not a private driveway. Get arrival details from the operator." : "Pin is the official record's published point, not a guaranteed trailhead or parking entrance."
              : stay ? "This stay keeps its visitor location private. Contact the operator before making the trip." : "This listing has no published coordinates. Use the official page for directions and parking."}
          </p>
        </div>
      </section>

      <section className={`outz-section outz-community${stay ? " outz-community--stay" : ""}`} aria-labelledby="outz-checkin-heading">
        <div className="outz-community__head">
          <p>{stay ? `${stayPresentation?.label} · COMMUNITY` : "YOUR TRIP"}</p>
          <h2 id="outz-checkin-heading">Check in. <span>You’re in the chat.</span></h2>
          <div className="outz-community__lede">Pick one or more days, say roughly when you’ll be there, and meet the other people making the trip. One destination room stays open through your last selected day.</div>
        </div>
        <div className="outz-community__pulse pdx-glass-rebind"><i aria-hidden="true" /><span>{checkins.length ? `${checkins.length} ${checkins.length === 1 ? "person is" : "people are"} going ${formatBeachCheckinDateLabel(date).toLowerCase()}` : `Be the first to check in for ${formatBeachCheckinDateLabel(date).toLowerCase()}`} · chat opens the moment you check in</span></div>
        <div className="outz-place__social-grid">
          <div className="outz-checkin outz-panel pdx-glass-card pdx-glass-rebind">
            <div className="outz-checkin__eyebrow">{checkins.length} going {formatBeachCheckinDateLabel(date).toLowerCase()}</div>
            <div className="outz-pillrow" role="group" aria-label="Check-in days (select all that apply)">
              {dates.map(value => {
                const selected = selectedDates.includes(value);
                return <button
                  type="button"
                  key={value}
                  className={selected ? "is-active" : ""}
                  aria-pressed={selected}
                  onClick={() => {
                    setDate(value);
                    setSelectedDates(current => selected
                      ? current.filter(selectedDate => selectedDate !== value)
                      : [...current, value].sort());
                  }}
                >{formatBeachCheckinDateLabel(value)}</button>;
              })}
            </div>
            <p className="outz-checkin__day-help">Select all days that apply. Your time and note will be used for each selected day.</p>
            {mine ? <div className="outz-checkin__mine"><strong>{mine.isAnonymous ? "Anonymous" : "You"} · {formatRiverBratsWindow(mine.arrivalHour, mine.departHour)}</strong><button type="button" onClick={() => uncheck.mutate()} disabled={uncheck.isPending}>Uncheck {formatBeachCheckinDateLabel(date)}</button></div> : null}
            <>
              <div className="outz-checkin__grid">
                <label className="outz-field"><span>Arrival</span>
                  <select value={arrivalHour} onChange={event => { const hour = Number(event.target.value); setArrivalHour(hour); setDepartHour(current => Math.max(current, defaultDepartHour(hour))); }}>
                    {Array.from({ length: 15 }, (_, index) => index + 7).map(hour => <option key={hour} value={hour}>{formatRiverBratsHour(hour)}</option>)}
                  </select>
                </label>
                <label className="outz-field"><span>Leaving about</span>
                  <select value={departHour} onChange={event => setDepartHour(Number(event.target.value))}>
                    {Array.from({ length: 15 }, (_, index) => index + 8).filter(hour => hour > arrivalHour).map(hour => <option key={hour} value={hour}>{formatRiverBratsHour(hour)}</option>)}
                  </select>
                </label>
              </div>
              <label className="outz-field"><span>Optional note</span><input type="text" value={note} maxLength={80} placeholder="e.g. bringing a stove" onChange={event => setNote(event.target.value)} /></label>
              <label className="outz-checkin__anonymous"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /> Count me anonymously (no chat)</label>
              <Button variant="solid" accent={OUTZ_BUTTON_ACCENT[meta?.color || "cyan"]} disabled={saveCheckin.isPending || selectedDates.length === 0} onClick={() => user ? saveCheckin.mutate() : setShowAuth(true)}>{saveCheckin.isPending ? "CHECKING IN" : selectedDates.length > 1 ? `CHECK IN ${selectedDates.length} DAYS · JOIN CHAT` : "CHECK IN · JOIN CHAT"}</Button>
            </>
            <div className="outz-checkin__people">{checkins.map(checkin => <span key={checkin.id}>{checkin.masked ? "Anonymous" : checkin.displayName || checkin.username || "Member"}</span>)}</div>
          </div>

          <section className={`outz-group-chat outz-panel pdx-glass-card pdx-glass-rebind${chatOpenForMe ? " outz-group-chat--open" : ""}`} aria-label={`${place?.name || "OUTZ"} group chat`}>
            <div className="outz-group-chat__head"><MessageCircle size={18} /><div><strong>{place?.name || "OUTZ"} · Group chat</strong><span>{chatOpenForMe ? formatChatClose(chatQuery.data?.expiresAt ?? null) : "Check in to enter"}</span></div></div>
            {!chatOpenForMe ? <div className="outz-group-chat__locked"><Lock size={22} /><p>Your group chat opens as soon as you check in with your profile.</p></div> : <>
              <div className="outz-group-chat__members">{chatQuery.data?.members.length ? `${chatQuery.data.members.length} in chat` : "You’re first in the room"}</div>
              <div className="outz-group-chat__thread">{chatQuery.data?.messages.length ? chatQuery.data.messages.map(chat => <p key={chat.id} className={chat.isMine ? "is-mine" : ""}><strong>{chat.isMine ? "You" : chat.displayName || chat.username || "Member"}</strong>{chat.body}</p>) : <p className="outz-group-chat__empty">You’re in. Say hi to everyone heading here this week.</p>}</div>
              <form onSubmit={event => { event.preventDefault(); if (message.trim()) sendMessage.mutate(); }}><label><span className="sr-only">Message the group</span><input type="text" value={message} maxLength={500} placeholder="Say hi to the group" onChange={event => setMessage(event.target.value)} /></label><Button type="submit" variant="solid" accent="cyan" size="sm" disabled={sendMessage.isPending || !message.trim()}>SEND</Button></form>
            </>}
          </section>
        </div>
      </section>

      <section className="outz-section" aria-labelledby="outz-wall-heading">
        <img className="outz-section__art outz-section__art--right" src={`${OUTZ_MOTIF}/adventure-map-river-pass.svg`} alt="" aria-hidden="true" />
        <div className="outz-place__section-head outz-place__section-head--wall">
          <p>Destination wall</p>
          <h2 id="outz-wall-heading">Find your ride. Find your people.</h2>
          <span>Trip plans, trail partners, and carpools. Community context, never official access or safety information.</span>
        </div>
        <div className="outz-place__wall-grid">
          <div>
            <div className="outz-wall-composer outz-panel pdx-glass-card pdx-glass-rebind">
              <div className="outz-pillrow outz-pillrow--display outz-pillrow--lime" role="group" aria-label="Post type">
                {(["LOOKING_FOR_COMPANY", "CARPOOL", "TRIP_NOTE"] as const).map(kind => <button type="button" key={kind} className={postKind === kind ? "is-active" : ""} onClick={() => setPostKind(kind)}>{kind.replaceAll("_", " ")}</button>)}
              </div>
              <label><span className="sr-only">Your destination post</span><textarea value={postBody} maxLength={500} placeholder={postKind === "CARPOOL" ? "Where are you leaving from, and when?" : postKind === "LOOKING_FOR_COMPANY" ? "What kind of company are you looking for?" : "Share a useful trip note."} onChange={event => setPostBody(event.target.value)} /></label>
              <div className="outz-wall-composer__foot"><span>For {formatBeachCheckinDateLabel(date)}</span><Button variant="solid" accent="lime" size="sm" disabled={createWallPost.isPending || !postBody.trim()} onClick={() => user ? createWallPost.mutate() : setShowAuth(true)}>{createWallPost.isPending ? "POSTING" : "POST TO WALL"}</Button></div>
            </div>
            <div className="outz-wall-feed">
              {wallQuery.data?.length ? wallQuery.data.map(post => <article className="outz-wall-post outz-panel pdx-glass-card pdx-glass-rebind" key={post.id}>
                <header><span>{post.postKind.replaceAll("_", " ")}</span><time dateTime={post.createdAt}>{post.tripDate ? formatBeachCheckinDateLabel(post.tripDate) : "Trip note"}</time></header>
                <p>{post.body}</p>
                <small>{post.isMine ? "You" : post.displayName || post.username || "Member"}</small>
                {post.comments.length ? <div className="outz-wall-post__comments">{post.comments.map(comment => <p key={comment.id}><strong>{comment.isMine ? "You" : comment.displayName || comment.username || "Member"}</strong>{comment.body}</p>)}</div> : null}
                <form onSubmit={event => { event.preventDefault(); const body = commentDrafts[post.id]?.trim(); if (body) user ? createComment.mutate({ postId: post.id, body }) : setShowAuth(true); }}><label><span className="sr-only">Reply to this post</span><input type="text" value={commentDrafts[post.id] || ""} maxLength={300} placeholder="Reply" onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} /></label><Button type="submit" size="sm" disabled={createComment.isPending || !(commentDrafts[post.id] || "").trim()}>REPLY</Button></form>
              </article>) : <div className="outz-wall-empty">No trip posts yet. Be the one who gets the plan moving.</div>}
            </div>
          </div>
          <aside className="outz-rating outz-panel pdx-glass-card pdx-glass-rebind" aria-label="Destination rating">
            <p>Trip signal</p>
            <strong>{ratingQuery.data?.average == null ? "—" : ratingQuery.data.average.toFixed(1)}<small>/5</small></strong>
            <span>{ratingQuery.data?.count || 0} community ratings</span>
            <div className="outz-rating__stars" aria-label="Rate this destination from one to five">
              {[1, 2, 3, 4, 5].map(star => <button type="button" key={star} className={(ratingQuery.data?.mine || 0) >= star ? "is-selected" : ""} aria-label={`Rate ${star} out of 5`} onClick={() => user ? saveRating.mutate(star) : setShowAuth(true)}>★</button>)}
            </div>
            <small>Share your trip signal, not a substitute for official conditions, access, or reservation details.</small>
          </aside>
        </div>
      </section>
      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
    </div>
  );
}
