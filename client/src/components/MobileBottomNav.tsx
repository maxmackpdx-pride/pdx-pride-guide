import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";

/**
 * Mobile bottom navigation (signed-in users only). Three plain icon tabs:
 * Home, Hub (→ /dashboard), and Inbox (opens the shared sheet via provider).
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { open, toggleSheet } = useInboxSheet();
  const unreadCount = useUnreadCount();

  if (!user) return null;

  const homeActive = location === "/";
  const hubActive = location === "/dashboard" || location.startsWith("/dashboard?");

  return (
    <div className="site-mobile-nav">
      <Link
        href="/"
        className={`site-mobile-nav__tab${homeActive ? " active" : ""}`}
        aria-label="Home"
      >
        <Home size={24} />
        <span>Home</span>
      </Link>

      <Link
        href="/dashboard"
        className={`site-mobile-nav__tab${hubActive ? " active" : ""}`}
        aria-label="Hub"
      >
        <LayoutGrid size={24} />
        <span>Hub</span>
      </Link>

      <button
        type="button"
        className={`site-mobile-nav__tab${open ? " active" : ""}`}
        onClick={toggleSheet}
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Inbox, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
            : "Inbox"
        }
      >
        <span className="site-mobile-nav__icon-wrap">
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="site-mobile-nav__icon-badge" aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
        <span>Inbox</span>
      </button>
    </div>
  );
}