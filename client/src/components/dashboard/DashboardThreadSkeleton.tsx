export default function DashboardThreadSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="dash-thread-skeletons" role="status" aria-label="Loading messages">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="dash-thread-skeleton">
          <span className="dash-thread-skeleton__avatar" />
          <span className="dash-thread-skeleton__lines">
            <span className="dash-thread-skeleton__line dash-thread-skeleton__line--short" />
            <span className="dash-thread-skeleton__line" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardItemSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="dash-item-skeletons" role="status" aria-label="Loading items">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="dash-item-skeleton">
          <span className="dash-item-skeleton__bar" />
          <span className="dash-item-skeleton__lines">
            <span className="dash-thread-skeleton__line dash-thread-skeleton__line--short" />
            <span className="dash-thread-skeleton__line" />
          </span>
        </div>
      ))}
    </div>
  );
}