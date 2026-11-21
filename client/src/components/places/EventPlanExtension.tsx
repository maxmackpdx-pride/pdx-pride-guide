import { useEffect, useState, type CSSProperties } from "react";
import {
  formatMizzedCountdown,
  hasAttachedPlans,
  planExtensionLines,
  type DrawerEventPlans,
} from "@shared/placezEventsDrawer";
import { openMizzedForEvent } from "@/lib/placezEventsDrawerApi";

/**
 * Stylized text extension that slides out beside a standard small event card.
 * Upcoming plans sit on the right. Past Mizzed countdowns sit on the left.
 */
export default function EventPlanExtension({
  side,
  eventId,
  eventTitle,
  plans,
  mizzedClosesAt,
}: {
  side: "left" | "right";
  eventId: number;
  eventTitle: string;
  plans?: DrawerEventPlans;
  mizzedClosesAt?: string | null;
}) {
  "use memo";
  const isMizzed = side === "left";
  const lines = plans ? planExtensionLines(plans) : [];
  const canOpen = isMizzed ? !!mizzedClosesAt : hasAttachedPlans(plans);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isMizzed || !mizzedClosesAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [isMizzed, mizzedClosesAt]);
  if (!canOpen) return null;
  const closes = mizzedClosesAt ? Date.parse(mizzedClosesAt) : NaN;
  const countdown = Number.isFinite(closes) ? formatMizzedCountdown(closes, now) : "";
  const accent = isMizzed ? "var(--room-mizzed)" : "var(--room-eventz)";
  const toggleLabel = open
    ? isMizzed
      ? `Hide Mizzed countdown for ${eventTitle}`
      : `Hide plans for ${eventTitle}`
    : isMizzed
      ? `Show Mizzed countdown for ${eventTitle}`
      : `Show plans for ${eventTitle}`;
  return (
    <div

      className={`pz-plan-ext pdx-glass-rebind is-${side}${open ? " is-open" : ""}`}
      style={{ "--piece": accent, "--c": accent } as CSSProperties}
      data-testid={isMizzed ? "placez-mizzed-drawer" : "placez-plan-drawer"}
    >
      <button
        type="button"
        className="pz-plan-ext__toggle"
        aria-expanded={open}
        aria-label={toggleLabel}
        onClick={() => setOpen(value => !value)}
      >
        <span aria-hidden="true">{open ? (side === "right" ? "‹" : "›") : (side === "right" ? "›" : "‹")}</span>
      </button>
      <div className="pz-plan-ext__body" hidden={!open}>
        {isMizzed ? (
          <button
            type="button"
            className="pz-plan-ext__mizzed"
            aria-label={`${countdown}. Open Mizzed Connections for ${eventTitle}`}
            onClick={() => openMizzedForEvent(eventId)}
          >
            <span>
              <span className="pz-plan-ext__kicker">Mizzed Connections</span>
              <strong className="pz-plan-ext__count">{countdown}</strong>
              <small className="pz-plan-ext__hint">Open this event</small>
            </span>
          </button>
        ) : (
          <>
            <p className="pz-plan-ext__kicker">Your plans</p>
            <ul className="pz-plan-ext__list">
              {lines.map(line => <li key={line}>{line}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
