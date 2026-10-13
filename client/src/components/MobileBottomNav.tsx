import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useHubPanel } from "@/context/HubPanelContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import {
  MOBILE_NAV_DISMISS,
  dismissMobileNavOverlays,
  type MobileNavDismissDetail,
} from "@/lib/mobileNavDismiss";
import { BOARDS_MENU, EVENTS_NAV, navLinkActive } from "@/lib/siteNav";
import { MobileDockShell } from "@/components/ui/mobile-dock-shell";
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

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "hub-panel") closeHub();
    if (except !== "inbox") closeSheet();
  }, [closeSheet, closeHub]);

  useEffect(() => {
    const onDismiss = (event: Event) => {
      const except = (event as CustomEvent<MobileNavDismissDetail>).detail?.except;
      closeLocalSheets(except);
    };
    window.addEventListener(MOBILE_NAV_DISMISS, onDismiss);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, onDismiss);
  }, [closeLocalSheets]);

  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const mapActive = navLinkActive(location, "/map") || navLinkActive(location, "/outzide");
  const placesActive = navLinkActive(location, "/directory");
  const boardsActive = navLinkActive(location, "/boards") || BOARDS_MENU.some(item => navLinkActive(location, item.href)) || navLinkActive(location, "/hausing");
  const resourcesActive = navLinkActive(location, "/rezources");
  const activeIndex = resourcesActive ? 4 : placesActive ? 1 : mapActive ? 2 : boardsActive ? 3 : eventsActive ? 0 : -1;

  const dismissExcept = (except?: MobileNavDismissDetail["except"]) => {
    closeLocalSheets(except);
    dismissMobileNavOverlays(except);
  };

  const handleNavLink = () => {
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
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Eventz</span>
          </Link>

          <Link
            href="/directory"
            className={tabClass(placesActive, "cyan")}
            data-accent="cyan"
            aria-label="Placez"
            title="Placez"
            aria-current={placesActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><MapPin size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Placez</span>
          </Link>

          <Link
            href="/map"
            className={tabClass(mapActive, "orange")}
            data-accent="orange"
            aria-current={mapActive ? "page" : undefined}
            aria-label="MAPZ"
            title="MAPZ"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row">
              <svg width="28" height="32" style={{ width: 28, height: 32, flexShrink: 0 }} viewBox="0 0 36 42" fill="none" aria-hidden="true" focusable="false">
                <circle cx="18" cy="21" r="11.5" stroke="#fff" strokeWidth="2.2" />
                <circle cx="18" cy="21" r="7.5" stroke="#fff" strokeWidth="1.2" opacity=".72" />
                <path d="M18 7.5 20 11h-4l2-3.5ZM31.5 21 28 23v-4l3.5 2ZM18 34.5 16 31h4l-2 3.5ZM4.5 21 8 19v4l-3.5-2Z" fill="#fff" />
                <path d="m14.5 14.5 10 6.5-10 6.5v-13Z" fill="#fff" />
                <g fill="#fff" fontFamily="Arial Narrow, Arial, sans-serif" fontSize="5.4" fontWeight="900" textAnchor="middle">
                  <text x="18" y="5.5">N</text>
                  <text x="33.5" y="22.9">E</text>
                  <text x="18" y="41">S</text>
                  <text x="2.5" y="22.9">W</text>
                </g>
              </svg>
            </span>
            <span className="znav-caption">MAPZ</span>
          </Link>

          <Link
            href="/boards"
            className={tabClass(boardsActive, "pink")}
            data-accent="magenta"
            aria-current={boardsActive ? "page" : undefined}
            aria-label="Boardz"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><LayoutGrid size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Boardz</span>
          </Link>

          <Link
            href="/rezources"
            className={tabClass(resourcesActive, "green")}
            data-accent="green"
            aria-current={resourcesActive ? "page" : undefined}
            aria-label="NEEDZ"
            title="NEEDZ"
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><LifeBuoy size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">NEEDZ</span>
          </Link>
      </MobileDockShell>

    </>,
    document.body,
  );
}
