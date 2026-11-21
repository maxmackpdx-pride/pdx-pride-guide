import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import DockDrawer, { type DockStop } from "@/components/dock/DockDrawer";
import { DrawerTop } from "@/components/drawers";
import AuthModal from "@/components/AuthModal";
import { RansomTitle } from "@/components/xerox/Overlays";
import { UpcomingOutdoorEvents } from "@/components/outz/BuddyHosting";
import OutzideInViewRail from "@/components/outz/OutzideInViewRail";
import { useMapViewportItems } from "@/hooks/useMapViewportItems";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { fetchOutzideFeatured, openOutzideCountdownItem } from "@/lib/outzideDrawerApi";
import { EMPTY_DRAWER_FILTERS, type DrawerFilterState, type InViewItem } from "@shared/drawerFilters";
import { nextOutzideCountdown, type OutzideCountdownItem } from "@shared/outzideDrawer";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./OutzideDrawer.css";

/**
 * Outzide map drawer. Shared DrawerTop, but the calendar is replaced by a
 * full-bleed in-view mini card rail. The countdown mixes buddy events and
 * offered carpools with next-up events. Section titles use the ransom-note
 * style, which is for Outzide titles only.
 */
export default function OutzideDrawer({
  now,
  leadItems,
  events,
  featured,
  startOpen = false,
}: {
  now?: number;
  leadItems?: InViewItem[];
  events?: DrawerTopEvent[];
  featured?: OutzideCountdownItem[];
  startOpen?: boolean;
} = {}) {
  "use memo";
  const [stop, setStop] = useState<DockStop>(() => (startOpen ? 1 : 0));
  const [filters, setFilters] = useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
  const [auth, setAuth] = useState(false);
  const live = useMapViewportItems(leadItems == null, filters);
  const rsvp = useEventRsvp();
  const featuredQuery = useQuery({
    queryKey: ["/api/outz/buddies", "outzide-drawer-featured"],
    queryFn: fetchOutzideFeatured,
    enabled: featured == null,
  });
  const eventQuery = useQuery<DrawerTopEvent[]>({
    queryKey: ["/api/events", "outzide-drawer-countdown"],
    queryFn: () => fetch("/api/events", { credentials: "same-origin" }).then(r => r.json()),
    enabled: events == null,
  });
  const at = now ?? Date.now();
  const items = leadItems ?? live.items;
  const mixed = useMemo(
    () => nextOutzideCountdown(events ?? eventQuery.data ?? [], featured ?? featuredQuery.data ?? [], at, 3),
    [events, eventQuery.data, featured, featuredQuery.data, at],
  );
  const [tick, setTick] = useState(at);
  useEffect(() => {
    if (now != null) return;
    const id = window.setInterval(() => setTick(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [now]);
  const countdownNow = now ?? tick;

  return (
    <>
      <DockDrawer
        accent="var(--room-outz, var(--neon-orange))"
        ariaLabel="Outzide in view, upcoming countdown, and filters"
        lipLabel="Outzide · In view · Filters"
        stop={stop}
        onStopChange={setStop}
        maxStops={1}
      >
        <div className="outz-drawer pdx-glass-rebind" style={{ "--c": "var(--room-outz, var(--neon-orange))" } as CSSProperties} data-testid="outzide-drawer">
          <DrawerTop
            events={events ?? eventQuery.data ?? []}
            countdownEvents={mixed}
            filters={filters}
            onFiltersChange={setFilters}
            now={countdownNow}
            onOpenEvent={event => openOutzideCountdownItem(event)}
            lead={
              live.loading && leadItems == null ? (
                <p className="outz-drawer-status" role="status">Loading what is in view…</p>
              ) : live.error && leadItems == null ? (
                <p className="outz-drawer-status" role="alert">
                  What is in view could not load.{" "}
                  <button type="button" onClick={() => void live.retry()}>Retry</button>
                </p>
              ) : (
                <OutzideInViewRail
                  items={items}
                  savedIds={rsvp.myEventIds}
                  onToggleSave={(kind, id) => {
                    if (kind === "event") rsvp.toggleRsvp(id);
                    else setAuth(true);
                  }}
                  onOpenEvent={event => openOutzideCountdownItem(event)}
                  onOpenPlace={(id, name) => { window.location.assign(`/outzide/${id}`); void name; }}
                />
              )
            }
          />
          <section aria-label="Upcoming">
            <h2 className="outz-drawer-title" aria-label="Coming up">
              <span aria-hidden="true"><RansomTitle text="Coming up" seed="outzide-drawer-upcoming" /></span>
            </h2>
            <UpcomingOutdoorEvents />
          </section>
        </div>
      </DockDrawer>
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </>
  );
}
