import type { CSSProperties, ReactNode } from "react";

export interface FilterChipProps {
  children?: ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  accent?: "pink" | "cyan" | "purple" | "lime" | "amber" | string;
  /** Fill with accent color when selected (outline is default). */
  fill?: boolean;
  count?: number;
  showDot?: boolean;
  className?: string;
}

const ACCENTS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
};

export function FilterChip({
  children,
  selected = false,
  onToggle,
  accent = "lime",
  fill = false,
  count,
  showDot = false,
  className = "",
}: FilterChipProps) {
  const cls = ["pdxChip", fill ? "pdxChip--fill" : "", className].filter(Boolean).join(" ");
  const style = { "--_c": ACCENTS[accent] ?? accent } as CSSProperties;

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={selected}
      onClick={onToggle}
      style={style}
    >
      {showDot && <span className="pdxChip__dot" aria-hidden="true" />}
      {children}
      {count != null && <span className="pdxChip__count">{count}</span>}
    </button>
  );
}