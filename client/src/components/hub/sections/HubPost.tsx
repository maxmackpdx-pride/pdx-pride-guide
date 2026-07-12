import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ds";
import ImageUploader from "@/components/ImageUploader";
import { useToast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/boardFeed";
import type { HubFeedPost } from "@shared/schema";

type PostType = "text" | "photo";
type Audience = "ALL" | "RSVPS";

type PostOptions = {
  canPost: boolean;
  hostedEvents: Array<{ id: number; title: string; venueName: string; dayOfWeek?: string | null }>;
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
};

export default function HubPost({ initialType = "text" }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postType, setPostType] = useState<PostType>(initialType === "photo" ? "photo" : "text");
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [eventId, setEventId] = useState<number | "">("");

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
  const showEventPicker = audience === "RSVPS" && hostedEvents.length > 1;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        postType,
        audience,
        body: body.trim() || undefined,
        photoUrl: photoUrl || undefined,
      };
      if (audience === "RSVPS" && eventId !== "") payload.eventId = eventId;
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

  const canSubmit =
    postType === "text"
      ? body.trim().length > 0
      : !!photoUrl;

  if (optionsQuery.isLoading) {
    return (
      <div className="reveal">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--board-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!optionsQuery.data?.canPost) {
    return (
      <div className="reveal">
        <div className="kick" style={{ color: "var(--panel-cyan)" }}>Scene feed</div>
        <h1 className="h1">Post to the feed</h1>
        <div className="card" style={{ padding: 24, marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
            Only approved promoters and site admins can post to the scene feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Share with the scene
      </div>
      <h1 className="h1">Post to the feed</h1>
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", marginBottom: 18 }}>
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
          <div style={{ marginBottom: 16 }}>
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
          className="fin"
          rows={3}
          placeholder={PROMPTS[postType]}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ resize: "vertical", marginBottom: 14 }}
          maxLength={1000}
        />

        <div style={{ marginBottom: 16 }}>
          <div className="kick" style={{ letterSpacing: ".12em", marginBottom: 10 }}>
            Who sees this
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`seg${audience === "ALL" ? " on" : ""}`}
              onClick={() => {
                setAudience("ALL");
                setEventId("");
              }}
            >
              Everyone
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
          {audience === "RSVPS" && hostedEvents.length === 0 && (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--board-muted)" }}>
              RSVP-only posts need at least one live event you host.
            </p>
          )}
          {audience === "RSVPS" && hostedEvents.length > 0 && (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--board-muted)" }}>
              Only members with an active RSVP to {showEventPicker ? "the event you pick" : "your hosted events"} will see this.
            </p>
          )}
        </div>

        {showEventPicker && (
          <div style={{ marginBottom: 16 }}>
            <label className="kick" style={{ display: "block", letterSpacing: ".1em", marginBottom: 8 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="kick" style={{ letterSpacing: ".1em" }}>
            {audience === "ALL" ? "Public to members" : "RSVPs only"}
          </span>
          <div style={{ flex: 1 }} />
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

      <div className="kick" style={{ margin: "30px 0 16px" }}>
        Your recent posts
      </div>
      {mineQuery.isLoading && (
        <div className="card" style={{ padding: "28px 20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--board-muted)" }}>Loading...</p>
        </div>
      )}
      {!mineQuery.isLoading && (mineQuery.data?.length ?? 0) === 0 && (
        <div className="card" style={{ padding: "28px 20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
            Nothing posted yet. What you share will show up here and in the scene feed.
          </p>
        </div>
      )}
      {(mineQuery.data ?? []).map((post) => (
        <div key={post.id} className="card" style={{ padding: "16px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kick" style={{ fontSize: 10.5, letterSpacing: ".06em" }}>
                {post.postType === "photo" ? "Photo" : "Text"}
                {" · "}
                {post.audience === "RSVPS" ? "RSVPs only" : "Everyone"}
                {post.createdAt ? ` · ${timeAgo(post.createdAt)}` : ""}
              </div>
              {post.body && (
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--board-text)" }}>
                  {post.body}
                </p>
              )}
              {post.photoUrl && (
                <img
                  src={post.photoUrl}
                  alt=""
                  style={{
                    marginTop: 12,
                    maxWidth: "100%",
                    maxHeight: 220,
                    borderRadius: 10,
                    border: "1px solid var(--panel-border-2)",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
            <button
              type="button"
              className="kick"
              onClick={() => deleteMutation.mutate(post.id)}
              disabled={deleteMutation.isPending}
              style={{
                flex: "none",
                background: "transparent",
                border: "1px solid var(--panel-border)",
                borderRadius: 6,
                padding: "4px 8px",
                color: "var(--board-muted)",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}