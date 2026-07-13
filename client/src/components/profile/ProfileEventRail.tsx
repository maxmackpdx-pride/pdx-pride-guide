import type { CSSProperties, ReactNode } from "react";
import UserAvatar from "@/components/UserAvatar";
import type { ProfileEvent, ProfileUserChip } from "./types";
import "./ProfileEventRail.css";

const DAY_CODES = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
const WEEKDAY_FROM_JS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** Resolve MON to SUN for day tokens; falls back from dateStart when dayOfWeek is missing. */
export function eventDayCode(event: ProfileEvent): string {
  const raw = String(event.dayOfWeek || "").trim().toUpperCase().slice(0, 3);
  if (DAY_CODES.has(raw)) return raw;
  if (event.dateStart) {
    const d = new Date(event.dateStart);
    if (!Number.isNaN(d.getTime())) return WEEKDAY_FROM_JS[d.getDay()];
  }
  return "";
}

/** Map Pride day codes to CSS day tokens (never hardcode hex per event). */
export function dayCssVar(day?: string | null): string {
  const key = String(day || "").trim().toUpperCase().slice(0, 3);
  if (DAY_CODES.has(key)) return `var(--day-${key.toLowerCase()})`;
  return "var(--day-unknown, #fff)";
}

export function eventDayCssVar(event: ProfileEvent): string {
  return dayCssVar(eventDayCode(event));
}

/** Compact when line: "SAT JUL 18 · 9PM" */
export function fmtRailWhen(event: ProfileEvent): string {
  if (!event.dateStart) {
    const code = eventDayCode(event);
    return code || "";
  }
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return eventDayCode(event) || "";

  const weekday = eventDayCode(event) || WEEKDAY_FROM_JS[d.getDay()];
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  const date = d.getDate();
  const time = d
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, "")
    .toUpperCase();
  return `${weekday} ${mon} ${date} · ${time}`;
}

export function eventYear(event: ProfileEvent): string {
  if (!event.dateStart) return "";
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

type SectionHeadProps = {
  label: string;
  countLabel?: string;
  accent?: "yellow" | "muted";
};

export function ProfileRailHead({ label, countLabel, accent = "muted" }: SectionHeadProps) {
  const text = countLabel ? `${label} · ${countLabel}` : label;
  return (
    <div className={`pp-event-rail__head pp-event-rail__head--${accent}`}>
      {text}
    </div>
  );
}

function RailFacepile({ avatars }: { avatars: ProfileUserChip[] }) {
  const shown = avatars.slice(0, 3);
  if (!shown.length) return null;
  return (
    <div className="pp-event-rail__faces" aria-hidden="true">
      {shown.map((u, i) => (
        <span key={u.id} className="pp-event-rail__face" style={{ zIndex: shown.length - i }}>
          <UserAvatar
            photoUrl={u.photoUrl}
            avatarChoice={u.avatarChoice}
            avatarRing={u.avatarRing}
            displayName={u.displayName}
            username={u.username}
            size={22}
            shimmer={false}
          />
        </span>
      ))}
    </div>
  );
}

type GoingCardProps = {
  event: ProfileEvent;
  onClick?: (event: ProfileEvent) => void;
  goingAvatars?: ProfileUserChip[];
};

export function GoingEventCard({ event, onClick, goingAvatars = [] }: GoingCardProps) {
  const day = eventDayCssVar(event);
  const when = fmtRailWhen(event);
  const style = { ["--pp-day" as string]: day } as CSSProperties;
  const clickable = typeof onClick === "function";

  const inner = (
    <>
      {when ? <div className="pp-event-rail__when">{when}</div> : null}
      <div className="display pp-event-rail__title">{event.title}</div>
      {event.venueName ? <div className="pp-event-rail__venue">{event.venueName}</div> : null}
      <RailFacepile avatars={goingAvatars} />
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        role="listitem"
        className="pp-event-rail__card pp-event-rail__card--btn"
        style={style}
        onClick={() => onClick(event)}
      >
        {inner}
      </button>
    );
  }

  return (
    <article role="listitem" className="pp-event-rail__card" style={style}>
      {inner}
    </article>
  );
}

type RailShellProps = {
  children: ReactNode;
  className?: string;
  ariaLabel: string;
};

/** Horizontal rail shell used by Going (and reusable elsewhere). */
export function ProfileEventRailShell({ children, className = "", ariaLabel }: RailShellProps) {
  return (
    <div className={`pp-event-rail__track ${className}`.trim()} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
