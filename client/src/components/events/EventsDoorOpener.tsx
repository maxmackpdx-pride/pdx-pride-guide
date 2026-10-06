import "./EventsDoorOpener.css";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Ticket-stub opener for Eventz: today's day token and date, then the live count tonight. */
export default function EventsDoorOpener({ tonightCount, now }: { tonightCount: number; now: number }) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", day: "numeric" }).formatToParts(new Date(now));
  const weekday = (parts.find(part => part.type === "weekday")?.value ?? "").toUpperCase();
  const day = parts.find(part => part.type === "day")?.value ?? "";
  const key = DAYS.find(code => code === weekday.toLowerCase().slice(0, 3)) ?? "tue";
  return (
    <div className="events-door-opener">
      <span className="events-door-stub" style={{ "--stub": `var(--day-${key})` } as React.CSSProperties} aria-hidden="true">{weekday} {day}</span>
      <span className="events-door-opener__text">
        <span>Your night starts here</span>
        {tonightCount > 0 && <small><i aria-hidden="true" />{tonightCount} on tonight</small>}
      </span>
    </div>
  );
}
