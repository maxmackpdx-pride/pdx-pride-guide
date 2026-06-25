import type { ReactNode } from "react";

export interface DashboardDrawerProps {
  title: string;
  color: string;
  countLabel: string;
  open: boolean;
  onToggle: () => void;
  emptyText?: string;
  isEmpty?: boolean;
  cta?: { label: string; href: string };
  children?: ReactNode;
}

export default function DashboardDrawer({
  title,
  color,
  countLabel,
  open,
  onToggle,
  emptyText,
  isEmpty,
  cta,
  children,
}: DashboardDrawerProps) {
  return (
    <article
      className={`dash-drawer ${open ? "open" : ""}`}
      style={{ ["--drawer-color" as string]: color }}
    >
      <button type="button" className="dash-drawer-toggle" onClick={onToggle}>
        <span style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span className="dash-drawer-title" style={{ color }}>{title}</span>
          <span className="dash-drawer-count" style={{ background: color }}>{countLabel}</span>
        </span>
        <span className="dash-drawer-chevron" style={{ color }}>▾</span>
      </button>
      {open && (
        <div className="dash-drawer-body">
          {isEmpty && emptyText ? (
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