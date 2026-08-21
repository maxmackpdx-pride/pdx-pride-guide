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
import { BOARD_NAV, EVENTS_NAV, navLinkActive } from "@/lib/siteNav";
import { isLocalDemo } from "@/lib/localDemo";
import AuthModal from "./AuthModal";

const MOBILE_ICON = 19;
const HUB_Z_PATH = "M4 4h16v3.2L8.4 17H20v3H4v-3.2L15.6 7H4V4z";

/**
 * Shared tab glyph. The handoff draws every tab at 19px, stroke 2.2, so the
 * icons are inline paths rather than a mix of icon-library defaults.
 */
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

/**
 * Center Hub tab: the glitch Z. Three stacked copies of the mark, the two
 * colour plates screened over a white base and offset on their own cycles.
 */
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

/**
 * Mobile bottom navigation (all visitors), a single 5-tab footer used across the
 * whole site: Places / Events / Hub (center) / Boards / Messages. Beaches lives
 * inside the Events sheet (same pattern as Boards). This is the only mobile
 * bottom bar - hub/admin shells no longer render their own.
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { open, openSheet, closeSheet } = useInboxSheet();
  const { total: attentionCount } = useInboxAttentionCount();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "events") setEventsOpen(false);
    if (except !== "boards") setSpaceOpen(false);
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
  }, [location]);

  const placesActive = navLinkActive(location, "/directory");
  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = navLinkActive(location, "/z");
  const hubActive = navLinkActive(location, "/dashboard");

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

  const localDemo = isLocalDemo();

  const handleMessages = () => {
    // Local demo: open guest glass inbox without forcing login first.
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

  // Portaled to <body>: position:fixed breaks on iOS Safari when any ancestor
  // clips overflow (#root/.app-shell do), so the bar must live outside them.
  return createPortal(
    <>
      {eventsOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setEventsOpen(false)} aria-hidden="true" />
          <div className="hub-more-sheet hub-more-sheet--site" data-accent="cyan" role="dialog" aria-label="Events">
            <h3>Events</h3>
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
          <div className="hub-more-sheet hub-more-sheet--site" data-accent="violet" role="dialog" aria-label="Z/Space">
            <h3>Z/Space</h3>
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
          </div>
        </>
      )}

      <nav className="hub-mobile-bar site-hub-mobile-bar" aria-label="Site mobile navigation">
        <div className="hub-mobile-bar__dock">
          {/* No decorative pull on the site-wide dock - hub drawer grip is only on /dashboard */}
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

          {user || localDemo ? (
            <Link
              href="/dashboard"
              className={`${tabClass(hubActive, "cyan")} hub-mobile-tab--center hub-mobile-tab--hub-icon`}
              aria-label="Hub"
              title="Hub"
              aria-current={hubActive ? "page" : undefined}
              onClick={handleNavLink}
            >
              <HubMark />
              <span>Hub</span>
            </Link>
          ) : (
            <button
              type="button"
              className={`${tabClass(false, "cyan")} hub-mobile-tab--center hub-mobile-tab--hub-icon`}
              aria-label="Hub"
              title="Hub"
              onClick={() => {
                dismissExcept();
                setShowAuth(true);
              }}
            >
              <HubMark />
              <span>Hub</span>
            </button>
          )}

          <button
            type="button"
            className={tabClass(boardsActive || spaceOpen, "purple")}
            aria-expanded={spaceOpen}
            aria-haspopup="dialog"
            aria-label="Z/Space"
            onClick={handleSpace}
          >
            <TabIcon>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </TabIcon>
            <span>Z/Space</span>
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
