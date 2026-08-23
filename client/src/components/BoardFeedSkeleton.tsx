import type { CSSProperties } from "react";

type Shape = "board" | "housing" | "feed";

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={`board-feed-skeleton__bone${className ? ` ${className}` : ""}`} style={style} />;
}

function BoardCard() {
  return (
    <article
      className="board-listing-card board-listing-card--makeover board-listing-card--glass pdx-glass-rebind board-feed-skeleton__card"
      style={{ "--c": "var(--panel-cyan)", "--listing-accent": "var(--panel-cyan)" } as CSSProperties}
      aria-hidden="true"
    >
      <div className="board-listing-card__row">
        <div className="board-listing-card__thumb board-feed-skeleton__thumb">
          <Bone className="board-feed-skeleton__thumb-fill" />
        </div>
        <div className="board-listing-card__main">
          <div className="board-listing-card__poster board-feed-skeleton__avatar-row">
            <Bone className="board-feed-skeleton__avatar" />
            <Bone style={{ width: "42%", height: 10 }} />
          </div>
          <Bone style={{ width: "78%", height: 16, marginTop: 10 }} />
          <Bone style={{ width: "54%", height: 10, marginTop: 8 }} />
          <Bone style={{ width: "34%", height: 10, marginTop: 12 }} />
        </div>
      </div>
    </article>
  );
}

function HousingCard() {
  return (
    <div
      className="pdx-glass-card pdx-glass-rebind hz-card board-feed-skeleton__card"
      style={{ "--c": "var(--panel-cyan)", "--_c": "var(--panel-cyan)" } as CSSProperties}
      aria-hidden="true"
    >
      <span className="pdx-refract-seam" />
      <Bone style={{ width: 92, height: 10 }} />
      <div className="board-feed-skeleton__avatar-row" style={{ marginTop: 14 }}>
        <Bone className="board-feed-skeleton__avatar" />
        <Bone className="board-feed-skeleton__avatar" />
        <Bone className="board-feed-skeleton__avatar" />
      </div>
      <Bone style={{ width: "70%", height: 18, marginTop: 16 }} />
      <Bone style={{ width: "92%", height: 10, marginTop: 10 }} />
      <Bone style={{ width: "60%", height: 10, marginTop: 8 }} />
    </div>
  );
}

function FeedCard() {
  return (
    <div
      className="card fitem hub-feed-card pdx-glass-card pdx-glass-rebind board-feed-skeleton__card"
      style={{ "--c": "var(--panel-cyan)" } as CSSProperties}
      aria-hidden="true"
    >
      <div className="hub-feed-card__row">
        <Bone className="board-feed-skeleton__avatar board-feed-skeleton__avatar--lg" />
        <div className="hub-feed-card__main">
          <Bone style={{ width: "36%", height: 14 }} />
          <Bone style={{ width: "58%", height: 10, marginTop: 8 }} />
          <Bone style={{ width: "84%", height: 10, marginTop: 14 }} />
        </div>
      </div>
    </div>
  );
}

export default function BoardFeedSkeleton({
  label = "Loading",
  shape = "board",
  count = 4,
}: {
  label?: string;
  shape?: Shape;
  count?: number;
}) {
  const n = Math.max(2, Math.min(count, 8));
  const Card = shape === "housing" ? HousingCard : shape === "feed" ? FeedCard : BoardCard;
  const grid =
    shape === "feed"
      ? "board-feed-skeleton board-feed-skeleton--feed"
      : shape === "housing"
        ? "board-feed-skeleton board-feed-skeleton--housing hz-feed"
        : "board-feed-skeleton board-listing-grid board-listing-grid--makeover";
  return (
    <div className={grid} role="status" aria-label={label}>
      {Array.from({ length: n }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}
