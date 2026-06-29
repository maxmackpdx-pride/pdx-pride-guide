import { useId, type ReactNode } from "react";
import { DashboardItemSkeleton } from "./DashboardThreadSkeleton";

export interface DashboardDrawerProps {
  title: string;
  id?: string;
  color: string;
  countLabel: string;
  open: boolean;
  onToggle: () => void;
  emptyText?: string;
  isEmpty?: boolean;
  loading?: boolean;
  cta?: { label: string; href: string };
  children?: ReactNode;
}

export default function DashboardDrawer({
  title,
  color,
  countLabel,
  open,
  id,
  onToggle,
  emptyText,
  isEmpty,
  loading,
  cta,
  children,
}: DashboardDrawerProps) {
  const bodyId = useId();

  return (
    <article
      id={id}
      className={`dash-drawer ${open ? "open" : ""}`}
      style={{ ["--drawer-color" as string]: color }}
    >
      <button
        type="button"
        className="dash-drawer-toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span className="dash-drawer-title" style={{ color }}>{title}</span>
          <span className="dash-drawer-count" style={{ background: color }}>{countLabel}</span>
        </span>
        <span className="dash-drawer-chevron" style={{ color }} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id={bodyId} className="dash-drawer-body">
          {loading ? (
            <DashboardItemSkeleton />
          ) : isEmpty && emptyText ? (
            <div style={{ padding: "16px 0", fontSize: 14, color: "var(--dash-muted)" }}>{emptyText}</div>
          ) : (
            children
          )}
          {cta && (
            <a className="dash-drawer-cta" href={cta.href} style={{ color }}>{cta.label}</a>
          )}
        </div>
      )}
    </article>
  );
}

export function DashboardItemRow({
  color,
  title,
  meta,
  chip,
  chipColor,
  actions,
}: {
  color: string;
  title: string;
  meta: string;
  chip?: string;
  chipColor?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dash-item">
      <span className="dash-item-bar" style={{ background: color }} />
      <span className="dash-item-main">
        <span className="dash-item-title">{title}</span>
        <span className="dash-item-meta">{meta}</span>
      </span>
      {chip && (
        <span className="dash-chip" style={{ color: chipColor || color }}>{chip}</span>
      )}
      {actions && <div className="dash-item-actions">{actions}</div>}
    </div>
  );
}