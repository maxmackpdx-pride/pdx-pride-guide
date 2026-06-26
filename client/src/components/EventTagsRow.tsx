import type { CSSProperties } from "react";
import type { Event } from "@shared/schema";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { EventTypeTagList } from "./EventTypeTag";

const DAY_COLORS: Record<string, string> = {
  WED: "#CCFF00",
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#FF6600",
  SUN: "#FF2400",
};

type EventTagsRowProps = {
  event: Event;
  size?: "sm" | "md";
  max?: number;
  showJsonTypes?: boolean;
  showClaim?: boolean;
  onClaimClick?: () => void;
  className?: string;
  style?: CSSProperties;
};

function dayTagStyle(): CSSProperties {
  return { "--day-tag-bg": "#ffffff" } as CSSProperties;
}

function claimTagStyle(accent: string): CSSProperties {
  return { "--tag-accent": accent } as CSSProperties;
}

export default function EventTagsRow({
  event,
  size = "sm",
  max,
  showJsonTypes = false,
  showClaim = true,
  onClaimClick,
  className = "",
  style,
}: EventTagsRowProps) {
  const typeTags = getEventTypeTagsForEvent(event);
  const dayAccent = DAY_COLORS[event.dayOfWeek || ""] || "#CCFF00";
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const jsonTypes = showJsonTypes
    ? (JSON.parse(event.eventTypes || "[]") as string[])
    : [];

  return (
    <div className={`event-card-tags${className ? ` ${className}` : ""}`} style={style}>
      {event.dayOfWeek && (
        <span className="event-card-day-tag" style={dayTagStyle()}>
          {event.dayOfWeek}
        </span>
      )}
      <EventTypeTagList labels={typeTags} size={size} max={max} />
      {jsonTypes.map(t => (
        <span key={t} className="event-card-meta-tag" style={{ color: dayAccent, borderColor: `${dayAccent}88` }}>
          {t.replace(/-/g, " ")}
        </span>
      ))}
      {showClaim && hasPendingClaim && (
        <span className="event-card-meta-tag event-card-meta-tag--claim" style={claimTagStyle("var(--neon-magenta)")}>
          CLAIM PENDING
        </span>
      )}
      {showClaim && !hasPendingClaim && event.isClaimable && (
        <span
          className={`event-card-meta-tag event-card-meta-tag--claim${onClaimClick ? " event-card-meta-tag--clickable" : ""}`}
          style={claimTagStyle("var(--neon-cyan)")}
          onClick={onClaimClick}
          onKeyDown={onClaimClick ? e => e.key === "Enter" && onClaimClick() : undefined}
          role={onClaimClick ? "button" : undefined}
          tabIndex={onClaimClick ? 0 : undefined}
        >
          {onClaimClick ? "CLAIM THIS EVENT →" : "CLAIM ME"}
        </span>
      )}
    </div>
  );
}