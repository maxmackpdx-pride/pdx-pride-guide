import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ds";
import ImageUploader from "@/components/ImageUploader";
import { useToast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/boardFeed";
import type { HubFeedPost } from "@shared/schema";

type PostType = "text" | "photo";
type Audience = "ALL" | "RSVPS";
type PostAs = "self" | "event" | "venue";

type PostOptions = {
  canPost: boolean;
  hostedEvents: Array<{ id: number; title: string; venueName: string; dayOfWeek?: string | null }>;
  ownedVenues?: Array<{ id: number; name: string; type?: string | null; logoUrl?: string | null }>;
};

const POST_TYPES: Array<{ key: PostType; label: string }> = [
  { key: "text", label: "Text" },
  { key: "photo", label: "Photo" },
];

const PROMPTS: Record<PostType, string> = {
  text: "What do you want the scene to know?",
  photo: "Add a caption for your photo (optional)...",
};

type Props = {
  initialType?: PostType;
  /** When rendered inline inside the feed, hide the page-style header. */
  embedded?: boolean;
};

export default function HubPost({ initialType = "text", embedded = false }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postType, setPostType] = useState<PostType>(initialType === "photo" ? "photo" : "text");
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [eventId, setEventId] = useState<number | "">("");
  const [postAs, setPostAs] = useState<PostAs>("self");
  const [identityEventId, setIdentityEventId] = useState<number | "">("");
  const [venueId, setVenueId] = useState<number | "">("");

  const optionsQuery = useQuery<PostOptions>({
    queryKey: ["/api/hub/feed/post-options"],
    queryFn: async () => {
      const r = await fetch("/api/hub/feed/post-options", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load post options");
      return r.json();
    },
  });

  const mineQuery = useQuery<HubFeedPost[]>({
    queryKey: ["/api/hub/feed/posts/mine"],
    queryFn: async () => {
      const r = await fetch("/api/hub/feed/posts/mine", { credentials: "include" });
      if (!r.ok) throw new Error("Could not load your posts");
      return r.json();
    },
    enabled: optionsQuery.data?.canPost === true,
  });

  const hostedEvents = optionsQuery.data?.hostedEvents ?? [];
  const ownedVenues = optionsQuery.data?.ownedVenues ?? [];
  const canPostAsEvent = hostedEvents.length > 0;
  const canPostAsVenue = ownedVenues.length > 0;
  // Only show the RSVP-target picker when posting as yourself; posting as an
  // event already carries its own event, which doubles as the RSVP target.
  const showEventPicker = postAs === "self" && audience === "RSVPS" && hostedEvents.length > 1;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        postType,
        audience,
        postAs,
        body: body.trim() || undefined,
        photoUrl: photoUrl || undefined,
      };
      if (postAs === "event" && identityEventId !== "") {
        // The identity event doubles as the RSVP target when audience is RSVPS.
        payload.eventId = identityEventId;
      } else if (audience === "RSVPS" && eventId !== "") {
        payload.eventId = eventId;
      }
      if (postAs === "venue" && venueId !== "") payload.businessId = venueId;
      const r = await fetch("/api/hub/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not post");
      return data;
    },
    onSuccess: () => {
      setBody("");
      setPhotoUrl("");
      setAudience("ALL");
      setEventId("");
      setPostAs("self");
      setIdentityEventId("");
      setVenueId("");
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed/posts/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
      toast({ title: "Posted to the scene feed" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not post", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/hub/feed/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not remove post");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed/posts/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] });
      toast({ title: "Post removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not remove", description: err.message, variant: "destructive" });
    },
  });

  const identityChosen =
    postAs === "self"
    || (postAs === "event" && identityEventId !== "")
    || (postAs === "venue" && venueId !== "");

  const canSubmit =
    identityChosen &&
    (postType === "text"
      ? body.trim().length > 0
      : !!photoUrl);

  if (optionsQuery.isLoading) {
    return (
      <div className="reveal">
        <div className="card hub-post__empty">
          <p className="hub-post__copy">Loading...</p>
        </div>
      </div>
    );
  }

  if (!optionsQuery.data?.canPost) {
    return (
      <div className={embedded ? undefined : "reveal"}>
        <div className={`card hub-post__card${embedded ? " hub-post__card--compact" : ""}`}>
          <div className="kick hub-post__kick">Post to the feed</div>
          <p className="hub-post__copy">
            Sign in to share with the scene. Posts are public to members by default.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? undefined : "reveal"}>
      {!embedded && (
        <>
          <div className="kick hub-post__kick--page">Share with the scene</div>
          <h1 className="h1">Post to the feed</h1>
        </>
      )}
      <div className={`card hub-post__card${embedded ? " hub-post__card--embedded" : ""}`}>
        {embedded && (
          <div className="kick hub-post__kick">Post to the feed</div>
        )}
        <div className="hub-post__tabs">
          {POST_TYPES.map((pt) => (
            <button
              key={pt.key}
              type="button"
              className={`seg${postType === pt.key ? " on" : ""}`}
              onClick={() => {
                setPostType(pt.key);
                if (pt.key === "text") setPhotoUrl("");
              }}
            >
              {pt.label}
            </button>
          ))}
        </div>

        {postType === "photo" && (
          <div className="hub-post__field">
            <ImageUploader
              endpoint="/api/upload/feed-photo"
              fieldName="photo"
              currentUrl={photoUrl}
              onUploaded={setPhotoUrl}
              label="Upload photo"
            />
          </div>
        )}

        <textarea
          className="fin hub-post__textarea"
          rows={3}
          placeholder={PROMPTS[postType]}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
        />

        {(canPostAsEvent || canPostAsVenue) && (
          <div className="hub-post__audience">
            <div className="kick hub-post__kick--section">Post as</div>
            <div className="hub-post__audience-btns">
              <button
                type="button"
                className={`seg${postAs === "self" ? " on" : ""}`}
                onClick={() => { setPostAs("self"); setIdentityEventId(""); setVenueId(""); }}
              >
                Yourself
              </button>
              {canPostAsEvent && (
                <button
                  type="button"
                  className={`seg${postAs === "event" ? " on" : ""}`}
                  onClick={() => {
                    setPostAs("event");
                    setVenueId("");
                    if (hostedEvents.length === 1) setIdentityEventId(hostedEvents[0].id);
                  }}
                >
                  An event
                </button>
              )}
              {canPostAsVenue && (
                <button
                  type="button"
                  className={`seg${postAs === "venue" ? " on" : ""}`}
                  onClick={() => {
                    setPostAs("venue");
                    setIdentityEventId("");
                    if (ownedVenues.length === 1) setVenueId(ownedVenues[0].id);
                  }}
                >
                  A venue
                </button>
              )}
            </div>
            {postAs === "event" && (
              <select
                className="fin"
                value={identityEventId}
                onChange={(e) => setIdentityEventId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Pick an event…</option>
                {hostedEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}{evt.dayOfWeek ? ` · ${evt.dayOfWeek}` : ""} · {evt.venueName}
                  </option>
                ))}
              </select>
            )}
            {postAs === "venue" && (
              <select
                className="fin"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Pick a venue…</option>
                {ownedVenues.map((biz) => (
                  <option key={biz.id} value={biz.id}>{biz.name}</option>
                ))}
              </select>
            )}
            <p className="hub-post__copy--hint">
              {postAs === "self"
                ? "Shows your profile as the poster."
                : postAs === "event"
                  ? "Shows the event as the poster - your name appears as the co-host who posted."
                  : "Shows the venue as the poster - your name appears as who posted."}
            </p>
          </div>
        )}

        <div className="hub-post__audience">
          <div className="kick hub-post__kick--section">Who sees this</div>
          <div className="hub-post__audience-btns">
            <button
              type="button"
              className={`seg${audience === "ALL" ? " on" : ""}`}
              onClick={() => {
                setAudience("ALL");
                setEventId("");
              }}
            >
              Public
            </button>
            <button
              type="button"
              className={`seg${audience === "RSVPS" ? " on" : ""}`}
              onClick={() => setAudience("RSVPS")}
              disabled={hostedEvents.length === 0}
              title={hostedEvents.length === 0 ? "Host a live event to target RSVPs" : undefined}
            >
              My RSVPs
            </button>
          </div>
          {audience === "ALL" && (
            <p className="hub-post__copy--hint">
              Public posts show in the scene feed for signed-in members.
            </p>
          )}
          {audience === "RSVPS" && hostedEvents.length === 0 && (
            <p className="hub-post__copy--hint">
              RSVP-only posts need at least one live event you host.
            </p>
          )}
          {audience === "RSVPS" && hostedEvents.length > 0 && (
            <p className="hub-post__copy--hint">
              Only members with an active RSVP to {showEventPicker ? "the event you pick" : "your hosted events"} will see this.
            </p>
          )}
        </div>

        {showEventPicker && (
          <div className="hub-post__field">
            <label className="kick hub-post__kick--label">
              Limit to one event (optional)
            </label>
            <select
              className="fin"
              value={eventId}
              onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">All my hosted events</option>
              {hostedEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} · {evt.venueName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="hub-post__actions">
          <span className="kick">
            {audience === "ALL" ? "Public to members" : "RSVPs only"}
          </span>
          <div className="hub-post__actions-spacer" />
          <Button
            variant="neon"
            accent="cyan"
            disabled={!canSubmit || createMutation.isPending || (audience === "RSVPS" && hostedEvents.length === 0)}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Posting..." : "Post it"}
          </Button>
        </div>
      </div>

      {!embedded && (
      <div className="kick hub-post__recent">
        Your recent posts
      </div>
      )}
      {!embedded && mineQuery.isLoading && (
        <div className="card hub-post__empty">
          <p className="hub-post__copy">Loading...</p>
        </div>
      )}
      {!embedded && !mineQuery.isLoading && (mineQuery.data?.length ?? 0) === 0 && (
        <div className="card hub-post__empty">
          <p className="hub-post__copy">
            Nothing posted yet. What you share will show up here and in the scene feed.
          </p>
        </div>
      )}
      {!embedded && (mineQuery.data ?? []).map((post) => (
        <div key={post.id} className="card hub-post__mine">
          <div className="hub-post__mine-row">
            <div className="hub-feed-card__main">
              <div className="kick hub-post__mine-meta">
                {post.postType === "photo" ? "Photo" : "Text"}
                {" · "}
                {post.audience === "RSVPS" ? "RSVPs only" : "Everyone"}
                {post.createdAt ? ` · ${timeAgo(post.createdAt)}` : ""}
              </div>
              {post.body && (
                <p className="hub-post__mine-body">{post.body}</p>
              )}
              {post.photoUrl && (
                <img src={post.photoUrl} alt="" className="hub-post__mine-photo" />
              )}
            </div>
            <button
              type="button"
              className="kick hub-post__remove"
              onClick={() => deleteMutation.mutate(post.id)}
              disabled={deleteMutation.isPending}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}