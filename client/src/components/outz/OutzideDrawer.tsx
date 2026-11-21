import { useDrawerClock } from "@/components/drawers/useDrawerClock";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DockDrawer, { type DockStop } from "@/components/dock/DockDrawer";
import { DrawerTop } from "@/components/drawers";
import { RansomTitle } from "@/components/xerox/Overlays";
import { useAuth } from "@/context/AuthContext";
import { useMapBounds } from "@/hooks/useMapViewportItems";
import { apiRequest } from "@/lib/queryClient";
import { fetchOutzideFeatured, openOutzideCountdownItem } from "@/lib/outzideDrawerApi";
import { formatPacificDateTime } from "@/lib/countdown";
import { EMPTY_DRAWER_FILTERS, eventMatchesAnyTime, placeIsInBounds, type DrawerFilterState } from "@shared/drawerFilters";
import { nextOutzideCountdown, upcomingOutzidePlans } from "@shared/outzideDrawer";
import type { DrawerTopEvent } from "@shared/drawerTop";
import OutzideInViewRail, { type OutdoorDestination } from "./OutzideInViewRail";
import "./OutzideDrawer.css";

export function OutzideDrawerContent({ browse, onOpen }: {
  browse?: OutdoorDestination[];
  onOpen?: (place: OutdoorDestination) => void;
}) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
  const now = useDrawerClock();
  const bounds = useMapBounds(browse === undefined);
  const catalog = useQuery<{ places: OutdoorDestination[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json").then(r => r.json()),
    enabled: browse === undefined,
  });
  const events = useQuery<DrawerTopEvent[]>({ queryKey: ["/api/events"] });
  const featured = useQuery({
    queryKey: ["/api/outz/buddies", "outzide-drawer-featured", user?.id ?? null],
    queryFn: fetchOutzideFeatured,
  });
  const matches = (event: DrawerTopEvent) => eventMatchesAnyTime(event, filters.times, now);
  const available = (featured.data ?? []).filter(matches);
  const upcoming = nextOutzideCountdown((events.data ?? []).filter(matches), available, now, 1);
  const plans = upcomingOutzidePlans(available, now);
  const destinations = browse ?? (catalog.data?.places ?? []).filter(row =>
    row.lat != null && row.lng != null && placeIsInBounds({id: 0, lat: row.lat, lng: row.lng}, bounds));
  return <div className="outz-drawer" data-testid="outzide-drawer">
    <DrawerTop events={upcoming} countdownEvents={upcoming} filters={filters} onFiltersChange={setFilters}
      filterGroups={["time"]} now={now} onOpenEvent={openOutzideCountdownItem}
      upcomingTitle={<RansomTitle text="Up next" seed="outz-up-next"/>}
      filtersTitle={<RansomTitle text={browse ? "Destinations" : "In view"} seed="outz-in-view"/>}
      lead={catalog.isError && browse === undefined ? <p role="alert">Destinations could not load. <button onClick={() => void catalog.refetch()}>Retry</button></p>
        : catalog.isPending && browse === undefined ? <p role="status">Loading destinations…</p>
        : <OutzideInViewRail destinations={destinations} onOpen={onOpen}/>}
    />
    <section aria-label="Next up, buddies and carpools">
      <h2 className="outz-drawer-title"><RansomTitle text="Buddies & carpools" seed="outz-plans"/></h2>
      {featured.isPending && <p role="status">Loading outdoor plans…</p>}
      {featured.isError && <p role="alert">Outdoor plans could not load. <button onClick={() => void featured.refetch()}>Retry</button></p>}
      {events.isError && <p role="alert">Events could not load. <button onClick={() => void events.refetch()}>Retry</button></p>}
      {featured.isSuccess && !plans.length && <p>No upcoming buddies or offered rides for these dates.</p>}
      {plans.map(plan => <a className="outz-plan-row" key={plan.kind + plan.id} href={plan.href}>
        <span className="outz-plan-kind">{plan.kind === "buddy" ? "Buddy" : "Carpool"}</span>
        <span><strong>{plan.title}</strong><small>{[formatPacificDateTime(plan.dateStart, {month:"short",day:"numeric"}), plan.venueName].filter(Boolean).join(" · ")}</small></span>
      </a>)}
    </section>
  </div>;
}

export default function OutzideDrawer() {
  const [stop, setStop] = useState<DockStop>(0);
  return <DockDrawer accent="var(--neon-orange)" ariaLabel="Outzide plans and destinations" lipLabel="Outzide · Plans" stop={stop} onStopChange={setStop} maxStops={1}>
    <OutzideDrawerContent/>
  </DockDrawer>;
}
