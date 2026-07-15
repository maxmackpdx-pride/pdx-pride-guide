import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { CalendarDays, Home, LayoutGrid, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useInboxAttentionCount } from "@/hooks/useInboxAttentionCount";
import {
  MOBILE_NAV_DISMISS,
  dismissMobileNavOverlays,
  type MobileNavDismissDetail,
} from "@/lib/mobileNavDismiss";
import { BOARD_NAV, EVENTS_NAV, navLinkActive } from "@/lib/siteNav";
import AuthModal from "./AuthModal";

const MOBILE_ICON = 26;

function tabClass(active: boolean, accent: "cyan" | "green" | "lime" | "orange" | "more") {
  return `hub-mobile-tab${active ? ` is-active is-${accent}` : ""}`;
}

/**
 * Mobile bottom navigation (all visitors), a single 5-tab footer used across the
 * whole site: Places / Events / Hub (center) / Boards / Messages. Beaches lives
 * inside the Events sheet (same pattern as Boards). This is the only mobile
 * bottom bar — hub/admin shells no longer render their own.
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { open, openSheet, closeSheet } = useInboxSheet();
  const { total: attentionCount } = useInboxAttentionCount();
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "events") setEventsOpen(false);
    if (except !== "boards") setBoardsOpen(false);
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
    setBoardsOpen(false);
    setEventsOpen(false);
  }, [location]);

  const placesActive = navLinkActive(location, "/directory");
  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = BOARD_NAV.some(item => navLinkActive(location, item.href));
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

  const handleBoards = () => {
    if (boardsOpen) {
      setBoardsOpen(false);
      return;
    }
    dismissExcept("boards");
    setBoardsOpen(true);
  };

  const handleMessages = () => {
    if (!user) {
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
          <div className="hub-more-sheet" role="dialog" aria-label="Events">
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

      {boardsOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setBoardsOpen(false)} aria-hidden="true" />
          <div className="hub-more-sheet" role="dialog" aria-label="Boards">
            <h3>Boards</h3>
            {BOARD_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`hub-more-item${navLinkActive(location, item.href) ? " is-active" : ""}`}
                onClick={() => setBoardsOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <nav className="hub-mobile-bar site-hub-mobile-bar" aria-label="Site mobile navigation">
        <Link
          href="/directory"
          className={tabClass(placesActive, "cyan")}
          aria-label="Places"
          aria-current={placesActive ? "page" : undefined}
          onClick={handleNavLink}
        >
          <MapPin size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Places</span>
        </Link>

        <button
          type="button"
          className={tabClass(eventsActive || eventsOpen, "orange")}
          aria-expanded={eventsOpen}
          aria-haspopup="dialog"
          aria-label="Events"
          onClick={handleEvents}
        >
          <CalendarDays size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Events</span>
        </button>

        {user ? (
          <Link
            href="/dashboard"
            className={`${tabClass(hubActive, "cyan")} hub-mobile-tab--center`}
            aria-label="Hub"
            aria-current={hubActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <Home size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Hub</span>
          </Link>
        ) : (
          <button
            type="button"
            className={`${tabClass(false, "cyan")} hub-mobile-tab--center`}
            aria-label="Hub"
            onClick={() => {
              dismissExcept();
              setShowAuth(true);
            }}
          >
            <Home size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Hub</span>
          </button>
        )}

        <button
          type="button"
          className={tabClass(boardsActive || boardsOpen, "more")}
          aria-expanded={boardsOpen}
          aria-haspopup="dialog"
          aria-label="Boards"
          onClick={handleBoards}
        >
          <LayoutGrid size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Boards</span>
        </button>

        <button
          type="button"
          className={tabClass(Boolean(user && open), "cyan")}
          data-inbox-open-trigger="messages"
          onClick={handleMessages}
          aria-expanded={user ? open : undefined}
          aria-label={
            attentionCount > 0
              ? `Messages, ${attentionCount} need attention`
              : "Messages"
          }
        >
          <span className="hub-mobile-tab__icon-wrap">
            <MessageCircle size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            {user && attentionCount > 0 && <i>{attentionCount > 9 ? "9+" : attentionCount}</i>}
          </span>
          <span>Messages</span>
        </button>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>,
    document.body,
  );
}