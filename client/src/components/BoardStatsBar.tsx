type Stat = {
  num: string | number;
  label: string;
  color: string;
};

export default function BoardStatsBar({ stats, liveLabel = "Updated live this Pride season" }: { stats: Stat[]; liveLabel?: string }) {
  return (
    <section className="board-stats-bar" aria-label="Board stats">
      <div className="board-stats-bar__inner">
        {stats.map(stat => (
          <div key={stat.label} className="board-stats-bar__item">
            <span className="board-stats-bar__num" style={{ color: stat.color, textShadow: `0 0 22px ${stat.color}66` }}>
              {stat.num}
            </span>
            <span className="board-stats-bar__label">{stat.label}</span>
          </div>
        ))}
        <div className="board-stats-bar__live">
          <span className="board-stats-bar__dot" aria-hidden="true" />
          <span>{liveLabel}</span>
        </div>
      </div>
    </section>
  );
}