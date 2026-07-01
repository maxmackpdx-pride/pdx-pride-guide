import { MapPin } from "lucide-react";
import type { MissedConnectionPost } from "./MissedConnectionsPanel";

const ACCENT_CYCLE = ["#19E3FF", "#FF00CC", "#39FF14", "#A855F7", "#FF6600"];

export function spottedAccent(id: number): string {
  return ACCENT_CYCLE[Math.abs(id) % ACCENT_CYCLE.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function SpottedCard({
  post,
  accentColor,
  onReply,
  animDelay = 0,
}: {
  post: MissedConnectionPost;
  accentColor: string;
  onReply: () => void;
  animDelay?: number;
}) {
  const location = post.eventTitle || post.eventVenue || post.venueHint || "Around Town";
  const isClosed = post.status === "CLOSED" || post.status === "ARCHIVED";

  return (
    <article
      className="spotted-card"
      style={{ "--spotted-accent": accentColor, animationDelay: `${animDelay}ms` } as React.CSSProperties}
    >
      {isClosed && <div className="spotted-card__found-stamp" aria-label="Found" />}

      <span className="spotted-card__quote-mark" aria-hidden="true">❝</span>

      <p className="spotted-card__body">{post.body}</p>

      <div className="spotted-card__footer">
        <span className="spotted-card__location">
          <MapPin size={10} strokeWidth={2.5} />
          {location}
        </span>
        <span className="spotted-card__meta">
          {post.isMine ? "Your post" : "Anonymous"} · {timeAgo(post.createdAt)}
        </span>
      </div>

      {!post.isMine && !isClosed && (
        <button
          type="button"
          className="spotted-card__msg-btn"
          onClick={onReply}
          aria-label={`Message about: ${post.title || post.body.slice(0, 40)}`}
        >
          MESSAGE →
        </button>
      )}
    </article>
  );
}
