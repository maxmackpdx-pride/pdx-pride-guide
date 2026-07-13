import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { admissionDisplayLabel } from "@shared/admission";
import type { ProfileEvent } from "./types";
import "./HostingPanel.css";

type Tab = "next" | "past";

type Props = {
  upcoming: ProfileEvent[];
  past: ProfileEvent[];
  displayName?: string | null;
  onEventClick?: (event: ProfileEvent) => void;
};

const DAY_CODES = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
const WEEKDAY_FROM_JS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function dayCode(event: ProfileEvent): string {
  const raw = (event.dayOfWeek || "").trim().toUpperCase();
  if (raw) {
    const code = raw.slice(0, 3);
    if (DAY_CODES.has(code)) return code;
  }
  if (event.dateStart) {
    const d = new Date(event.dateStart);
    if (!Number.isNaN(d.getTime())) return WEEKDAY_FROM_JS[d.getDay()];
  }
  return "FRI";
}

function dayColorVar(code: string): string {
  return `var(--day-${code.toLowerCase()})`;
}

/** Compact when line for upcoming: SAT JUL 18 · 9PM */
function fmtUpcomingWhen(event: ProfileEvent): string {
  if (!event.dateStart) return "";
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return "";
  const day = (event.dayOfWeek || WEEKDAY_FROM_JS[d.getDay()]).toUpperCase().slice(0, 3);
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  const date = d.getDate();
  const time = d
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, "")
    .toUpperCase();
  return `${day} ${mon} ${date} · ${time}`;
}

/** Compact when line for past: OCT 2025 */
function fmtPastWhen(event: ProfileEvent): string {
  if (!event.dateStart) return "";
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return "";
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  return `${mon} ${d.getFullYear()}`;
}

function admissionChrome(admission?: string | null): string | null {
  if (!admission) return null;
  const label = admissionDisplayLabel(admission);
  return label ? label.toUpperCase() : null;
}

function statusLine(event: ProfileEvent, past: boolean): string {
  const count = event.goingCount;
  const adm = admissionChrome(event.admission);
  if (past) {
    if (typeof count === "number" && count > 0) {
      if (event.admission === "TICKETED") return `SOLD OUT · ${count}`;
      return `${count} WENT`;
    }
    if (event.admission === "TICKETED") return "SOLD OUT";
    return adm || "PAST SHOW";
  }
  const parts: string[] = [];
  if (typeof count === "number" && count > 0) parts.push(`${count} GOING`);
  if (adm) parts.push(adm);
  return parts.join(" · ");
}

function HostingCard({
  event,
  past,
  onEventClick,
}: {
  event: ProfileEvent;
  past: boolean;
  onEventClick?: (event: ProfileEvent) => void;
}) {
  const code = dayCode(event);
  const color = dayColorVar(code);
  const when = past ? fmtPastWhen(event) : fmtUpcomingWhen(event);
  const status = statusLine(event, past);
  const interactive = typeof onEventClick === "function";

  const style = { "--hp-day": color } as CSSProperties;

  const activate = () => {
    if (interactive) onEventClick!(event);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick!(event);
    }
  };

  return (
    <article
      className={`hp-card${interactive ? " is-clickable" : ""}`}
      style={style}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      aria-label={event.title}
    >
      <div className="hp-card__banner">
        <span className="hp-card__day">{past ? "PAST" : code}</span>
      </div>
      <div className="hp-card__body">
        <h3 className="hp-card__title display">{event.title}</h3>
        {when && <div className="hp-card__when">{when}</div>}
        {event.venueName && <div className="hp-card__venue">{event.venueName}</div>}
        {status && <div className="hp-card__stat">{status}</div>}
      </div>
    </article>
  );
}

export default function HostingPanel({ upcoming, past, displayName, onEventClick }: Props) {
  const hasUpcoming = upcoming.length > 0;
  const hasPast = past.length > 0;

  // null = follow data-driven default until the user picks a tab.
  // Default UP NEXT; if nothing upcoming but past exists, open PAST EVENTS.
  const [tabOverride, setTabOverride] = useState<Tab | null>(null);
  const tab: Tab = tabOverride ?? (hasUpcoming || !hasPast ? "next" : "past");

  if (!hasUpcoming && !hasPast) return null;

  const list = tab === "next" ? upcoming : past;
  const isPast = tab === "past";
  const firstName = (displayName || "").trim().split(/\s+/)[0] || null;

  const emptyCopy =
    tab === "next"
      ? firstName
        ? `Nothing up next for ${firstName} yet. New nights land here first.`
        : "Nothing up next yet. New nights land here first."
      : firstName
        ? `No past shows on ${firstName}'s ledger yet. First one's always special.`
        : "No past shows on the ledger yet. First one's always special.";

  return (
    <section className="hp-panel" aria-label="Hosting">
      <div className="hp-panel__head">
        <span className="hp-panel__kicker">
          <span className="hp-panel__dot" aria-hidden="true" />
          HOSTING
        </span>
        <span className="hp-panel__badge">PROMOTER</span>
      </div>

      <div className="hp-tabs" role="tablist" aria-label="Hosting events">
        <button
          type="button"
          role="tab"
          id="hp-tab-next"
          aria-selected={tab === "next"}
          aria-controls="hp-rail"
          className={`hp-tabs__btn display${tab === "next" ? " is-on" : ""}`}
          onClick={() => setTabOverride("next")}
        >
          UP NEXT
        </button>
        <button
          type="button"
          role="tab"
          id="hp-tab-past"
          aria-selected={tab === "past"}
          aria-controls="hp-rail"
          className={`hp-tabs__btn display${tab === "past" ? " is-on" : ""}`}
          onClick={() => setTabOverride("past")}
        >
          PAST EVENTS
        </button>
      </div>

      <div
        className="hp-rail"
        id="hp-rail"
        role="tabpanel"
        aria-labelledby={tab === "next" ? "hp-tab-next" : "hp-tab-past"}
      >
        {list.length > 0 ? (
          list.map(event => (
            <HostingCard
              key={event.id}
              event={event}
              past={isPast}
              onEventClick={onEventClick}
            />
          ))
        ) : (
          <p className="hp-empty">{emptyCopy}</p>
        )}
      </div>
    </section>
  );
}
