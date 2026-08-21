import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { CalendarDays, MapPin, MessageCircle } from "lucide-react";
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

const MOBILE_ICON = 26;

/**
 * Center Hub tab: transparent Prime Z with a rainbow outline.
 * Icon only — no “Hub” label under the mark.
 */
function HubMark({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 874 640"
      width={43}
      height={43}
      className={`hub-mobile-tab__z-mark${active ? " is-active" : ""}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="mobile-hub-rainbow" x1="57" y1="62" x2="708" y2="577" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff19d6" />
          <stop offset="0.2" stopColor="#ff5319" />
          <stop offset="0.4" stopColor="#ffd119" />
          <stop offset="0.58" stopColor="#5bff19" />
          <stop offset="0.74" stopColor="#19f7ff" />
          <stop offset="0.88" stopColor="#1956ff" />
          <stop offset="1" stopColor="#e419ff" />
        </linearGradient>
      </defs>
      <path
        d="M 57 62 L 140 166 L 458 167 L 112 577 L 628 555 L 708 461 L 345 458 L 692 62 Z"
        fill="none"
        stroke="url(#mobile-hub-rainbow)"
        strokeWidth="30.5"
        strokeLinejoin="miter"
      />
    </svg>
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

      {spaceOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setSpaceOpen(false)} aria-hidden="true" />
          <div className="hub-more-sheet" role="dialog" aria-label="Z/Space">
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
          <Link
            href="/directory"
            className={tabClass(placesActive, "blue")}
            aria-label="Placez"
            aria-current={placesActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <MapPin size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Placez</span>
          </Link>

          <button
            type="button"
            className={tabClass(eventsActive || eventsOpen, "cyan")}
            aria-expanded={eventsOpen}
            aria-haspopup="dialog"
            aria-label="Eventz"
            onClick={handleEvents}
          >
            <CalendarDays size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Eventz</span>
          </button>

          {user || localDemo ? (
            <Link
              href="/dashboard"
              className={`${tabClass(hubActive, "cyan")} hub-mobile-tab--center hub-mobile-tab--hub-icon`}
              aria-label="Hub"
              title="Hub"
              aria-current={hubActive ? "page" : undefined}
              onClick={handleNavLink}
            >
              <HubMark active={hubActive} />
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
              <HubMark active={false} />
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
            <span
              aria-hidden
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                minHeight: 31,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontSize: 21, lineHeight: 0.84, letterSpacing: "-0.06em" }}>Z/</span>
              <span style={{ marginTop: 3, fontSize: 9, lineHeight: 1, letterSpacing: "0.08em" }}>SPACE</span>
            </span>
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
              <MessageCircle size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
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
