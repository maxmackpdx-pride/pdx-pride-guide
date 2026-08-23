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

const DAY_TEXT: Record<PrideDay, string> = {
  MON: "var(--day-mon-text)",
  TUE: "var(--day-tue-text)",
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

export interface PosterCardProps {
  title: string;
  venue?: string;
  when?: string;
  day?: PrideDay;
  image?: string;
  types?: string[];
  admission?: Admission;
  age?: AgeRequirement;
  claimable?: boolean;
  going?: number;
  onRsvp?: () => void;
  href?: string;
  showLink?: boolean;
  className?: string;
  style?: CssVarStyle;
}

export function PosterCard({
  title,
  venue,
  when,
  day = "FRI",
  image,
  types = [],
  admission,
  age,
  claimable = false,
  going,
  onRsvp,
  href,
  showLink = true,
  className = "",
  style,
}: PosterCardProps) {
  const base = DAY_BASE[day] || "#fff";
  const dayt = DAY_TEXT[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]]
    .filter(Boolean)
    .join(" · ");

  const cssStyle: CssVarStyle = { "--_day": base, "--_dayt": dayt, ...style };

  const handleRsvp = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onRsvp?.();
  };

  const content = (
    <>
      <div className="pdxBoard__poster">
        {image ? (
          <img className="pdxBoard__img" src={image} alt="" />
        ) : (
          <div className="pdxBoard__ph">
            <span className="pdxBoard__phTitle">{title}</span>
          </div>
        )}
        {showLink && (
          <span className="pdxBoard__linkchip" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4" />
            </svg>
          </span>
        )}
        <span className="pdxBoard__stripe" />
      </div>

      <div className="pdxBoard__meta">
        <div className="pdxBoard__tags">
          <span className="pdxTag pdxTag--day">{day}</span>
          {types.map((t, i) => (
            <span className="pdxTag pdxTag--type" key={i}>
              {t}
            </span>
          ))}
          {metaBits && <span className="pdxTag pdxTag--meta">{metaBits}</span>}
          {claimable && <span className="pdxTag pdxTag--claim">Claimable</span>}
        </div>
        <h3 className="pdxBoard__title">{title}</h3>
        {venue && <div className="pdxBoard__venue">{venue}</div>}
        {when && <div className="pdxBoard__when">{when}</div>}
        <span className="pdxBoard__link">Event details &rarr;</span>

        {(going != null || onRsvp) && (
          <div className="pdxBoard__foot">
            {going != null ? (
              <span className="pdxBoard__going">
                <span className="dot" />
                {going} Going
              </span>
            ) : (
              <span />
            )}
            {onRsvp && (
              <button type="button" className="pdxBoard__rsvp" onClick={handleRsvp}>
                I&apos;ll be there
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <a className={`pdxBoard ${className} pdx-glass-rebind`} href={href} style={cssStyle}>
        {content}
      </a>
    );
  }

  return (
    <div className={`pdxBoard ${className} pdx-glass-rebind`} style={cssStyle}>
      {content}
    </div>
  );
}