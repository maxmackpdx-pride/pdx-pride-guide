import {
  EVENT_TALENT_ROLE_LABELS,
  type EventTalentRole,
  type UserEventTalentCard,
} from "@shared/eventTalent";

type EventWorkHereTagProps = {
  talent?: UserEventTalentCard | null;
  compact?: boolean;
};

function formatRoles(roles: EventTalentRole[]) {
  const labels = roles.map(role => EVENT_TALENT_ROLE_LABELS[role]);
  if (labels.length <= 2) return labels.join(" · ");
  return `${labels[0]} +${labels.length - 1}`;
}

export default function EventWorkHereTag({ talent, compact = false }: EventWorkHereTagProps) {
  if (!talent || talent.roles.length === 0) return null;

  const pending = talent.status === "PENDING";

  return (
    <div
      className={`event-card-work-here${compact ? " event-card-work-here--compact" : ""}${pending ? " event-card-work-here--pending" : ""}`}
      title={pending ? "Lineup request pending approval" : "You work this event"}
    >
      <span className="event-card-work-here__label">I WORK HERE</span>
      <span className="event-card-work-here__role">{formatRoles(talent.roles)}</span>
      {pending && <span className="event-card-work-here__pending">PENDING</span>}
    </div>
  );
}