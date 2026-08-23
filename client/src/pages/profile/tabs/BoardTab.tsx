import type React from "react";
import { timeAgo } from "../helpers";
import type { MemberProfileData } from "../types";

type BoardCard = {
  key: string;
  board: string;
  hex: string;
  where: string;
  text: string;
  createdAt: string;
};

export default function BoardTab({ data }: { data: MemberProfileData }) {
  const activity = data.activity ?? {};
  const cards: BoardCard[] = [
    ...(activity.gigs ?? []).map(g => ({
      key: `gig-${g.id}`,
      board: "GIGZ",
      hex: "var(--neon-violet)",
      where: g.venueText || "Portland",
      text: g.description || g.title,
      createdAt: g.createdAt || "",
    })),
    ...(activity.gifting ?? []).map(g => ({
      key: `gifting-${g.id}`,
      board: "GIFTZ",
      hex: "var(--neon-yellow)",
      where: g.neighborhood || "Portland",
      text: g.description || g.title,
      createdAt: g.createdAt || "",
    })),
    // Missed connections intentionally omitted - anonymous by design.
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="mp-section-kicker" style={{ color: "var(--neon-magenta)" }}>In the community</div>
      <h2 className="display mp-section-title">Board posts</h2>
      {cards.length > 0 ? (
        <div className="mp-board-list">
          {cards.map(c => (
            <div key={c.key} className="mp-board-card pdx-glass-rebind" style={{ "--_hex": c.hex } as React.CSSProperties}>
              <div className="mp-board-card__head">
                <span className="mp-board-card__pill" style={{ background: c.hex }}>{c.board}</span>
                <span className="mp-board-card__where">{c.where}</span>
                {c.createdAt && <span className="mp-board-card__ago">{timeAgo(c.createdAt)}</span>}
              </div>
              <p className="mp-board-card__text">{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-empty">
          <p>{data.isOwner ? "You haven't posted to any of the community boards yet." : `${data.displayName || data.username} hasn't posted to the boards yet.`}</p>
        </div>
      )}
    </div>
  );
}
