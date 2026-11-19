import type { CSSProperties, ReactNode } from 'react';

/**
 * P2 (Tucker, Nov 19 2026): a browse rail — a header that matches the
 * top filter option it belongs to (same name, same color), styled as a
 * smaller proportional version of the Events section headers, over a
 * horizontal snap rail of Small cards. Tapping the header filters the
 * whole browse area to just that option.
 */
export function RailHeader({ name, color, count, onFilter, action = 'Filter ›' }: {
  name: string;
  color: string;
  count?: number;
  onFilter: () => void;
  action?: string;
}) {
  return (
    <button
      type="button"
      className="pz-rail-h"
      style={{ '--rail-accent': color } as CSSProperties}
      onClick={onFilter}
      aria-label={`Show only ${name}`}
    >
      <h3>{name}</h3>
      {count != null && <span className="pz-rail-h__count">{count}</span>}
      <span className="pz-rail-h__go" aria-hidden="true">{action}</span>
    </button>
  );
}

export function SmallRail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pz-small-rail" role="group" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
