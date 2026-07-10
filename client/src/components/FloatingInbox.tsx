import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import InboxOverlay from "@/components/InboxOverlay";

/**
 * Desktop-only floating inbox. A chat FAB pinned to the bottom-right corner
 * toggles the shared, frameless InboxOverlay. Hidden on mobile (the bottom nav
 * owns the inbox there) and on the dedicated /inbox route (already the full
 * shell).
 */
export default function FloatingInbox() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const onInboxPage = location === "/inbox" || location.startsWith("/inbox?");

  // Close when navigating to a different route.
  useEffect(() => {
    setOpen(false);
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

  if (!user || onInboxPage) return null;

  return (
    <div className="floating-inbox">
      <InboxOverlay open={open} onClose={() => setOpen(false)} />

      <button
        type="button"
        className={`floating-inbox__fab${open ? " floating-inbox__fab--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={
          open
            ? "Close inbox"
            : unreadCount > 0
              ? `Open inbox, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
              : "Open inbox"
        }
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unreadCount > 0 && (
          <span className="floating-inbox__fab-badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
