import { useState, type MouseEvent } from "react";
import UserAvatar from "@/components/UserAvatar";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ProfileBoardPost } from "./types";
import "./UpdatesPanel.css";

export type UpdatesAuthor = {
  photoUrl?: string | null;
  displayName?: string | null;
  avatarRing?: string | null;
  avatarChoice?: number;
  username: string;
};

/** Posts carry engagement counts from the public profile boardPosts API. */
export type UpdatesPost = ProfileBoardPost & {
  likes?: number;
  replies?: number;
  contentType?: string;
};

type Props = {
  posts: UpdatesPost[];
  author: UpdatesAuthor;
  onPostClick?: (post: UpdatesPost) => void;
  /** Override the right-side meta label. Defaults to POSTS BY {name}. */
  metaLabel?: string;
  /** Called after a successful like toggle so the parent can refresh. */
  onLikeChange?: (post: UpdatesPost, likes: number, liked: boolean) => void;
};

function updatesWhen(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const ms = Date.now() - then;
  if (ms < 0) return "JUST NOW";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return mins === 1 ? "1 MIN AGO" : `${mins} MINS AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 HOUR AGO" : `${hrs} HOURS AGO`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 DAY AGO";
  if (days < 7) return `${days} DAYS AGO`;
  if (days < 14) return "1 WEEK AGO";
  if (days < 30) return `${Math.floor(days / 7)} WEEKS AGO`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}

function contentTypeForPost(post: UpdatesPost): string | null {
  if (post.contentType) return String(post.contentType).toUpperCase();
  const b = (post.board || "").toLowerCase();
  if (b === "gigs") return "GIG";
  if (b === "gifting") return "GIFTING";
  if (b === "spotted") return "SPOTTED";
  if (b === "updates" || b === "hub") return "HUB";
  return null;
}

export default function UpdatesPanel({ posts, author, onPostClick, metaLabel, onLikeChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  if (!posts.length) return null;

  const name = (author.displayName || author.username || "Member").trim();
  const rightMeta = metaLabel || `POSTS BY ${name.toUpperCase()}`;

  const likeKey = (post: UpdatesPost) => `${contentTypeForPost(post) || post.board}-${post.id}`;

  const handleLike = async (post: UpdatesPost, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const type = contentTypeForPost(post);
    if (!type) return;
    if (!user) {
      toast({ title: "Sign in to like posts", duration: 2200 });
      return;
    }
    const key = likeKey(post);
    if (pending[key]) return;
    setPending(p => ({ ...p, [key]: true }));
    try {
      const res = await apiRequest("POST", `/api/content/${encodeURIComponent(type)}/${post.id}/like`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { liked: boolean; likes: number };
      setLocalLikes(prev => ({ ...prev, [key]: body.likes }));
      onLikeChange?.(post, body.likes, body.liked);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not update like"), variant: "destructive" });
    } finally {
      setPending(p => ({ ...p, [key]: false }));
    }
  };

  return (
    <section className="pp-updates" aria-label="Updates">
      <div className="pp-updates__head">
        <span className="pp-updates__kicker">
          <span className="pp-updates__dot" aria-hidden="true" />
          UPDATES
        </span>
        <span className="pp-updates__meta">{rightMeta}</span>
      </div>

      <div className="pp-updates__rail" role="list">
        {posts.map(post => {
          const when = updatesWhen(post.createdAt);
          const key = likeKey(post);
          const likes = localLikes[key] ?? (typeof post.likes === "number" ? post.likes : 0);
          const replies = typeof post.replies === "number" ? post.replies : 0;
          const canLike = !!contentTypeForPost(post);
          const clickable = typeof onPostClick === "function";

          const body = (
            <>
              <div className="pp-updates__card-head">
                <UserAvatar
                  photoUrl={author.photoUrl}
                  avatarChoice={author.avatarChoice}
                  avatarRing={author.avatarRing}
                  displayName={author.displayName}
                  username={author.username}
                  size={30}
                />
                <div className="pp-updates__card-id">
                  <div className="display pp-updates__name">{name}</div>
                  {when ? <div className="pp-updates__when">{when}</div> : null}
                </div>
              </div>
              <p className="pp-updates__text">{post.text}</p>
              <div className="pp-updates__footer">
                {canLike ? (
                  <button
                    type="button"
                    className="pp-updates__stat pp-updates__stat--likes pp-updates__like-btn"
                    onClick={e => handleLike(post, e)}
                    disabled={!!pending[key]}
                    aria-label={`Like this post (${likes})`}
                  >
                    ♥ {likes}
                  </button>
                ) : (
                  <span className="pp-updates__stat pp-updates__stat--likes">♥ {likes}</span>
                )}
                <span className="pp-updates__stat pp-updates__stat--replies">💬 {replies}</span>
              </div>
            </>
          );

          if (clickable) {
            return (
              <button
                key={key}
                type="button"
                role="listitem"
                className="pp-updates__card pp-updates__card--btn"
                onClick={() => onPostClick(post)}
              >
                {body}
              </button>
            );
          }

          return (
            <article key={key} role="listitem" className="pp-updates__card">
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}
