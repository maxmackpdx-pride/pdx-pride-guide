import type { CSSProperties } from "react";
import { MapPin, Share2 } from "lucide-react";
import type { MissedConnectionPost } from "./MissedConnectionsPanel";
import { shareMissedConnectionStory } from "@/lib/shareMissedConnection";
import { useToast } from "@/hooks/use-toast";
import { BoardGlassMotif } from "@/components/board/GiftListingCard";

const ACCENT_CYCLE = ["#19E3FF", "#FF00CC", "#39FF14", "#A855F7", "#FF6600"];
/** Deep-glass board accent for MIZZED CONNECTION (SoT §2.4). */
const MC_GLASS = "#FF00CC";

export function spottedAccent(id: number): string {
  return ACCENT_CYCLE[Math.abs(id) % ACCENT_CYCLE.length];
}

export function spottedTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function spottedPlace(post: MissedConnectionPost): string {
  if (post.eventTitle) {
    return post.eventVenue ? `At ${post.eventTitle} · ${post.eventVenue}` : `At ${post.eventTitle}`;
  }
  if (post.beachId) {
    return post.venueHint || (post.beachId === "rooster-rock" ? "Rooster Rock" : "Sauvie Island");
  }
  return post.venueHint ? `Around town · ${post.venueHint}` : "Around town";
}

export function spottedKind(post: MissedConnectionPost): { label: string; color: string } {
  if (post.eventId != null) return { label: "At an event", color: "#19e3ff" };
  if (post.beachId === "rooster-rock") return { label: "Rooster Rock", color: "#19e3ff" };
  if (post.beachId === "sauvie-island") return { label: "Sauvie Island", color: "#ff6600" };
  if (post.beachId) return { label: "At the beach", color: "#ff6600" };
  return { label: "Around town", color: "#ff8c00" };
}

export default function SpottedCard({
  post,
  accentColor,
  onReply,
  animDelay = 0,
  makeover = false,
}: {
  post: MissedConnectionPost;
  accentColor: string;
  onReply: () => void;
  animDelay?: number;
  makeover?: boolean;
}) {
  const location = post.eventTitle || post.eventVenue || post.venueHint || "Around Town";
  const isClosed = post.status === "CLOSED" || post.status === "ARCHIVED";
  const { toast } = useToast();
  const kind = spottedKind(post);
  const displayTitle = post.title?.trim() || post.body.trim().split(/\n/)[0]?.slice(0, 80) || "Missed connection";

  if (makeover) {
    const glassVars = {
      "--spotted-accent": MC_GLASS,
      "--listing-accent": MC_GLASS,
      "--c": MC_GLASS,
      "--_c": MC_GLASS,
      position: "relative",
    } as CSSProperties;
    return (
      <article
        className="board-spotted-card board-spotted-card--glass"
        style={glassVars}
        onClick={onReply}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onReply();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {post.isDemo ? <span className="pdx-demo-sticker" aria-hidden="true">DEMO</span> : null}
        <BoardGlassMotif variant="quote" />
        {/* Corner tick marks (design board cards) */}
        <span className="board-spotted-card__ticks" aria-hidden="true">”</span>
        <div className="board-spotted-card__meta">
          <span className="board-spotted-card__kind" style={{ color: MC_GLASS }}>MIZZED CONNECTION</span>
          <span className="board-spotted-card__time">{spottedTimeAgo(post.createdAt)}</span>
        </div>
        <h4 className="board-spotted-card__title">{displayTitle}</h4>
        <p className="board-spotted-card__body">{post.body}</p>
        <div className="board-spotted-card__foot">
          <span className="board-spotted-card__place">{spottedPlace(post)}</span>
          {!post.isMine && !isClosed && <span className="board-spotted-card__cta" style={{ color: MC_GLASS }}>Reply →</span>}
        </div>
      </article>
    );
  }

  const handleShare = async () => {
    try {
      const result = await shareMissedConnectionStory({ id: post.id, body: post.body, location, accentColor });
      if (result === "copied") toast({ title: "Image copied", description: "Story image copied to your clipboard and downloaded." });
      else if (result === "downloaded") toast({ title: "Image downloaded", description: "Post it to your Instagram Story." });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast({ title: "Could not create share image", variant: "destructive" });
      }
    }
  };

  const glassAccent = accentColor || MC_GLASS;
  return (
    <article
      className="spotted-card spotted-card--glass"
      style={{
        "--spotted-accent": glassAccent,
        "--c": glassAccent,
        "--_c": glassAccent,
        animationDelay: `${animDelay}ms`,
        position: "relative",
      } as CSSProperties}
    >
      {post.isDemo ? <span className="pdx-demo-sticker" aria-hidden="true">DEMO</span> : null}
      {isClosed && <div className="spotted-card__found-stamp" aria-label="Found" />}

      <BoardGlassMotif variant="quote" />

      <p className="spotted-card__body">{post.body}</p>

      <div className="spotted-card__footer">
        <span className="spotted-card__location">
          <MapPin size={10} strokeWidth={2.5} />
          {location}
        </span>
        <span className="spotted-card__meta">
          {post.isMine ? "Your post" : "Anonymous"} · {spottedTimeAgo(post.createdAt)}
        </span>
      </div>

      <div className="spotted-card__actions">
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
        <button
          type="button"
          className="spotted-card__share-btn"
          onClick={handleShare}
          aria-label="Share as Instagram Story image"
        >
          <Share2 size={12} strokeWidth={2.5} /> SHARE
        </button>
      </div>
    </article>
  );
}
