import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DrawerMiniCard } from "@/components/drawers";
import EventPlanExtension from "./EventPlanExtension";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { usePlacezDrawerPlans, type PlacezDrawerEvent } from "@/hooks/usePlacezDrawerPlans";
import { centerThenOpenFromDrawer } from "@/lib/placezEventsDrawerApi";
import AuthModal from "@/components/AuthModal";
import "@/pages/Events.css";
import "@/components/events/DayMotif.css";
import "./PlacezEventsDrawer.css";

function Rail({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: ReactNode;
}) {
  "use memo";
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener("scroll", check, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, [children]);
  const page = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>(".pz-events-rail__item");
    const step = item ? item.getBoundingClientRect().width + 14 : el.clientWidth * 0.8;
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.classList.contains("calm-mode");
    el.scrollBy({ left: dir * step, behavior: quiet ? "auto" : "smooth" });
  }, []);
  return (
    <div className={`pz-events-rail-wrap${overflow ? " has-overflow" : ""}`}>
      <div ref={ref} className="pz-events-rail" role="list" aria-label={label} data-testid={testId}>
        {children}
      </div>
      <button type="button" className="pz-events-rail-arrow pz-events-rail-arrow--left" aria-label={`Previous in ${label}`} onClick={() => page(-1)}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button type="button" className="pz-events-rail-arrow pz-events-rail-arrow--right" aria-label={`More in ${label}`} onClick={() => page(1)}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

function EventItem({ item, side }: { item: PlacezDrawerEvent; side: "left" | "right" }) {
  "use memo";
  const rsvp = useEventRsvp();
  const listing = item.event;
  return (
    <div className={`pz-events-rail__item is-${side}`} role="listitem">
      {side === "left" && (
        <EventPlanExtension
          side="left"
          eventId={listing.id}
          eventTitle={listing.title}
          mizzedClosesAt={item.mizzedClosesAt}
        />
      )}
      <DrawerMiniCard
        event={listing}
        saved={rsvp.myEventIds.has(listing.id)}
        onToggleSave={() => rsvp.toggleRsvp(listing.id)}
        onOpen={() => void centerThenOpenFromDrawer({
          kind: "event",
          id: listing.id,
          title: listing.title,
          lat: listing.lat,
          lng: listing.lng,
        })}
      />
      {side === "right" && (
        <EventPlanExtension
          side="right"
          eventId={listing.id}
          eventTitle={listing.title}
          plans={item.plans}
        />
      )}
    </div>
  );
}

/**
 * Upcoming RSVP and planned events with a right-hand plan drawer, plus past
 * attended events with a left-hand Mizzed countdown.
 */
export default function PlacezEventsRails() {
  "use memo";
  const { upcoming, past, loading, error, signedIn, retry } = usePlacezDrawerPlans();
  const rsvp = useEventRsvp();
  if (!signedIn) {
    return (
      <div className="pz-events-section pdx-glass-rebind" style={{ "--c": "var(--room-eventz)" } as CSSProperties}>
        <h3 className="pz-events-section__label">Upcoming events</h3>
        <p className="pz-events-status">Sign in to see events you have RSVP'd to and the plans attached to them.</p>
      </div>
    );
  }
  return (
    <div className="pz-events-section pdx-glass-rebind" style={{ "--c": "var(--room-eventz)" } as CSSProperties}>
      <section aria-label="Upcoming events">
        <h3 className="pz-events-section__label">Upcoming events</h3>
        {loading && <p className="pz-events-status" role="status">Loading your events…</p>}
        {error && <p className="pz-events-status" role="alert">Your events could not load. <button type="button" onClick={() => void retry()}>Retry</button></p>}
        {!loading && !error && upcoming.length === 0 && (
          <p className="pz-events-status">No upcoming events you have RSVP'd to or planned yet.</p>
        )}
        {upcoming.length > 0 && (
          <Rail label="Upcoming events you planned" testId="placez-upcoming-events-rail">
            {upcoming.map(item => <EventItem key={`${item.event.id}:${item.occurrenceDate}`} item={item} side="right" />)}
          </Rail>
        )}
      </section>
      <section aria-label="Past events">
        <h3 className="pz-events-section__label">Past events</h3>
        {!loading && !error && past.length === 0 && (
          <p className="pz-events-status">Past events you attended will show a Mizzed countdown here while the window is open.</p>
        )}
        {past.length > 0 && (
          <Rail label="Past events you attended" testId="placez-past-events-rail">
            {past.map(item => <EventItem key={`${item.event.id}:${item.occurrenceDate}`} item={item} side="left" />)}
          </Rail>
        )}
      </section>
      {rsvp.showAuth && <AuthModal onClose={() => rsvp.setShowAuth(false)} />}
    </div>
  );
}
