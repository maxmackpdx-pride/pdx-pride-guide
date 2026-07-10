import { Link } from "wouter";
import type { PublicProfile } from "./types";

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

const LABELS: Record<string, string> = {
  spotted: "Spotted",
  gifting: "Gifting",
  gigs: "Gigs",
};

export default function BoardTab({ profile }: { profile: PublicProfile }) {
  const posts = profile.boardPosts || [];

  if (!posts.length) {
    return (
      <div>
        <h2 className="profile-section-title">Board</h2>
        <p className="profile-empty">No board posts yet. Spotted, Gifting, and Gigs from this person land here.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="profile-section-title">Board</h2>
      <div className="profile-board-list">
        {posts.map(p => (
          <article key={`${p.board}-${p.id}`} className={`profile-board-card profile-board-card--${p.board}`}>
            <div className="profile-board-card__head">
              <span className="profile-board-card__pill">{LABELS[p.board] || p.board}</span>
              <span className="profile-board-card__meta">
                {[p.location, timeAgo(p.when)].filter(Boolean).join(" · ")}
              </span>
            </div>
            <h3 className="profile-board-card__title">{p.title}</h3>
            {p.body && <p className="profile-board-card__body">{p.body}</p>}
            {p.href && (
              <Link href={p.href} className="profile-link-btn">
                Open board →
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
