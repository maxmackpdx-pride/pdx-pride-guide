import type { CSSProperties, KeyboardEvent } from "react";

export type ActionRowBadge = {
  label: string;
  /** solid = glass-btn fill (e.g. GOES LIVE); outline = glass outline pill */
  variant?: "solid" | "outline";
  /**
   * Optional badge fill/edge color (independent of row --c).
   * Design: "Goes live now" is always solid lime even on the cyan Claim row.
   */
  accent?: string;
};

export type ActionRowProps = {
  /** Zero-padded index label, e.g. "01" */
  number: string;
  title: string;
  forWho: string;
  outcome: string;
  /** Accent color for glass card --c (lime / cyan / magenta) */
  accent: string;
  badge: ActionRowBadge;
  onClick: () => void;
  className?: string;
  testId?: string;
};

/**
 * Deep-glass promoter path row.
 * --glass-card keyed to accent + refract seam + corner sheen + status badge.
 * SoT: 11-promoter-intake.png / design handoff.
 */
export default function ActionRow({
  number,
  title,
  forWho,
  outcome,
  accent,
  badge,
  onClick,
  className = "",
  testId,
}: ActionRowProps) {
  const badgeVariant = badge.variant ?? "outline";
  const badgeAccent = badge.accent ?? accent;
  const style = {
    ["--c" as string]: accent,
    ["--badge-c" as string]: badgeAccent,
  } as CSSProperties;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`pi-action-row pdx-glass-card pdx-glass-rebind ${className}`.trim()}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="listitem"
      data-testid={testId}
    >
      <span className="pdx-refract-seam" aria-hidden="true" />
      <span className="pi-action-row__num" aria-hidden="true">
        {number}
      </span>
      <span className="pi-action-row__text">
        <span className="pi-action-row__title">{title}</span>
        <span className="pi-action-row__desc">
          <strong>{forWho}</strong> {outcome}
        </span>
        <span
          className={
            badgeVariant === "solid"
              ? "pi-action-row__badge pi-action-row__badge--solid"
              : "pi-action-row__badge pi-action-row__badge--outline"
          }
        >
          {badge.label}
        </span>
      </span>
      <span className="pi-action-row__arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
