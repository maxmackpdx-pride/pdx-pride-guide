import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, LayoutGrid, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import InboxOverlay from "@/components/InboxOverlay";

/**
 * Mobile bottom navigation (signed-in users only). Three plain icon tabs:
 * Home, Hub (→ /dashboard), and Inbox (opens the floating overlay). Hidden on
 * desktop, where the top nav + floating inbox FAB take over.
 */
export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [inboxOpen, setInboxOpen] = useState(false);

  // Close the inbox overlay when navigating.
  useEffect(() => {
    setInboxOpen(false);
  }, [location]);

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () =>
      fetch("/api/messages/unread-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0 }
      ),
    enabled: !!user,
    refetchInterval: 90000,
  });
  const unreadCount = unread.count || 0;

  // Bottom nav only exists for signed-in users (Hub + Inbox are auth-gated).
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
        className={`site-mobile-nav__tab${inboxOpen ? " active" : ""}`}
        onClick={() => setInboxOpen(o => !o)}
        aria-expanded={inboxOpen}
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

      <InboxOverlay open={inboxOpen} onClose={() => setInboxOpen(false)} />
    </div>
  );
}
