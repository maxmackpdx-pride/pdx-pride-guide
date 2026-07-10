import { useLocation } from "wouter";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { useUnreadCount } from "@/hooks/useUnreadCount";

/**
 * Desktop-only floating inbox FAB. Toggles the shared InboxOverlay via
 * InboxSheetProvider. Hidden on mobile (bottom nav owns inbox there) and on
 * /inbox (full shell page).
 */
export default function FloatingInbox() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { open, toggleSheet } = useInboxSheet();
  const unreadCount = useUnreadCount();

  const onInboxPage = location === "/inbox" || location.startsWith("/inbox?");

  if (!user || onInboxPage) return null;

  return (
    <div className="floating-inbox">
      <button
        type="button"
        className={`floating-inbox__fab${open ? " floating-inbox__fab--open" : ""}`}
        onClick={toggleSheet}
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