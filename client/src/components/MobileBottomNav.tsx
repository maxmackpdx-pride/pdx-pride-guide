import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useInboxAttentionCount } from "@/hooks/useInboxAttentionCount";
import {
  MOBILE_NAV_DISMISS,
  dismissMobileNavOverlays,
  type MobileNavDismissDetail,
} from "@/lib/mobileNavDismiss";
import { BOARD_NAV, EVENTS_NAV, OUTZ_INDEX, OUTZ_NAV, navLinkActive } from "@/lib/siteNav";
import { isLocalDemo } from "@/lib/localDemo";
import { parseHubSection } from "@/components/hub/types";
import AuthModal from "./AuthModal";

const MOBILE_ICON = 19;
const HUB_Z_PATH = "M4 4h16v3.2L8.4 17H20v3H4v-3.2L15.6 7H4V4z";

/**
 * "Your Hub" rows in the Hub sheet. Each is a real /dashboard section, in the
 * order the nav handoff lists them. Messages is not a section: it opens the
 * inbox sheet, so it is rendered separately with its badge.
 */
const HUB_SHEET_LINKS = [
  { section: "feed", label: "Feed", icon: <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /> },
  { section: "profile", label: "Profile", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> },
  { section: "events", label: "Events", icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></> },
  { section: "people", label: "People", icon: <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5S15.5 16.5 15.5 20" /><path d="M16.5 8.5a3 3 0 1 1 0-5.9" /><path d="M18 14.3c2 .4 3.5 1.9 3.5 4.2" /></> },
  { section: "settings", label: "Settings", icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1 2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" /></> },
] as const;

function TabIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width={MOBILE_ICON}
      height={MOBILE_ICON}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function HubMark() {
  return (
    <span className="hub-mobile-tab__z-glitch" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d={HUB_Z_PATH} fill="#e6e2d9" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 24 24" className="hub-mobile-tab__z-glitch-a">
        <path d={HUB_Z_PATH} fill="#19e3ff" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 24 24" className="hub-mobile-tab__z-glitch-b">
        <path d={HUB_Z_PATH} fill="#ff00cc" />
      </svg>
    </span>
  );
}

function tabClass(
  active: boolean,
  accent: "cyan" | "green" | "lime" | "orange" | "pink" | "purple" | "blue" | "more",
) {
  return `hub-mobile-tab${active ? ` is-active is-${accent}` : ""}`;
}

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { open, openSheet, closeSheet } = useInboxSheet();
  const { total: attentionCount } = useInboxAttentionCount();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [outzOpen, setOutzOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "events") setEventsOpen(false);
    if (except !== "boards") setSpaceOpen(false);
    if (except !== "outz") setOutzOpen(false);
    if (except !== "hub-sheet") setHubOpen(false);
    if (except !== "inbox") closeSheet();
  }, [closeSheet]);

  useEffect(() => {
    const onDismiss = (event: Event) => {
      const except = (event as CustomEvent<MobileNavDismissDetail>).detail?.except;
      closeLocalSheets(except);
    };
    window.addEventListener(MOBILE_NAV_DISMISS, onDismiss);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, onDismiss);
  }, [closeLocalSheets]);

  useEffect(() => {
    setEventsOpen(false);
    setSpaceOpen(false);
    setOutzOpen(false);
    setHubOpen(false);
  }, [location]);

  const placesActive = navLinkActive(location, "/directory");
  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = navLinkActive(location, "/z");
  const hubActive = navLinkActive(location, "/dashboard");
  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const hubSection = hubActive ? parseHubSection(new URLSearchParams(location.split("?")[1] || "").get("section")) : undefined;

  const dismissExcept = (except?: MobileNavDismissDetail["except"]) => {
    closeLocalSheets(except);
    dismissMobileNavOverlays(except);
  };

  const handleEvents = () => {
    if (eventsOpen) {
      setEventsOpen(false);
      return;
    }
    dismissExcept("events");
    setEventsOpen(true);
  };

  const handleSpace = () => {
    if (spaceOpen) {
      setSpaceOpen(false);
      return;
    }
    dismissExcept("boards");
    setSpaceOpen(true);
  };

  const handleOutz = () => {
    if (outzOpen) {
      setOutzOpen(false);
      return;
    }
    dismissExcept("outz");
    setOutzOpen(true);
  };

  const localDemo = isLocalDemo();

  /* Hub is navigation. Admin controls remain inside the Hub, never on the tab itself. */
  const handleHub = () => {
    if (!user && !localDemo) {
      dismissExcept();
      setShowAuth(true);
      return;
    }
    dismissExcept();
    setHubOpen(false);
    setLocation("/dashboard");
  };

  const handleMessages = () => {
    if (!user && !localDemo) {
      setShowAuth(true);
      return;
    }
    if (open) {
      closeSheet();
      return;
    }
    dismissExcept("inbox");
    openSheet();
  };

  const handleNavLink = () => {
    dismissExcept();
  };

  return createPortal(
    <>
      {eventsOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setEventsOpen(false)} aria-hidden="true" />
          <div className="hub-more-sheet hub-more-sheet--site" data-accent="cyan" role="dialog" aria-label="Eventz">
            <h3>Eventz</h3>
            {EVENTS_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`hub-more-item${navLinkActive(location, item.href) ? " is-active" : ""}`}
                onClick={() => setEventsOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {spaceOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setSpaceOpen(false)} aria-hidden="true" />
          <div className="hub-more-sheet hub-more-sheet--site" data-accent="violet" role="dialog" aria-label="Z/ Communities">
            <h3>Z/ Communities</h3>
            {BOARD_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`hub-more-item${navLinkActive(location, item.href) ? " is-active" : ""}`}
                data-accent={item.accent}
                onClick={() => setSpaceOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              type="button"
              className={`hub-more-item hub-more-item--drawer${outzOpen ? " is-active" : ""}`}
              data-accent="orange"
              aria-expanded={outzOpen}
              aria-haspopup="dialog"
              onClick={handleOutz}
            >
              <span>Outz</span>
            </button>
          </div>
        </>
      )}

      {outzOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setOutzOpen(false)} aria-hidden="true" />
          <div className="hub-outz-drawer" role="dialog" aria-label="Outz, most visited">
            <span className="hub-outz-drawer__kicker">Outz &middot; Most Visited</span>
            {OUTZ_NAV.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="hub-outz-drawer__row"
                onClick={() => setOutzOpen(false)}
              >
                <span className="hub-outz-drawer__num">{index + 1}</span>
                <span className="hub-outz-drawer__name">{item.label}</span>
              </Link>
            ))}
            <Link
              href={OUTZ_INDEX}
              className="hub-outz-drawer__all"
              onClick={() => setOutzOpen(false)}
            >
              View All Outz &rarr;
            </Link>
          </div>
        </>
      )}

      {hubOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setHubOpen(false)} aria-hidden="true" />
          <div className="hub-sheet" role="dialog" aria-label="Your Hub">
            <span className="hub-sheet__grip" aria-hidden="true" />
            <div className="hub-sheet__body">
              <div className="hub-sheet__switch" role="group" aria-label="Hub account">
                <Link
                  href="/dashboard"
                  className="hub-sheet__switch-btn is-on"
                  onClick={() => setHubOpen(false)}
                >
                  Member
                </Link>
                {isAdmin ? (
                  <Link
                    href="/dashboard?section=admin"
                    className="hub-sheet__switch-btn"
                    onClick={() => setHubOpen(false)}
                  >
                    Admin
                  </Link>
                ) : (
                  <span className="hub-sheet__switch-btn is-off" aria-disabled="true">
                    Admin
                  </span>
                )}
              </div>

              <div className="hub-sheet__kicker">Your Hub</div>
              <div className="hub-sheet__list">
                {HUB_SHEET_LINKS.map(row => {
                  const current = hubActive && hubSection === row.section;
                  return (
                    <Link
                      key={row.section}
                      href={`/dashboard?section=${row.section}`}
                      className={`hub-sheet__row${current ? " is-current" : ""}`}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setHubOpen(false)}
                    >
                      <TabIcon>{row.icon}</TabIcon>
                      <span className="hub-sheet__row-label">{row.label}</span>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  className="hub-sheet__row"
                  onClick={() => {
                    setHubOpen(false);
                    dismissExcept("inbox");
                    openSheet();
                  }}
                >
                  <TabIcon>
                    <path d="M3 8l7.5 5a3 3 0 0 0 3 0L21 8" />
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                  </TabIcon>
                  <span className="hub-sheet__row-label">Messages</span>
                  {attentionCount > 0 && (
                    <span className="hub-sheet__row-badge">
                      {attentionCount > 9 ? "9+" : attentionCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="hub-mobile-bar site-hub-mobile-bar" aria-label="Site mobile navigation">
        <div className="hub-mobile-bar__dock">
          <button
            type="button"
            className={tabClass(eventsActive || eventsOpen, "cyan")}
            aria-expanded={eventsOpen}
            aria-haspopup="dialog"
            aria-label="Eventz"
            onClick={handleEvents}
          >
            <TabIcon>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 9h18M8 2v4M16 2v4" />
            </TabIcon>
            <span>Eventz</span>
          </button>

          <Link
            href="/directory"
            className={tabClass(placesActive, "blue")}
            aria-label="Placez"
            aria-current={placesActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <TabIcon>
              <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
              <circle cx="12" cy="10" r="2.5" />
            </TabIcon>
            <span>Placez</span>
          </Link>

          <button
            type="button"
            className={`${tabClass(hubActive, "cyan")} hub-mobile-tab--center hub-mobile-tab--hub-icon`}
            aria-label="Hub"
            title="Hub"
            aria-current={hubActive ? "page" : undefined}
            onClick={handleHub}
          >
            <HubMark />
            <span>Hub</span>
          </button>

          <button
            type="button"
            className={tabClass(boardsActive || spaceOpen || outzOpen, "purple")}
            aria-expanded={spaceOpen}
            aria-haspopup="dialog"
            aria-label="Z/ Communities"
            onClick={handleSpace}
          >
            <TabIcon>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </TabIcon>
            <span>Z/</span>
          </button>

          <button
            type="button"
            className={tabClass(Boolean((user || localDemo) && open), "pink")}
            data-inbox-open-trigger="messages"
            onClick={handleMessages}
            aria-expanded={user || localDemo ? open : undefined}
            aria-label={
              attentionCount > 0
                ? `Messages, ${attentionCount} need attention`
                : "Messages"
            }
          >
            <span className="hub-mobile-tab__icon-wrap">
              <TabIcon>
                <path d="M21 8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h5" />
                <path d="M3 8l9 6 9-6" />
              </TabIcon>
              {user && attentionCount > 0 && <i>{attentionCount > 9 ? "9+" : attentionCount}</i>}
            </span>
            <span>Messages</span>
          </button>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>,
    document.body,
  );
}
