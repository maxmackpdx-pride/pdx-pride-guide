import { useMemo, useState } from "react";

export type MemberGrowthBucket = {
  at: string;
  signups: number;
  rsvps: number;
  total: number;
  cumulativeSignups: number;
  cumulativeRsvps: number;
};

function bucketLabel(at: string): string {
  const d = new Date(at);
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const hour = d.getHours();
  const slot = hour < 12 ? "12am" : "12pm";
  return `${date} · ${slot}`;
}

function bucketRangeLabel(at: string): string {
  const start = new Date(at);
  const end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function MemberGrowthChart({ buckets }: { buckets: MemberGrowthBucket[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (buckets.length < 2) {
      return {
        line: "0,18 100,18",
        area: "0,36 0,18 100,18 100,36",
        dots: [] as Array<{ x: number; y: number; index: number }>,
        min: 0,
        max: 0,
      };
    }
    const values = buckets.map(b => b.total);
    const mn = Math.min(...values);
    const mx = Math.max(...values);
    const range = mx - mn || 1;
    const dots = buckets.map((b, index) => ({
      index,
      x: (index / (buckets.length - 1)) * 100,
      y: 34 - ((b.total - mn) / range) * 30,
    }));
    const line = dots.map(d => `${d.x.toFixed(2)},${d.y.toFixed(2)}`).join(" ");
    return {
      line,
      area: `0,36 ${line} 100,36`,
      dots,
      min: mn,
      max: mx,
    };
  }, [buckets]);

  const active = activeIndex != null ? buckets[activeIndex] : null;
  const activeDot = activeIndex != null ? chart.dots[activeIndex] : null;

  if (buckets.length === 0) {
    return <p className="admin-stats__insight">No signups or RSVPs in the last 14 days yet.</p>;
  }

  return (
    <div className="admin-stats__growth-chart">
      <div className="admin-stats__chart-wipe">
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden className="admin-stats__growth-chart__svg">
          <defs>
            <linearGradient id="adminStatsGrowthArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--cyan, #00ffff)" stopOpacity="0.34" />
              <stop offset="1" stopColor="var(--cyan, #00ffff)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={chart.area} fill="url(#adminStatsGrowthArea)" />
          <polyline
            points={chart.line}
            fill="none"
            stroke="var(--cyan, #00ffff)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="admin-stats__growth-chart__dots" role="presentation">
          {chart.dots.map(dot => {
            const bucket = buckets[dot.index];
            const isActive = activeIndex === dot.index;
            return (
              <button
                key={bucket.at}
                type="button"
                className={`admin-stats__growth-dot${isActive ? " is-active" : ""}${bucket.total > 0 ? " has-data" : ""}`}
                style={{
                  left: `${dot.x}%`,
                  top: `${(dot.y / 36) * 100}%`,
                }}
                aria-pressed={isActive}
                aria-label={`${bucketLabel(bucket.at)}: ${bucket.signups} signups, ${bucket.rsvps} RSVPs`}
                onClick={() => setActiveIndex(isActive ? null : dot.index)}
              />
            );
          })}
        </div>
      </div>

      {active && activeDot && (
        <div
          className="admin-stats__growth-tooltip"
          style={{ left: `${Math.min(Math.max(activeDot.x, 8), 92)}%` }}
        >
          <div className="admin-stats__growth-tooltip__time">{bucketRangeLabel(active.at)}</div>
          <div className="admin-stats__growth-tooltip__grid">
            <span>Signups</span>
            <strong>{active.signups}</strong>
            <span>RSVPs</span>
            <strong>{active.rsvps}</strong>
            <span>This window</span>
            <strong>{active.total}</strong>
            <span>Running total</span>
            <strong>{active.cumulativeSignups + active.cumulativeRsvps}</strong>
          </div>
          <p className="admin-stats__growth-tooltip__meta">
            {active.cumulativeSignups} signups · {active.cumulativeRsvps} RSVPs since window start
          </p>
        </div>
      )}

      <p className="admin-stats__growth-chart__hint">
        Tap any dot for that 12-hour window. {buckets.length} buckets over 14 days.
      </p>
    </div>
  );
}