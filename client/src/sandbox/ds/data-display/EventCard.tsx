import type { MouseEvent } from "react";
import type {
  Admission,
  AgeRequirement,
  CssVarStyle,
  PrideDay,
} from "../types";

const DAY_BASE: Record<PrideDay, string> = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)",
};

const ADM_LABEL: Record<Admission, string> = {
  FREE: "Free",
  TICKETED: "Ticketed",
  SUGGESTED_DONATION: "Donation",
};

const AGE_LABEL: Record<AgeRequirement, string> = {
  ALL_AGES: "All ages",
  "18_PLUS": "18+",
  "21_PLUS": "21+",
};

export interface EventCardProps {
  title: string;
  venue?: string;
  when?: string;
  day?: PrideDay;
  image?: string;
  types?: string[];
  admission?: Admission;
  age?: AgeRequirement;
  going?: number;
  saved?: boolean;
  onSave?: () => void;
  href?: string;
  className?: string;
  style?: CssVarStyle;
}

export function EventCard({
  title,
  venue,
  when,
  day = "FRI",
  image,
  types = [],
  admission,
  age,
  going,
  saved,
  onSave,
  href,
  className = "",
  style,
}: EventCardProps) {
  const base = DAY_BASE[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]]
    .filter(Boolean)
    .join(" · ");

  const cssStyle: CssVarStyle = { "--_day": base, ...style };

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSave?.();
  };

  const content = (
    <>
      <div className="pdxRow__thumb">
        {image ? (
          <img src={image} alt="" />
        ) : (
          <span className="pdxRow__thumbPh">{(title || "?").charAt(0)}</span>
        )}
      </div>
      <div className="pdxRow__main">
        <div className="pdxRow__tags">
          <span className="pdxRowTag pdxRowTag--day">{day}</span>
          {types.slice(0, 2).map((t, i) => (
            <span className="pdxRowTag pdxRowTag--type" key={i}>
              {t}
            </span>
          ))}
          {metaBits && <span className="pdxRowTag pdxRowTag--meta">{metaBits}</span>}
        </div>
        <h3 className="pdxRow__title">{title}</h3>
        <div className="pdxRow__when">
          {venue && <b>{venue}</b>}
          {venue && when ? " · " : ""}
          {when}
        </div>
      </div>
      <div className="pdxRow__aside">
        {onSave && (
          <button
            type="button"
            className="pdxRow__save"
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save event"}
            onClick={handleSave}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        )}
        {going != null && (
          <span className="pdxRow__going">
            <span className="dot" />
            {going} Going
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a className={`pdxRow ${className} pdx-glass-rebind`} href={href} style={cssStyle}>
        {content}
      </a>
    );
  }

  return (
    <div className={`pdxRow ${className} pdx-glass-rebind`} style={cssStyle}>
      {content}
    </div>
  );
}