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

function tagStyle(accent: string): CSSProperties {
  return {
    "--tag-bg": accent,
    "--tag-border": "var(--neon-yellow)",
    "--tag-shadow": "var(--neon-yellow)",
  } as CSSProperties;
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
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#CCFF00";
  const hasPendingClaim = Boolean((event as Event & { hasPendingClaim?: boolean }).hasPendingClaim);
  const jsonTypes = showJsonTypes
    ? (JSON.parse(event.eventTypes || "[]") as string[])
    : [];

  return (
    <div className={`event-card-tags${className ? ` ${className}` : ""}`} style={style}>
      {event.dayOfWeek && (
        <span className="sticker-tag" style={tagStyle(dayColor)}>
          {event.dayOfWeek}
        </span>
      )}
      <EventTypeTagList labels={typeTags} size={size} max={max} />
      {jsonTypes.map(t => (
        <span key={t} className="sticker-tag" style={tagStyle(dayColor)}>
          {t.replace(/-/g, " ")}
        </span>
      ))}
      {showClaim && hasPendingClaim && (
        <span className="sticker-tag" style={tagStyle("var(--neon-magenta)")}>
          CLAIM PENDING
        </span>
      )}
      {showClaim && !hasPendingClaim && event.isClaimable && (
        <span
          className={`sticker-tag${onClaimClick ? " sticker-tag--clickable" : ""}`}
          style={tagStyle("var(--neon-cyan)")}
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