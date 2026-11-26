import { useDrawerClock } from "@/components/drawers/useDrawerClock";
import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { DiscoveryWordmark } from "@/components/drawers/DiscoveryWordmark";
import { useQuery } from "@tanstack/react-query";
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

export function OutzideDrawerContent({ browse, onOpen, showDestinations = true }: {
  showDestinations?: boolean;
  browse?: OutdoorDestination[];
  onOpen?: (place: OutdoorDestination) => void;
}) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DrawerFilterState>(EMPTY_DRAWER_FILTERS);
  const now = useDrawerClock();
  const bounds = useMapBounds(showDestinations && browse === undefined);
  const catalog = useQuery<{ places: OutdoorDestination[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json").then(r => r.json()),
    enabled: showDestinations && browse === undefined,
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
      filtersTitle={<RansomTitle text={showDestinations ? (browse ? "Destinations" : "In view") : "Plan dates"} seed="outz-in-view"/>}
      lead={!showDestinations ? null : catalog.isError && browse === undefined ? <p role="alert">Destinations could not load. <button onClick={() => void catalog.refetch()}>Retry</button></p>
        : catalog.isPending && browse === undefined ? <p role="status">Loading destinations…</p>
        : <OutzideInViewRail destinations={destinations} onOpen={onOpen} emptyMessage={browse ? "No destinations match these filters." : undefined}/>}
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

type DiscoveryAnchors = {
  heading: HTMLElement | null;
  grip: HTMLButtonElement;
  scroll: HTMLElement | null;
  onAreaStep: boolean;
};

/** The pinned map owns the area, activity, search, result list and pins.
 * Attach the room sign and public plans to its existing drawer, preserving its
 * gestures and filter state across every step. */
export default function OutzideDrawer({ mapRoot, onOpenDestination }: { mapRoot: RefObject<HTMLDivElement | null>; onOpenDestination: (id: string) => void }) {
  const [anchors, setAnchors] = useState<DiscoveryAnchors | null>(null);
  useEffect(() => {
    const root = mapRoot.current;
    if (!root) return;
    let shell: HTMLElement | null = null;
    const sync = () => {
      const drawer = root.querySelector<HTMLElement>("#discovery-drawer");
      const heading = drawer?.querySelector<HTMLElement>(".outdoor-flow-heading") ?? null;
      const grip = root.querySelector<HTMLButtonElement>('button[aria-controls="discovery-drawer"]');
      const scroll = heading?.closest<HTMLElement>(".drawer-scroll") ?? null;
      if (shell !== drawer || !heading) shell?.removeAttribute("data-glass-piece");
      shell = heading ? drawer : null;
      if (!grip) {
        setAnchors(null);
        return;
      }
      if (shell) shell.dataset.glassPiece = "overlay";
      const onAreaStep = !!scroll?.querySelector(".outdoor-area-list");
      setAnchors(previous => previous?.heading === heading && previous.grip === grip && previous.scroll === scroll
        && previous.onAreaStep === onAreaStep ? previous : { heading, grip, scroll, onAreaStep });
    };
    sync();
    const observer = new MutationObserver(records => {
      if (records.some(({target}) => !(target instanceof Element && target.closest(".maplibregl-map,.outz-drawer,.discovery-wordmark")))) sync();
    });
    observer.observe(root, {childList: true, subtree: true});
    return () => { observer.disconnect(); shell?.removeAttribute("data-glass-piece"); };
  }, [mapRoot]);
  if (!anchors) return null;
  return <>
    {anchors.heading && createPortal(<DiscoveryWordmark rooms={["outz"]}/>, anchors.heading)}
    {createPortal(<span className="native-outz-lip-brand" aria-hidden="true"><DiscoveryWordmark rooms={["outz"]}/></span>, anchors.grip)}
    {anchors.scroll && createPortal(<OutzideDrawerContent showDestinations={anchors.onAreaStep} onOpen={place=>onOpenDestination(place.id)}/>, anchors.scroll)}
  </>;
}
