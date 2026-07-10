import { SectionHeader } from "@/components/ds";
import type { ProfileBoardPost } from "./types";

type Props = { posts: ProfileBoardPost[] };

export default function BoardTab({ posts }: Props) {
  if (!posts.length) {
    return <p className="pp-empty-copy">No community board posts yet.</p>;
  }

  return (
    <section className="pp-board">
      <SectionHeader kicker="Community voice" title="Board" />
      <div className="pp-board__list">
        {posts.map(post => (
          <article
            key={`${post.board}-${post.id}`}
            className="pp-board__card"
            style={{
              borderColor: post.color,
              borderLeftColor: post.color,
              boxShadow: `0 0 16px -9px ${post.color}`,
            }}
          >
            <div className="pp-board__head">
              <span className="display pp-board__pill">{post.board}</span>
              <span className="pp-board__where">{post.where}</span>
            </div>
            <p className="pp-board__body">{post.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}