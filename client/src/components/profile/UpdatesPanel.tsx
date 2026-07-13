import UserAvatar from "@/components/UserAvatar";
import type { ProfileBoardPost } from "./types";
import "./UpdatesPanel.css";

export type UpdatesAuthor = {
  photoUrl?: string | null;
  displayName?: string | null;
  avatarRing?: string | null;
  avatarChoice?: number;
  username: string;
};

/** Posts may carry optional engagement counts when the feed provides them. */
export type UpdatesPost = ProfileBoardPost & {
  likes?: number;
  replies?: number;
};

type Props = {
  posts: UpdatesPost[];
  author: UpdatesAuthor;
  onPostClick?: (post: UpdatesPost) => void;
  /** Override the right-side meta label. Defaults to POSTS BY {name}. */
  metaLabel?: string;
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

export default function UpdatesPanel({ posts, author, onPostClick, metaLabel }: Props) {
  if (!posts.length) return null;

  const name = (author.displayName || author.username || "Member").trim();
  const rightMeta = metaLabel || `POSTS BY ${name.toUpperCase()}`;

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
          const showLikes = typeof post.likes === "number";
          const showReplies = typeof post.replies === "number";
          const showFooter = showLikes || showReplies;
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
              {showFooter ? (
                <div className="pp-updates__footer">
                  {showLikes ? (
                    <span className="pp-updates__stat pp-updates__stat--likes">♥ {post.likes}</span>
                  ) : null}
                  {showReplies ? (
                    <span className="pp-updates__stat pp-updates__stat--replies">💬 {post.replies}</span>
                  ) : null}
                </div>
              ) : null}
            </>
          );

          if (clickable) {
            return (
              <button
                key={`${post.board}-${post.id}`}
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
            <article key={`${post.board}-${post.id}`} role="listitem" className="pp-updates__card">
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}
