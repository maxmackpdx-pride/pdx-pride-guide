import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
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

type ContentReplyAuthor = {
  username: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};

type ContentReply = {
  id: number;
  body: string;
  createdAt: string;
  author: ContentReplyAuthor;
};

type RepliesResponse = {
  replies: ContentReply[];
  count: number;
  mode: "thread" | "native";
  nativeHref?: string | null;
};

type Props = {
  posts: UpdatesPost[];
  author: UpdatesAuthor;
  onPostClick?: (post: UpdatesPost) => void;
  /** Override the right-side meta label. Defaults to POSTS BY {name}. */
  metaLabel?: string;
  /** Called after a successful like toggle so the parent can refresh. */
  onLikeChange?: (post: UpdatesPost, likes: number, liked: boolean) => void;
  /** Called after a successful reply so the parent can refresh counts. */
  onReplyChange?: (post: UpdatesPost, replies: number) => void;
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

/** GIG + HUB support public content_replies; SPOTTED / GIFTING stay native (count only). */
function isThreadType(type: string | null): boolean {
  return type === "GIG" || type === "HUB";
}

function nativeHrefFor(type: string | null, postId: number): string | null {
  if (type === "SPOTTED") return "/spotted";
  if (type === "GIFTING") return `/gifting?post=${postId}`;
  if (type === "GIG") return `/pride-work?post=${postId}`;
  return null;
}

function nativeCtaLabel(type: string | null): string {
  if (type === "SPOTTED") return "REPLY VIA SPOTTED";
  if (type === "GIFTING") return "REPLY VIA GIFTING";
  return "OPEN BOARD";
}

export default function UpdatesPanel({
  posts,
  author,
  onPostClick,
  metaLabel,
  onLikeChange,
  onReplyChange,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [localReplies, setLocalReplies] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [threadByKey, setThreadByKey] = useState<Record<string, RepliesResponse | undefined>>({});
  const [threadLoading, setThreadLoading] = useState<Record<string, boolean>>({});
  const [draftByKey, setDraftByKey] = useState<Record<string, string>>({});
  const [replyPending, setReplyPending] = useState<Record<string, boolean>>({});

  const name = (author.displayName || author.username || "Member").trim();
  const rightMeta = metaLabel || `POSTS BY ${name.toUpperCase()}`;

  const likeKey = useCallback(
    (post: UpdatesPost) => `${contentTypeForPost(post) || post.board}-${post.id}`,
    [],
  );

  const loadThread = useCallback(async (post: UpdatesPost, key: string) => {
    const type = contentTypeForPost(post);
    if (!type) return;
    setThreadLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await apiRequest(
        "GET",
        `/api/content/${encodeURIComponent(type)}/${post.id}/replies`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as RepliesResponse;
      setThreadByKey(prev => ({ ...prev, [key]: body }));
      setLocalReplies(prev => ({ ...prev, [key]: body.count }));
    } catch (err) {
      toast({ title: parseApiError(err, "Could not load replies"), variant: "destructive" });
    } finally {
      setThreadLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [toast]);

  // If parent swaps the posts list, close a stale expanded thread.
  useEffect(() => {
    if (!expandedKey) return;
    const stillThere = posts.some(p => likeKey(p) === expandedKey);
    if (!stillThere) setExpandedKey(null);
  }, [posts, expandedKey, likeKey]);

  if (!posts.length) return null;

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

  const handleToggleThread = async (post: UpdatesPost, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const type = contentTypeForPost(post);
    if (!type) return;
    const key = likeKey(post);
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    if (!threadByKey[key]) {
      await loadThread(post, key);
    }
  };

  const handleSubmitReply = async (post: UpdatesPost, e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = contentTypeForPost(post);
    if (!type || !isThreadType(type)) return;
    if (!user) {
      toast({ title: "Sign in to reply", duration: 2200 });
      return;
    }
    const key = likeKey(post);
    const draft = (draftByKey[key] || "").trim();
    if (!draft) {
      toast({ title: "Write a reply first", duration: 2000 });
      return;
    }
    if (replyPending[key]) return;
    setReplyPending(p => ({ ...p, [key]: true }));
    try {
      const res = await apiRequest(
        "POST",
        `/api/content/${encodeURIComponent(type)}/${post.id}/replies`,
        { body: draft.slice(0, 500) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { reply: ContentReply; replies: number };
      setDraftByKey(prev => ({ ...prev, [key]: "" }));
      setLocalReplies(prev => ({ ...prev, [key]: body.replies }));
      setThreadByKey(prev => {
        const existing = prev[key];
        const nextReplies = existing?.replies ? [...existing.replies, body.reply] : [body.reply];
        return {
          ...prev,
          [key]: {
            replies: nextReplies.slice(-20),
            count: body.replies,
            mode: "thread",
            nativeHref: null,
          },
        };
      });
      onReplyChange?.(post, body.replies);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not post reply"), variant: "destructive" });
    } finally {
      setReplyPending(p => ({ ...p, [key]: false }));
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
          const type = contentTypeForPost(post);
          const likes = localLikes[key] ?? (typeof post.likes === "number" ? post.likes : 0);
          const replies =
            localReplies[key] ?? (typeof post.replies === "number" ? post.replies : 0);
          const canLike = !!type;
          const canThread = !!type;
          const expanded = expandedKey === key;
          const thread = threadByKey[key];
          const loading = !!threadLoading[key];
          const threadMode = isThreadType(type);
          const nativeHref =
            thread?.nativeHref || (!threadMode ? nativeHrefFor(type, post.id) : null);
          const clickable = typeof onPostClick === "function" && !expanded;

          const footer = (
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
              {canThread ? (
                <button
                  type="button"
                  className={`pp-updates__stat pp-updates__stat--replies pp-updates__reply-btn${
                    expanded ? " is-open" : ""
                  }`}
                  onClick={e => handleToggleThread(post, e)}
                  aria-expanded={expanded}
                  aria-controls={`pp-updates-thread-${key}`}
                  aria-label={
                    expanded
                      ? `Hide replies (${replies})`
                      : `Show replies (${replies})`
                  }
                >
                  💬 {replies}
                </button>
              ) : (
                <span className="pp-updates__stat pp-updates__stat--replies">💬 {replies}</span>
              )}
            </div>
          );

          const threadPanel = expanded ? (
            <div
              id={`pp-updates-thread-${key}`}
              className="pp-updates__thread"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            >
              {loading && !thread ? (
                <p className="pp-updates__thread-empty">LOADING…</p>
              ) : threadMode ? (
                <>
                  {thread && thread.replies.length === 0 ? (
                    <p className="pp-updates__thread-empty">NO REPLIES YET</p>
                  ) : null}
                  {thread && thread.replies.length > 0 ? (
                    <ul className="pp-updates__thread-list">
                      {thread.replies.map(reply => {
                        const who =
                          (reply.author.displayName || reply.author.username || "Member").trim();
                        return (
                          <li key={reply.id} className="pp-updates__thread-item">
                            <UserAvatar
                              photoUrl={reply.author.photoUrl}
                              avatarChoice={reply.author.avatarChoice}
                              avatarRing={reply.author.avatarRing}
                              displayName={reply.author.displayName}
                              username={reply.author.username}
                              href={memberProfileHref(reply.author.username)}
                              size={22}
                            />
                            <div className="pp-updates__thread-body">
                              <div className="pp-updates__thread-meta">
                                <span className="pp-updates__thread-name">{who}</span>
                                {reply.createdAt ? (
                                  <span className="pp-updates__thread-when">
                                    {updatesWhen(reply.createdAt)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="pp-updates__thread-text">{reply.body}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {user ? (
                    <form
                      className="pp-updates__compose"
                      onSubmit={e => handleSubmitReply(post, e)}
                    >
                      <label className="sr-only" htmlFor={`pp-reply-${key}`}>
                        Reply
                      </label>
                      <textarea
                        id={`pp-reply-${key}`}
                        className="pp-updates__compose-input"
                        rows={2}
                        maxLength={500}
                        placeholder="ADD A REPLY…"
                        value={draftByKey[key] || ""}
                        onChange={e =>
                          setDraftByKey(prev => ({ ...prev, [key]: e.target.value }))
                        }
                        disabled={!!replyPending[key]}
                      />
                      <button
                        type="submit"
                        className="pp-updates__compose-btn"
                        disabled={!!replyPending[key] || !(draftByKey[key] || "").trim()}
                      >
                        {replyPending[key] ? "SENDING…" : "REPLY"}
                      </button>
                    </form>
                  ) : (
                    <p className="pp-updates__thread-hint">SIGN IN TO REPLY</p>
                  )}
                </>
              ) : (
                <>
                  {/* SPOTTED / GIFTING: private native flows; bodies never public. */}
                  <p className="pp-updates__thread-empty">
                    {replies === 1
                      ? "1 PRIVATE REPLY"
                      : `${replies} PRIVATE REPLIES`}
                  </p>
                  <p className="pp-updates__thread-hint">
                    {type === "SPOTTED"
                      ? "SPOTTED REPLIES STAY PRIVATE BETWEEN MEMBERS."
                      : "GIFTING INTERESTS STAY BETWEEN GIVER AND CLAIMER."}
                  </p>
                  {nativeHref ? (
                    <Link href={nativeHref} className="pp-updates__native-link">
                      {nativeCtaLabel(type)}
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          ) : null;

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
              {footer}
              {threadPanel}
            </>
          );

          if (clickable) {
            return (
              <button
                key={key}
                type="button"
                role="listitem"
                className={`pp-updates__card pp-updates__card--btn${
                  expanded ? " is-expanded" : ""
                }`}
                onClick={() => onPostClick(post)}
              >
                {body}
              </button>
            );
          }

          return (
            <article
              key={key}
              role="listitem"
              className={`pp-updates__card${expanded ? " is-expanded" : ""}`}
            >
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}
