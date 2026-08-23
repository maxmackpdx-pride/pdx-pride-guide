import type { ReactNode } from "react";
import { Badge } from "./Badge";
import type {
  CssVarStyle,
  PlaceCategory,
  PlaceEvent,
  PrideWeekendDay,
} from "../types";

const CAT_COLOR: Record<PlaceCategory, string> = {
  bars: "var(--pink)",
  food: "var(--orange)",
  cafes: "var(--green)",
  venues: "var(--cyan)",
  services: "var(--purple)",
  shops: "var(--amber)",
  hotels: "var(--blue)",
};

const DAY_COLOR: Record<PrideWeekendDay, string> = {
  THU: "var(--cyan)",
  FRI: "var(--pink)",
  SAT: "var(--green)",
  SUN: "var(--orange)",
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const PIN = (
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>
);
const CLOCK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
const PHONE = (
  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
);
const GLOBE = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </>
);
const IG = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </>
);
const CAL = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

export interface PlaceCardProps {
  name: string;
  category?: PlaceCategory;
  categoryLabel?: ReactNode;
  address?: string;
  hours?: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
  grandOpening?: boolean;
  events?: PlaceEvent[];
  className?: string;
  style?: CssVarStyle;
}

export function PlaceCard({
  name,
  category = "bars",
  categoryLabel,
  address,
  hours,
  phone,
  description,
  website,
  instagram,
  grandOpening = false,
  events = [],
  className = "",
  style,
}: PlaceCardProps) {
  const accent = CAT_COLOR[category] || "var(--pink)";
  const cssStyle: CssVarStyle = { "--_c": accent, ...style };

  return (
    <div className={`pdxPlace ${className} pdx-glass-rebind`} style={cssStyle}>
      {grandOpening && (
        <span className="pdxPlace__opening">
          <Badge color="yellow" glow size="sm">
            Grand Opening
          </Badge>
        </span>
      )}
      <span className="pdxPlace__cat">
        <Badge category={category} size="sm">
          {categoryLabel}
        </Badge>
      </span>
      <div className="pdxPlace__name">{name}</div>

      <div className="pdxPlace__rows">
        {address && (
          <div className="pdxPlace__row">
            <Icon>{PIN}</Icon>
            {address}
          </div>
        )}
        {hours && (
          <div className="pdxPlace__row">
            <Icon>{CLOCK}</Icon>
            {hours}
          </div>
        )}
        {phone && (
          <div className="pdxPlace__row">
            <Icon>{PHONE}</Icon>
            {phone}
          </div>
        )}
      </div>

      {description && <p className="pdxPlace__desc">{description}</p>}

      {(website || instagram) && (
        <div className="pdxPlace__links">
          {website && (
            <a
              className="pdxPlace__link"
              href={website}
              onClick={(e) => e.preventDefault()}
            >
              <Icon>{GLOBE}</Icon>
              Website
            </a>
          )}
          {instagram && (
            <a
              className="pdxPlace__link"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <Icon>{IG}</Icon>
              {instagram}
            </a>
          )}
        </div>
      )}

      {events.length > 0 && (
        <div className="pdxPlace__events">
          <div className="pdxPlace__eventsHead">
            <Icon>{CAL}</Icon>
            Upcoming Pride Events
          </div>
          {events.map((ev, i) => (
            <div
              className="pdxPlace__event"
              key={i}
              style={
                {
                  "--_ec": (ev.day && DAY_COLOR[ev.day]) || accent,
                } as CssVarStyle
              }
            >
              <div className="pdxPlace__eventDate">{ev.date}</div>
              <div className="pdxPlace__eventTitle">{ev.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}