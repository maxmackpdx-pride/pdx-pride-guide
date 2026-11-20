import dockCompass from "@/assets/dock-compass.svg";
import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useHubPanel } from "@/context/HubPanelContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import {
  MOBILE_NAV_DISMISS,
  dismissMobileNavOverlays,
  type MobileNavDismissDetail,
} from "@/lib/mobileNavDismiss";
import { BOARDS_MENU, EVENTS_NAV, PLACES_NAV, navLinkActive } from "@/lib/siteNav";
import { MobileDockShell } from "@/components/ui/mobile-dock-shell";
import MobileWorldFan from "@/components/MobileWorldFan";
import { CalendarDays, LayoutGrid, MapPin, LifeBuoy } from "lucide-react";

function tabClass(
  active: boolean,
  accent: "cyan" | "green" | "lime" | "orange" | "pink" | "purple" | "blue" | "more",
) {
  return `hub-mobile-tab znav-control pdx-glass-rebind${active ? ` is-active is-${accent}` : ""}`;
}

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { open, closeSheet } = useInboxSheet();
  const { isOpen: hubOpen, closeHub } = useHubPanel();
  const overlayOpen = hubOpen || open;
  const [fanOpen, setFanOpen] = useState<"maps" | "places" | null>(null);
  const closeFan = useCallback(() => setFanOpen(null), []);

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "hub-panel") closeHub();
    if (except !== "inbox") closeSheet();
  }, [closeSheet, closeHub]);

  useEffect(() => {
    const onDismiss = (event: Event) => {
      const except = (event as CustomEvent<MobileNavDismissDetail>).detail?.except;
      closeFan();
      closeLocalSheets(except);
    };
    window.addEventListener(MOBILE_NAV_DISMISS, onDismiss);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, onDismiss);
  }, [closeLocalSheets, closeFan]);

  useEffect(() => {
    closeFan();
  }, [location, closeFan]);

  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const mapActive = navLinkActive(location, "/placez/map") || navLinkActive(location, "/map") || location === "/outzide";
  const placesActive = PLACES_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = navLinkActive(location, "/boardz") || BOARDS_MENU.some(item => navLinkActive(location, item.href)) || navLinkActive(location, "/hausing");
  const resourcesActive = navLinkActive(location, "/needz");
  const activeIndex = resourcesActive ? 4 : placesActive ? 1 : mapActive ? 2 : boardsActive ? 3 : eventsActive ? 0 : -1;

  const dismissExcept = (except?: MobileNavDismissDetail["except"]) => {
    closeLocalSheets(except);
    dismissMobileNavOverlays(except);
  };

  const handleNavLink = () => {
    dismissExcept();
  };

  const toggleWorldFan = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    // Pressing MAPZ no longer navigates directly: it fans the five map
    // worlds out of the dock, and a world in the fan is the navigation.
    // The canonical map href supports map-intent warming and the dock tab
    // styling and the no-JS fallback all keep working as before.
    event.preventDefault();
    if (fanOpen !== "maps") dismissExcept();
    setFanOpen(fanOpen === "maps" ? null : "maps");
  };

  const togglePlacesFan = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (fanOpen !== "places") dismissExcept();
    setFanOpen(fanOpen === "places" ? null : "places");
  };

  const handleWorldNavigate = () => {
    closeFan();
    dismissExcept();
  };

  return createPortal(
    <>
      <MobileDockShell activeIndex={activeIndex} overlayOpen={overlayOpen} location={location}>
          <Link
            href="/events"
            className={tabClass(eventsActive, "cyan")}
            data-accent="cyan"
            aria-current={eventsActive ? "page" : undefined}
            aria-label="Eventz"
            title="Eventz"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      </Link>

          <a
            href="/directory"
            className={tabClass(placesActive, "cyan")}
            data-accent="cyan"
            aria-label="Placez"
            title="Placez"
            aria-current={placesActive ? "page" : undefined}
            aria-haspopup="true"
            aria-expanded={fanOpen === "places"}
            aria-controls="places-fan"
            onClick={togglePlacesFan}
          >
            <span className="znav-icon-row"><MapPin size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      </a>

          <a
            href="/placez/map"
            className={tabClass(mapActive, "orange")}
            data-accent="orange"
            aria-current={mapActive ? "page" : undefined}
            aria-label="PlaceZ map"
            title="PlaceZ map"
            aria-haspopup="true"
            aria-expanded={fanOpen === "maps"}
            aria-controls="world-fan"
            onClick={toggleWorldFan}
          >
            <span className="znav-icon-row">
              <img src={dockCompass} alt="" width={28} height={32} style={{width:28,height:32,flexShrink:0}} />
            </span>
                      </a>

          <Link
            href="/boardz"
            className={tabClass(boardsActive, "pink")}
            data-accent="magenta"
            aria-current={boardsActive ? "page" : undefined}
            aria-label="Boardz"
            title="Boardz"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><LayoutGrid size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      </Link>

          <Link
            href="/needz"
            className={tabClass(resourcesActive, "green")}
            data-accent="green"
            aria-current={resourcesActive ? "page" : undefined}
            aria-label="NEEDZ"
            title="NEEDZ"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><LifeBuoy size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                      </Link>
      </MobileDockShell>

      <MobileWorldFan open={fanOpen === "maps"} onClose={closeFan} onNavigate={handleWorldNavigate} />
      <MobileWorldFan kind="places" open={fanOpen === "places"} onClose={closeFan} onNavigate={handleWorldNavigate} />
    </>,
    document.body,
  );
}
