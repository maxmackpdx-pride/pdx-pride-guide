import type { ReactNode } from "react";
import type {
  Admission,
  CssVarStyle,
  NeonColor,
  PlaceCategory,
  PrideWeekendDay,
  SpanProps,
} from "../types";

const COLORS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
  yellow: "var(--yellow)",
  blue: "var(--blue)",
  red: "var(--red)",
  neutral: "var(--text-lo)",
};

const ADMISSION: Record<Admission, { color: NeonColor; label: string }> = {
  FREE: { color: "lime", label: "Free" },
  TICKETED: { color: "cyan", label: "Ticketed" },
  SUGGESTED_DONATION: { color: "amber", label: "Donation" },
};

const DAY: Record<PrideWeekendDay, NeonColor> = {
  THU: "cyan",
  FRI: "pink",
  SAT: "green",
  SUN: "orange",
};

export interface BadgeProps extends SpanProps {
  children?: ReactNode;
  color?: NeonColor | string;
  variant?: "solid" | "outline" | "paper";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  dot?: boolean;
  admission?: Admission;
  day?: PrideWeekendDay;
  category?: PlaceCategory;
}

export function Badge({
  children,
  color = "lime",
  variant = "solid",
  size = "sm",
  glow = false,
  dot = false,
  admission,
  day,
  category,
  className = "",
  style,
  ...rest
}: BadgeProps) {
  let c: NeonColor | string = color;
  let label: ReactNode = children;
  let v = variant;

  if (admission && ADMISSION[admission]) {
    c = ADMISSION[admission].color;
    if (label == null) label = ADMISSION[admission].label;
  }
  if (day && DAY[day]) {
    c = DAY[day];
    if (label == null) label = day;
    if (variant === "solid") v = "paper";
  }
  if (category) {
    c = category === "bars" ? "pink"
      : category === "food" ? "orange"
      : category === "cafes" ? "green"
      : category === "venues" ? "cyan"
      : category === "services" ? "purple"
      : category === "shops" ? "amber"
      : "blue";
    if (label == null) {
      const labels: Record<PlaceCategory, string> = {
        bars: "Bars & Clubs",
        food: "Restaurants",
        cafes: "Cafes",
        venues: "Venues",
        services: "Services",
        shops: "Shops",
        hotels: "Hotels",
      };
      label = labels[category];
    }
  }

  const cls = [
    "pdxBadge",
    `pdxBadge--${v}`,
    `pdxBadge--${size}`,
    glow ? "pdxBadge--glow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const cssStyle: CssVarStyle = {
    "--_c": COLORS[c] || c,
    ...style,
  };

  return (
    <span className={cls} style={cssStyle} {...rest}>
      {dot && <span className="pdxBadge__dot" />}
      {label}
    </span>
  );
}