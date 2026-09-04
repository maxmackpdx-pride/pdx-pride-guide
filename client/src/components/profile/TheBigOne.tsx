import type { CSSProperties } from "react";
import { dayAccentToken } from "@/lib/dsColors";
import { formatPacificDateTime, parsePacificEventTime, useCountdown } from "@/lib/countdown";
import UserAvatar from "@/components/UserAvatar";
import { admissionDisplayLabel } from "@shared/admission";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { ProfileEvent, ProfileUserChip } from "./types";
import "./TheBigOne.css";

const DAY_OPPOSITE: Record<string, string> = { MON:"#CCFF00", TUE:"#FF6600", WED:"#8800FF", THU:"#FF6600", FRI:"#CCFF00", SAT:"#FF3030", SUN:"#00FFFF" };

export type TheBigOneEvent = ProfileEvent & {
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
};

export type TheBigOneProps = {
  event: TheBigOneEvent;
  /** Optional going facepile; parent can pass attendance previews when available. */
  goingAvatars?: ProfileUserChip[];
  /** Total going count (falls back to event.goingCount). */
  goingCount?: number;
  /** Whether the viewer has already RSVP'd. */
  isGoing?: boolean;
  onRsvp?: () => void;
  /** Open full event detail (EventModal / event page). */
  onOpen?: () => void;
  className?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatWhenLine(event: TheBigOneEvent): string {
  const parts: string[] = [];
  if (event.dateStart) {
    const dayPart = formatPacificDateTime(event.dateStart, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timePart = formatPacificDateTime(event.dateStart, {
      hour: "numeric",
      minute: "2-digit",
    });
    if (dayPart) parts.push(dayPart.toUpperCase());
    if (timePart) parts.push(timePart.toUpperCase());
  } else if (event.dayOfWeek) {
    parts.push(event.dayOfWeek);
  }
  if (event.venueName) parts.push(event.venueName.toUpperCase());
  if (event.neighborhood) parts.push(event.neighborhood.toUpperCase());
  return parts.join(" · ");
}

function CountdownBlock({ targetMs }: { targetMs: number | null }) {
  // Shared hook (client/src/lib/countdown.ts): returns null when target is missing or past.
  const cd = useCountdown(targetMs);

  if (targetMs == null) {
    return (
      <div className="tbo__countdown">
        <div className="tbo__cd-value display">Soon</div>
        <div className="tbo__cd-caption">Date TBD</div>
      </div>
    );
  }

  if (!cd) {
    return (
      <div className="tbo__countdown">
        <div className="tbo__cd-value display">Live now</div>
        <div className="tbo__cd-caption">It&apos;s on</div>
      </div>
    );
  }

  const label =
    cd.days > 0
      ? `${cd.days}d ${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`
      : `${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;

  return (
    <div className="tbo__countdown">
      <div className="tbo__cd-value display">{label}</div>
      <div className="tbo__cd-caption">Kickoff in</div>
    </div>
  );
}

function GoingCluster({
  avatars,
  count,
  size,
}: {
  avatars: ProfileUserChip[];
  count: number;
  size: number;
}) {
  const shown = avatars.slice(0, 4);
  if (shown.length === 0 && count <= 0) return null;

  return (
    <div className="tbo__going">
      {shown.length > 0 && (
        <div className="tbo__faces" aria-hidden={count > 0 ? undefined : true}>
          {shown.map((u, i) => (
            <span key={u.id} className="tbo__face" style={{ zIndex: shown.length - i }}>
              <UserAvatar
                photoUrl={u.photoUrl}
                avatarChoice={u.avatarChoice}
                avatarRing={u.avatarRing}
                displayName={u.displayName}
                username={u.username}
                size={size}
                shimmer={false}
              />
            </span>
          ))}
        </div>
      )}
      {count > 0 && (
        <span className="tbo__going-count">
          {count.toLocaleString()} GOING
        </span>
      )}
    </div>
  );
}

/**
 * "The Big One": headline hosted event card.
 * Desktop (≥900px): FeaturedEventAd-style poster + live countdown + full-width
 * BUY TICKETS / RSVP rows. Mobile: compact Partiful-style poster + when + going + RSVP.
 */
export default function TheBigOne({
  event,
  goingAvatars = [],
  goingCount,
  isGoing = false,
  onRsvp,
  onOpen,
  className = "",
}: TheBigOneProps) {
  const poster = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);
  const day = (event.dayOfWeek || "").toUpperCase();
  const dayCode = day.slice(0, 3);
  const dayColor = dayAccentToken(day || "SAT");
  const whenLine = formatWhenLine(event);
  const count = goingCount ?? event.goingCount ?? 0;
  const ticketUrl = event.ticketUrl || null;
  const targetMs = parsePacificEventTime(event.dateStart);
  const category = event.eventTypes?.find(Boolean)?.replaceAll("_", " ").toUpperCase() || null;
  const admission = event.admission ? admissionDisplayLabel(event.admission)?.toUpperCase() : null;
  const dayInk = dayCode === "MON" || dayCode === "TUE" ? "#fff" : "#050506";

  const rsvpLabel = isGoing ? "You're in" : "RSVP";
  const rsvpCaption = isGoing ? "See you on the floor" : "Secure your spot";

  return (
    <section
      className={`tbo pdx-glass-rebind${className ? ` ${className}` : ""}`}
      style={{ "--tbo-day": dayColor, "--tbo-day-ink": dayInk, "--tbo-opposite": DAY_OPPOSITE[dayCode] || "#CCFF00", "--c": dayColor } as CSSProperties}
      aria-label={`The Big One: ${event.title}`}
    >
      <div className="tbo__kicker">
        <span className="tbo__kicker-text">The Big One</span>
        <span className="tbo__kicker-sep" aria-hidden="true">
          ·
        </span>
        <span className="tbo__kicker-sub">Up next</span>
      </div>

      <div className={`tbo__card pdx-glass-rebind${onOpen ? " tbo__card--clickable" : ""}`}>
        {/* Poster: top-anchored, crop bottom not sides */}
        <button
          type="button"
          className="tbo__poster"
          onClick={onOpen}
          aria-label={onOpen ? `Open ${event.title}` : event.title}
          disabled={!onOpen}
        >
          <img
            className="tbo__poster-img"
            src={poster}
            alt=""
            loading="lazy"
          />
          <div className="tbo__poster-scrim" aria-hidden="true" />
          <div className="tbo__poster-title">
            <div className="tbo__tags" aria-label="Event tags">
              {dayCode ? <span className="tbo__tag tbo__tag--day">{dayCode}</span> : null}
              {category ? <span className={`tbo__tag tbo__tag--neutral${/^SEX[ _-]?POSITIVE$/i.test(category) ? " tbo__tag--complementary" : ""}`}>{category}</span> : null}
              {admission ? <span className={`tbo__tag tbo__tag--detail${event.admission === "DOOR_FEE" ? " tbo__tag--complementary" : ""}`}>{admission}</span> : null}
            </div>
            <h3 className="tbo__title display">{event.title}</h3>
            {whenLine ? <p className="tbo__when">{whenLine}</p> : null}
          </div>
        </button>

        {/* Desktop body: countdown + going + action rows */}
        <div className="tbo__desktop">
          <CountdownBlock targetMs={targetMs} />

          <div className="tbo__going-row">
            <GoingCluster avatars={goingAvatars} count={count} size={32} />
          </div>

          {ticketUrl && (
            <a
              className="tbo__row tbo__row--tickets"
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="tbo__row-label display">Buy tickets</span>
              <span className="tbo__row-copy">Available now</span>
            </a>
          )}

          <button
            type="button"
            className={`tbo__row tbo__row--rsvp${isGoing ? " is-going" : ""}`}
            onClick={onRsvp}
            disabled={!onRsvp}
          >
            <span className="tbo__row-label display">
              {rsvpLabel}
              {isGoing ? " ✓" : ""}
            </span>
            <span className="tbo__row-copy">{rsvpCaption}</span>
          </button>
        </div>

        {/* Mobile body: compact Partiful-style footer */}
        <div className="tbo__mobile">
          <h3 className="tbo__title tbo__title--mobile display">{event.title}</h3>
          {whenLine ? <p className="tbo__when tbo__when--mobile">{whenLine}</p> : null}
          <div className="tbo__mobile-foot">
            <GoingCluster avatars={goingAvatars} count={count} size={28} />
            <button
              type="button"
              className={`tbo__rsvp-pill${isGoing ? " is-going" : ""}`}
              onClick={onRsvp}
              disabled={!onRsvp}
            >
              {isGoing ? "You're in ✓" : "RSVP"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
