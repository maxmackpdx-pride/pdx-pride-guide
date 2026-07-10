import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutGrid, MapPin, MessageCircle, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { BOARD_NAV, navLinkActive } from "@/lib/siteNav";
import AuthModal from "./AuthModal";

const MOBILE_ICON = 26;

function tabClass(active: boolean, accent: "cyan" | "green" | "lime" | "orange" | "more") {
  return `hub-mobile-tab${active ? ` is-active is-${accent}` : ""}`;
}

/**
 * Mobile bottom navigation (all visitors). Matches hub admin mobile bar styling.
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { open, toggleSheet } = useInboxSheet();
  const unreadCount = useUnreadCount();
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setBoardsOpen(false);
  }, [location]);

  const placesActive = navLinkActive(location, "/directory");
  const beachesActive = navLinkActive(location, "/nude-beaches");
  const hubActive = location === "/dashboard" || location.startsWith("/dashboard?");
  const boardsActive = BOARD_NAV.some(item => navLinkActive(location, item.href));

  const handleHub = () => {
    if (!user) {
      setShowAuth(true);
    }
  };

  const handleMessages = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    toggleSheet();
  };

  return (
    <>
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
        >
          <MapPin size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Places</span>
        </Link>

        <Link
          href="/nude-beaches"
          className={tabClass(beachesActive, "green")}
          aria-label="Nude Beaches"
          aria-current={beachesActive ? "page" : undefined}
        >
          <Sun size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Beaches</span>
        </Link>

        {user ? (
          <Link
            href="/dashboard"
            className={`${tabClass(hubActive, "lime")} hub-mobile-tab--center`}
            aria-label="Hub"
            aria-current={hubActive ? "page" : undefined}
          >
            <LayoutGrid size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Hub</span>
          </Link>
        ) : (
          <button
            type="button"
            className={`${tabClass(false, "lime")} hub-mobile-tab--center`}
            aria-label="Hub"
            onClick={handleHub}
          >
            <LayoutGrid size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Hub</span>
          </button>
        )}

        <button
          type="button"
          className={tabClass(boardsActive || boardsOpen, "more")}
          aria-expanded={boardsOpen}
          aria-haspopup="dialog"
          aria-label="Boards"
          onClick={() => setBoardsOpen(open => !open)}
        >
          <LayoutGrid size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
          <span>Boards</span>
        </button>

        <button
          type="button"
          className={tabClass(Boolean(user && open), "cyan")}
          onClick={handleMessages}
          aria-expanded={user ? open : undefined}
          aria-label={
            unreadCount > 0
              ? `Messages, ${unreadCount} unread`
              : "Messages"
          }
        >
          <span className="hub-mobile-tab__icon-wrap">
            <MessageCircle size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            {user && unreadCount > 0 && <i>{unreadCount > 9 ? "9+" : unreadCount}</i>}
          </span>
          <span>Messages</span>
        </button>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}