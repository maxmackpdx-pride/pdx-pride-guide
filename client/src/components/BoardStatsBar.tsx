import CountUpValue from "@/components/CountUpValue";

type Stat = {
  num: string | number;
  label: string;
  color: string;
};

type BoardStatsBarProps = {
  stats: Stat[];
  liveLabel?: string;
  /** Hide the trailing live pill (design band uses a pure 3-col strip). */
  showLive?: boolean;
  /** `band` = full-bleed 3-col bordered strip from the board makeover. */
  variant?: "inline" | "band";
};

function StatNum({ num }: { num: string | number }) {
  if (typeof num === "number" && Number.isFinite(num)) {
    return (
      <CountUpValue
        key={num > 0 ? "ready" : "pending"}
        value={num}
      />
    );
  }
  const asNum = typeof num === "string" && /^\d+$/.test(num.trim()) ? Number(num) : NaN;
  if (Number.isFinite(asNum)) {
    return <CountUpValue key={asNum > 0 ? "ready" : "pending"} value={asNum} />;
  }
  return <>{num}</>;
}

export default function BoardStatsBar({
  stats,
  liveLabel = "Updated live this Pride season",
  showLive = true,
  variant = "inline",
}: BoardStatsBarProps) {
  if (variant === "band") {
    return (
      <section className="board-stats-band" aria-label="Board stats">
        <div className="board-stats-band__inner">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`board-stats-band__item${i < stats.length - 1 ? " board-stats-band__item--rule" : ""}`}
            >
              <span
                className="board-stats-band__num"
                style={{ color: stat.color, textShadow: `0 0 22px ${stat.color}52` }}
              >
                <StatNum num={stat.num} />
              </span>
              <span className="board-stats-band__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="board-stats-bar" aria-label="Board stats">
      <div className="board-stats-bar__inner">
        {stats.map(stat => (
          <div key={stat.label} className="board-stats-bar__item">
            <span className="board-stats-bar__num" style={{ color: stat.color, textShadow: `0 0 22px ${stat.color}66` }}>
              <StatNum num={stat.num} />
            </span>
            <span className="board-stats-bar__label">{stat.label}</span>
          </div>
        ))}
        {showLive && (
          <div className="board-stats-bar__live">
            <span className="board-stats-bar__dot" aria-hidden="true" />
            <span>{liveLabel}</span>
          </div>
        )}
      </div>
    </section>
  );
}
