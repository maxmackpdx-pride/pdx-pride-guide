import type { CSSProperties } from "react";
import type { Event } from "@shared/schema";
import { getEventTypeTagsForEvent } from "@shared/eventTypeTags";
import { EventTypeTagList } from "./EventTypeTag";

import { DAY_TEXT_COLORS } from "@shared/eventWeek";

type EventTagsRowProps = {
  event: Event;
  size?: "sm" | "md";
  max?: number;
  /** Policy chips: day, admission, age, house party, sex positive, nudity */
  showFlags?: boolean;
  /** JSON event-type tags (kink, dance, …) */
  showJsonTypes?: boolean;
  showClaim?: boolean;
  onClaimClick?: () => void;
  className?: string;
  style?: CSSProperties;
};

function dayTagStyle(): CSSProperties {
  return { "--day-tag-bg": "#ffffff" } as CSSProperties;
}

export default function EventTagsRow({
  event,
  size = "sm",
  max,
  showFlags = true,
  showJsonTypes = false,
  showClaim = true,
  onClaimClick,
  className = "",
  style,
}: EventTagsRowProps) {
  const typeTags = showFlags ? getEventTypeTagsForEvent(event) : [];
  const dayAccent = DAY_TEXT_COLORS[event.dayOfWeek as keyof typeof DAY_TEXT_COLORS] || "#fff";
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const jsonTypes = showJsonTypes
    ? (JSON.parse(event.eventTypes || "[]") as string[])
    : [];

  const hasFlags =
    showFlags &&
    (Boolean(event.dayOfWeek) || typeTags.length > 0 || (showClaim && (hasPendingClaim || (event.isClaimable && !event.claimedBy))));
  const hasTags = jsonTypes.length > 0;

  if (!hasFlags && !hasTags) return null;

  return (
    <div className={`event-card-tags${className ? ` ${className}` : ""}`} style={style}>
      {showFlags && event.dayOfWeek && (
        <span className="event-card-day-tag" style={dayTagStyle()}>
          {event.dayOfWeek}
        </span>
      )}
      {showFlags && typeTags.length > 0 && <EventTypeTagList labels={typeTags} size={size} max={max} />}
      {jsonTypes.map(t => (
        <span key={t} className="event-card-meta-tag" style={{ color: dayAccent, borderColor: `${dayAccent}88` }}>
          {t.replace(/-/g, " ")}
        </span>
      ))}
      {showFlags && showClaim && hasPendingClaim && (
        <span className="event-card-meta-tag event-card-meta-tag--claim event-card-meta-tag--claim-pending">
          Claim pending
        </span>
      )}
      {showFlags && showClaim && !hasPendingClaim && event.isClaimable && !event.claimedBy && (
        <span
          className={`event-card-meta-tag event-card-meta-tag--claim${onClaimClick ? " event-card-meta-tag--clickable" : ""}`}
          onClick={onClaimClick}
          onKeyDown={onClaimClick ? e => e.key === "Enter" && onClaimClick() : undefined}
          role={onClaimClick ? "button" : undefined}
          tabIndex={onClaimClick ? 0 : undefined}
        >
          {onClaimClick ? "Claim this event →" : "Claim me"}
        </span>
      )}
    </div>
  );
}
