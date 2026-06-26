import {
  EVENT_TYPE_TAG_COLORS,
  isEventTypeFilterLabel,
  type EventTypeFilterLabel,
} from "@shared/eventTypeTags";

type EventTypeTagSize = "sm" | "md";

interface EventTypeTagProps {
  label: EventTypeFilterLabel | string;
  /** Read-only badge (default) or interactive filter button */
  interactive?: boolean;
  active?: boolean;
  onClick?: () => void;
  size?: EventTypeTagSize;
  className?: string;
  testId?: string;
}

export default function EventTypeTag({
  label,
  interactive = false,
  active = false,
  onClick,
  size = "md",
  className = "",
  testId,
}: EventTypeTagProps) {
  const colors = isEventTypeFilterLabel(label)
    ? EVENT_TYPE_TAG_COLORS[label]
    : { color: "var(--text-meta)" };

  if (interactive) {
    const activeStyle = active
      ? {
          color: "#000",
          background: colors.color,
          borderColor: colors.borderColor,
          boxShadow: `0 0 16px ${colors.color}99, 2px 2px 0 rgba(0,0,0,0.7)`,
          fontWeight: 900 as const,
        }
      : undefined;

    return (
      <button
        type="button"
        className={`filter-tag event-type-filter ${active ? "active" : ""} ${className}`.trim()}
        data-type={label}
        onClick={onClick}
        data-testid={testId}
        style={activeStyle}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={`event-type-tag event-type-tag--${size} ${className}`.trim()}
      style={{
        "--tag-bg": colors.color,
        "--tag-border": "var(--neon-yellow)",
        "--tag-shadow": "var(--neon-yellow)",
      } as React.CSSProperties}
    >
      {label}
    </span>
  );
}

interface EventTypeTagListProps {
  labels: EventTypeFilterLabel[];
  size?: EventTypeTagSize;
  max?: number;
  className?: string;
}

export function EventTypeTagList({ labels, size = "sm", max, className = "" }: EventTypeTagListProps) {
  const visible = max ? labels.slice(0, max) : labels;
  if (visible.length === 0) return null;

  return (
    <div className={`event-type-tag-list ${className}`.trim()}>
      {visible.map(label => (
        <EventTypeTag key={label} label={label} size={size} />
      ))}
    </div>
  );
}