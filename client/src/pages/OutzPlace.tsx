import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ds";
import AuthModal from "@/components/AuthModal";
import PageHero from "@/components/PageHero";
import { useAuth } from "@/context/AuthContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

function formatChatClose(expiresAt: string | null) {
  if (!expiresAt) return "Check in to open the room";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Chat closed";
  const hours = Math.floor(ms / 3_600_000);
  return hours > 0 ? `Open for ${hours}h more` : "Open for less than an hour";
}

export default function OutzPlace() {
  const [, params] = useRoute("/z/out/:placeSlug");
  const slug = params?.placeSlug;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [date, setDate] = useState(() => pacificTodayDate());
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
  const place = snapshotQuery.data?.data ? outzPlaceFromSlug(snapshotQuery.data.data, slug) : null;
  const placeId = place?.id ?? null;
  const checkinKey = ["/api/outz/checkins", placeId, date] as const;
  const checkinsQuery = useQuery<Checkin[]>({
    queryKey: checkinKey,
    queryFn: () => apiRequest("GET", `/api/outz/checkins?place=${encodeURIComponent(placeId!)}&date=${encodeURIComponent(date)}`).then(r => r.json()),
    enabled: Boolean(placeId),
  });
  const checkins = Array.isArray(checkinsQuery.data) ? checkinsQuery.data : [];
  const mine = checkins.find(checkin => checkin.isMine);
  const chatOpenForMe = Boolean(mine && !mine.isAnonymous);
  const chatKey = ["/api/outz/chat", placeId] as const;
  const chatQuery = useQuery<ChatPayload>({
    queryKey: chatKey,
    queryFn: () => apiRequest("GET", `/api/outz/chat?place=${encodeURIComponent(placeId!)}`).then(r => r.json()),
    enabled: Boolean(placeId && user && chatOpenForMe),
    refetchInterval: chatOpenForMe ? 8_000 : false,
  });
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
    mutationFn: () => apiRequest("POST", "/api/outz/checkins", { placeId, date, arrivalHour, departHour, note, isAnonymous: anonymous }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outz/checkins", placeId] });
      queryClient.invalidateQueries({ queryKey: chatKey });
      toast({ title: anonymous ? "Checked in anonymously" : "You’re in the chat", description: anonymous ? "You’re counted in going, but your profile stays out of the room." : "Say hi when you’re ready." });
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
    place ? `${place.name} · Z/OUT | Zaylist` : "OUTZ place | Zaylist",
    place ? `${place.detail} Check in and join the group chat for this Z/OUT destination.` : "OUTZ destination check-in and group chat.",
  );

  if (!snapshotQuery.isLoading && !place) {
    return <div className="outz-place outz-place--missing"><h1>That OUTZ address isn’t current.</h1><Link href="/z/out">Back to OUTZ</Link></div>;
  }

  return (
    <div className="outz-place board-page">
      <PageHero
        kicker={place ? `Z/OUT/${place.slug}` : "Z/OUT"}
        titleLine1={place?.name || "LOADING PLACE"}
        titleLine2="CHECK IN. FIND YOUR PEOPLE."
        accent="cyan"
        lede={place?.detail || "Loading official destination details."}
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 44%"
        actions={<div className="outz-place__hero-actions"><Link href="/z/out"><Button as="span">ALL OUTZ</Button></Link>{place?.officialUrl ? <a href={place.officialUrl} target="_blank" rel="noreferrer"><Button as="span" variant="solid">OFFICIAL DETAILS ↗</Button></a> : null}</div>}
      />

      {place ? <section className="outz-place__facts pdx-glass-card pdx-glass-rebind">
        <span>{place.kind.replace(/-/g, " ")}</span>
        <strong>{place.sourceName}</strong>
        <p>{place.sourceStatus || "Official status not currently available. Confirm before driving."}</p>
      </section> : null}

      <section className="outz-place__social" aria-labelledby="outz-checkin-heading">
        <div className="outz-place__section-head"><p>YOUR TRIP</p><h2 id="outz-checkin-heading">Check in. You’re in the chat.</h2><span>Pick your day and time. Non-anonymous check-ins open this destination’s group chat.</span></div>
        <div className="outz-place__social-grid">
          <div className="outz-checkin pdx-glass-card pdx-glass-rebind">
            <div className="outz-checkin__eyebrow">{checkins.length} going {formatBeachCheckinDateLabel(date).toLowerCase()}</div>
            <div className="outz-checkin__dates" aria-label="Check-in day">
              {dates.map(value => <button type="button" key={value} className={date === value ? "is-active" : ""} onClick={() => setDate(value)}>{formatBeachCheckinDateLabel(value)}</button>)}
            </div>
            {mine ? <div className="outz-checkin__mine"><strong>{mine.isAnonymous ? "Anonymous" : "You"} · {formatRiverBratsWindow(mine.arrivalHour, mine.departHour)}</strong><button type="button" onClick={() => uncheck.mutate()} disabled={uncheck.isPending}>Uncheck in</button></div> : <>
              <label>Arrival
                <select value={arrivalHour} onChange={event => { const hour = Number(event.target.value); setArrivalHour(hour); setDepartHour(current => Math.max(current, defaultDepartHour(hour))); }}>
                  {Array.from({ length: 15 }, (_, index) => index + 7).map(hour => <option key={hour} value={hour}>{formatRiverBratsHour(hour)}</option>)}
                </select>
              </label>
              <label>Leaving about
                <select value={departHour} onChange={event => setDepartHour(Number(event.target.value))}>
                  {Array.from({ length: 15 }, (_, index) => index + 8).filter(hour => hour > arrivalHour).map(hour => <option key={hour} value={hour}>{formatRiverBratsHour(hour)}</option>)}
                </select>
              </label>
              <label>Optional note<input value={note} maxLength={80} placeholder="e.g. bringing a stove" onChange={event => setNote(event.target.value)} /></label>
              <label className="outz-checkin__anonymous"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /> Count me anonymously (no chat)</label>
              <Button variant="solid" disabled={saveCheckin.isPending} onClick={() => user ? saveCheckin.mutate() : setShowAuth(true)}>{saveCheckin.isPending ? "CHECKING IN" : "CHECK IN · JOIN CHAT"}</Button>
            </>}
            <div className="outz-checkin__people">{checkins.map(checkin => <span key={checkin.id}>{checkin.masked ? "Anonymous" : checkin.displayName || checkin.username || "Member"}</span>)}</div>
          </div>

          <section className={`outz-group-chat pdx-glass-card pdx-glass-rebind${chatOpenForMe ? " outz-group-chat--open" : ""}`} aria-label={`${place?.name || "OUTZ"} group chat`}>
            <div className="outz-group-chat__head"><MessageCircle size={18} /><div><strong>{place?.name || "OUTZ"} · Group chat</strong><span>{chatOpenForMe ? formatChatClose(chatQuery.data?.expiresAt ?? null) : "Check in to enter"}</span></div></div>
            {!chatOpenForMe ? <div className="outz-group-chat__locked"><Lock size={22} /><p>Your group chat opens as soon as you check in with your profile.</p></div> : <>
              <div className="outz-group-chat__members">{chatQuery.data?.members.length ? `${chatQuery.data.members.length} in chat` : "You’re first in the room"}</div>
              <div className="outz-group-chat__thread">{chatQuery.data?.messages.length ? chatQuery.data.messages.map(chat => <p key={chat.id} className={chat.isMine ? "is-mine" : ""}><strong>{chat.isMine ? "You" : chat.displayName || chat.username || "Member"}</strong>{chat.body}</p>) : <p className="outz-group-chat__empty">You’re in. Say hi to everyone heading here this week.</p>}</div>
              <form onSubmit={event => { event.preventDefault(); if (message.trim()) sendMessage.mutate(); }}><label><span className="sr-only">Message the group</span><input value={message} maxLength={500} placeholder="Say hi to the group" onChange={event => setMessage(event.target.value)} /></label><Button type="submit" variant="solid" disabled={sendMessage.isPending || !message.trim()}>SEND</Button></form>
            </>}
          </section>
        </div>
      </section>

      <section className="outz-place__wall" aria-labelledby="outz-wall-heading">
        <div className="outz-place__section-head">
          <p>DESTINATION WALL</p>
          <h2 id="outz-wall-heading">Find your ride. Find your people.</h2>
          <span>Use the wall for trip plans, trail partners, and carpools. It is community context — never official access or safety information.</span>
        </div>
        <div className="outz-place__wall-grid">
          <div className="outz-place__wall-main">
            <div className="outz-wall-composer pdx-glass-card pdx-glass-rebind">
              <div className="outz-wall-composer__types" role="group" aria-label="Post type">
                {(["LOOKING_FOR_COMPANY", "CARPOOL", "TRIP_NOTE"] as const).map(kind => <button type="button" key={kind} className={postKind === kind ? "is-active" : ""} onClick={() => setPostKind(kind)}>{kind.replaceAll("_", " ")}</button>)}
              </div>
              <label><span className="sr-only">Your destination post</span><textarea value={postBody} maxLength={500} placeholder={postKind === "CARPOOL" ? "Where are you leaving from, and when?" : postKind === "LOOKING_FOR_COMPANY" ? "What kind of company are you looking for?" : "Share a useful trip note."} onChange={event => setPostBody(event.target.value)} /></label>
              <div><span>For {formatBeachCheckinDateLabel(date)}</span><Button variant="solid" disabled={createWallPost.isPending || !postBody.trim()} onClick={() => user ? createWallPost.mutate() : setShowAuth(true)}>{createWallPost.isPending ? "POSTING" : "POST TO WALL"}</Button></div>
            </div>
            <div className="outz-wall-feed">
              {wallQuery.data?.length ? wallQuery.data.map(post => <article className="outz-wall-post pdx-glass-card pdx-glass-rebind" key={post.id}>
                <header><span>{post.postKind.replaceAll("_", " ")}</span><time dateTime={post.createdAt}>{post.tripDate ? formatBeachCheckinDateLabel(post.tripDate) : "Trip note"}</time></header>
                <p>{post.body}</p>
                <small>{post.isMine ? "You" : post.displayName || post.username || "Member"}</small>
                <div className="outz-wall-post__comments">{post.comments.map(comment => <p key={comment.id}><strong>{comment.isMine ? "You" : comment.displayName || comment.username || "Member"}</strong>{comment.body}</p>)}</div>
                <form onSubmit={event => { event.preventDefault(); const body = commentDrafts[post.id]?.trim(); if (body) user ? createComment.mutate({ postId: post.id, body }) : setShowAuth(true); }}><label><span className="sr-only">Reply to this post</span><input value={commentDrafts[post.id] || ""} maxLength={300} placeholder="Reply" onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} /></label><Button type="submit" disabled={createComment.isPending || !(commentDrafts[post.id] || "").trim()}>REPLY</Button></form>
              </article>) : <div className="outz-wall-empty">No trip posts yet. Be the one who gets the plan moving.</div>}
            </div>
          </div>
          <aside className="outz-rating pdx-glass-card pdx-glass-rebind" aria-label="Destination rating">
            <p>TRIP SIGNAL</p>
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
