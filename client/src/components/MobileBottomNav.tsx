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
import { BOARD_NAV, EVENTS_NAV, OUTZ_INDEX, OUTZ_NAV, PRIMARY_NAV, navLinkActive } from "@/lib/siteNav";
import { isLocalDemo } from "@/lib/localDemo";
import { parseHubSection } from "@/components/hub/types";
import AuthModal from "./AuthModal";
import { CalendarDays, MapPin, LayoutGrid, MessageCircle } from "lucide-react";

const MOBILE_ICON = 19;
// Preserve access to the destinations that do not occupy a bottom-bar tab.
const EXPLORE_LINKS = PRIMARY_NAV.filter(entry => entry.type === "link" && ["/map", "/z", "/the-hauz"].includes(entry.href));

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

function MapzMark() {
  return (
    <img className="hub-mobile-tab__prime-mark" src="/brand/family/prime-z.svg" width="26" height="22" alt="" aria-hidden="true" />
  );
}

function tabClass(
  active: boolean,
  accent: "cyan" | "green" | "lime" | "orange" | "pink" | "purple" | "blue" | "more",
) {
  return `hub-mobile-tab znav-control pdx-glass-rebind${active ? ` is-active is-${accent}` : ""}`;
}

export default function MobileBottomNav() {
  const [location] = useLocation();
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

  useEffect(() => {
    const close = () => { setEventsOpen(false); setSpaceOpen(false); setOutzOpen(false); setHubOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const desktop = window.matchMedia("(min-width: 960px)");
    const onResize = () => { if (desktop.matches) close(); };
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => { window.removeEventListener("keydown", onKey); desktop.removeEventListener("change", onResize); };
  }, []);

  const placesActive = navLinkActive(location, "/directory");
  const eventsActive = EVENTS_NAV.some(item => navLinkActive(location, item.href));
  const boardsActive = BOARD_NAV.some(item => navLinkActive(location, item.href)) || navLinkActive(location, OUTZ_INDEX);
  const hubActive = navLinkActive(location, "/dashboard");
  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const hubSection = navLinkActive(location, "/dashboard") ? parseHubSection(new URLSearchParams(location.split("?")[1] || "").get("section")) : undefined;

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
          <div className="hub-more-sheet hub-more-sheet--site pdx-liquid-overlay" data-accent="cyan" role="dialog" aria-label="Eventz">
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
          <div className="hub-more-sheet hub-more-sheet--site hub-more-sheet--boards pdx-liquid-overlay" data-accent="violet" role="dialog" aria-label="Boards">
            <h3>Boards</h3>
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
            <h3 className="mobile-nav-explore-heading">Explore</h3>
            {EXPLORE_LINKS.map(item => item.type === "link" && <Link key={item.href} href={item.href} className="hub-more-item" data-accent={item.accent} onClick={() => setSpaceOpen(false)}><span>{item.label}</span></Link>)}
            <button
              type="button"
              className={`hub-more-item hub-more-item--drawer${outzOpen ? " is-active" : ""}`}
              data-accent="orange"
              aria-expanded={outzOpen}
              aria-haspopup="dialog"
              onClick={handleOutz}
            >
              <span>OutZide</span>
            </button>
          </div>
        </>
      )}

      {outzOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setOutzOpen(false)} aria-hidden="true" />
          <div className="hub-outz-drawer pdx-liquid-overlay" role="dialog" aria-label="OutZide, most visited">
            <span className="hub-outz-drawer__kicker">OutZide &middot; Most Visited</span>
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
              View All OutZide &rarr;
            </Link>
          </div>
        </>
      )}

      {hubOpen && (
        <>
          <div className="hub-more-backdrop" onClick={() => setHubOpen(false)} aria-hidden="true" />
          <div className="hub-sheet pdx-liquid-overlay" role="dialog" aria-label="Your Hub">
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

      <nav className="hub-mobile-bar site-hub-mobile-bar site-mobile-nav--compact site-mobile-nav--caption" aria-label="Site mobile navigation">
        <div className="hub-mobile-bar__dock">
          <button
            type="button"
            className={tabClass(eventsActive || eventsOpen, "cyan")}
            data-accent="cyan"
            aria-expanded={eventsOpen}
            aria-haspopup="dialog"
            aria-label="Eventz"
            onClick={handleEvents}
          >
            <span className="znav-icon-row"><CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Eventz</span>
          </button>

          <Link
            href="/directory"
            className={tabClass(placesActive, "blue")}
            data-accent="blue"
            aria-label="Placez"
            aria-current={placesActive ? "page" : undefined}
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><MapPin size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Placez</span>
          </Link>

          <Link
            href="/map"
            className={`${tabClass(navLinkActive(location, "/map"), "cyan")} znav-mapz`}
            data-accent="cyan"
            aria-label="Mapz"
            title="Mapz"
            aria-current={navLinkActive(location, "/map") ? "page" : undefined}
            onClick={handleNavLink}
          >
            <span className="znav-icon-row"><MapzMark /></span>
            <span className="znav-caption">Mapz</span>
          </Link>

          <button
            type="button"
            className={tabClass(boardsActive || spaceOpen || outzOpen, "purple")}
            data-accent="violet"
            aria-expanded={spaceOpen}
            aria-haspopup="dialog"
            aria-label="Boards"
            onClick={handleSpace}
          >
            <span className="znav-icon-row"><LayoutGrid size={20} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="znav-caption">Boards</span>
          </button>

          <button
            type="button"
            className={tabClass(Boolean((user || localDemo) && open), "pink")}
            data-accent="magenta"
            data-inbox-open-trigger="messages"
            onClick={handleMessages}
            aria-expanded={user || localDemo ? open : undefined}
            aria-label={
              attentionCount > 0
                ? `Messages, ${attentionCount} need attention`
                : "Messages"
            }
          >
            <span className="znav-icon-row hub-mobile-tab__icon-wrap">
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden="true" />
              {user && attentionCount > 0 && <i>{attentionCount > 9 ? "9+" : attentionCount}</i>}
            </span>
            <span className="znav-caption">Messages</span>
          </button>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>,
    document.body,
  );
}
