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

/** The z/ mark for the namespace tab. Real vector art, same prime Z as the hub. */
function ZSlashMark({ active }: { active: boolean }) {
  return (
    <img
      src="/brand/family/prime-z.svg"
      alt=""
      width={MOBILE_ICON}
      height={MOBILE_ICON}
      className={`hub-mobile-tab__z-slash${active ? " is-active" : ""}`}
      decoding="async"
      aria-hidden
    />
  );
}

/**
 * Center Hub tab: monochrome Z + bar (app face / design guide).
 * Icon only — no “Hub” label under the mark.
 */
function HubMark({ active }: { active: boolean }) {
  return (
    <img
      src="/brand/family/prime-z.svg"
      alt=""
      width={43}
      height={43}
      className={`hub-mobile-tab__z-mark${active ? " is-active" : ""}`}
      decoding="async"
      aria-hidden
    />
  );
}

function tabClass(
  active: boolean,
  accent: "cyan" | "green" | "lime" | "orange" | "pink" | "more",
) {
  return `hub-mobile-tab${active ? ` is-active is-${accent}` : ""}`;
}

/**
 * Mobile bottom navigation (all visitors), a single 5-tab footer used across the
 * whole site: Places / Events / Hub (center) / z/ / Messages. Beaches lives
 * inside the Events sheet. The z/ tab goes straight to the namespace index
 * rather than opening a sheet. This is the only mobile
 * bottom bar - hub/admin shells no longer render their own.
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { open, openSheet, closeSheet } = useInboxSheet();
  const { total: attentionCount } = useInboxAttentionCount();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const closeLocalSheets = useCallback((except?: MobileNavDismissDetail["except"]) => {
    if (except !== "events") setEventsOpen(false);
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
  }, [location]);

  const placesActive = navLinkActive(location, "/directory");
  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = BOARD_NAV.some(item => navLinkActive(location, item.href));
  const zIndexActive = navLinkActive(location, "/z");
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

      <nav className="hub-mobile-bar site-hub-mobile-bar" aria-label="Site mobile navigation">
        <div className="hub-mobile-bar__dock">
          {/* No decorative pull on the site-wide dock - hub drawer grip is only on /dashboard */}
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

          {/* The boards tab is the namespace now: the z/ mark, straight to /z,
              where every board and its categories are listed on one page. */}
          <Link
            href="/z"
            className={tabClass(boardsActive || zIndexActive, "lime")}
            aria-label="z slash, every board"
            aria-current={zIndexActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <ZSlashMark active={boardsActive || zIndexActive} />
            <span>z/</span>
          </Link>

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
