import type { CSSProperties } from "react";

/**
 * Loading state for the Eventz rails: the lead rail at the big card's fixed
 * 200 x 403 size, then a compact rail at 136 x 170, so nothing jumps when the
 * real cards land. Bones use the shared board skeleton pulse.
 */
function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`board-feed-skeleton__bone ${className}`} style={style} />;
}

function Rail({ size, count, color }: { size: "full" | "m"; count: number; color: string }) {
  return (
    <section className={`events-rail-sec events-rail-sec--${size} events-rail-skel pdx-glass-rebind`} style={{ "--c": color } as CSSProperties} aria-hidden="true">
      <div className="events-rail-sec__head"><Bone style={{ width: size === "full" ? 168 : 120, height: 20 }} /></div>
      <div className="events-rail">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="events-rail__item">
            <Bone className={`events-rail-skel__card events-rail-skel__card--${size}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function EventsRailSkeleton() {
  return (
    <div className="events-rails" role="status" aria-label="Loading events">
      <Rail size="full" count={3} color="var(--panel-cyan)" />
      <Rail size="m" count={5} color="var(--panel-cyan)" />
    </div>
  );
}
