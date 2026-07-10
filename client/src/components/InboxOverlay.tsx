import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { X, Maximize2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { InboxShell } from "@/components/inbox/InboxShell";
import { FilterChip } from "@/components/ds";

type Tab = "personal" | "admin" | "owner";

const TAB_ACCENT: Record<Tab, string> = {
  personal: "cyan",
  admin: "amber",
  owner: "purple",
};

/**
 * Frameless, floating inbox panel shared by the mobile bottom-nav Inbox icon
 * and the desktop floating action button. Role-based tabs (Personal / Admin /
 * Owner) sit above the message list. The presentation (mobile bottom sheet vs.
 * desktop bottom-right panel) is driven by the ancestor container's CSS.
 */
export default function InboxOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("personal");
  const [threadId, setThreadId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const isOwner = Boolean(user?.username === "tuckerhelms" || user?.isSuperAdmin);

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

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Close on click outside the panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    // Defer so the opening click doesn't immediately close it.
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointerDown);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  const openFullInbox = () => {
    onClose();
    setLocation(threadId ? `/inbox?thread=${encodeURIComponent(threadId)}` : "/inbox");
  };

  return (
    <>
      <div className="inbox-overlay__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="inbox-overlay" role="dialog" aria-label="Inbox" ref={panelRef}>
        <div className="inbox-overlay__head">
          <div className="inbox-overlay__head-top">
            <span className="inbox-overlay__title">Inbox</span>
            <div className="inbox-overlay__head-actions">
              <button
                type="button"
                className="inbox-overlay__icon-btn"
                onClick={openFullInbox}
                aria-label="Open full inbox"
                title="Open full inbox"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                className="inbox-overlay__icon-btn"
                onClick={onClose}
                aria-label="Close inbox"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="inbox-overlay__tabs" role="tablist" aria-label="Inbox categories">
            <FilterChip
              role="tab"
              aria-selected={tab === "personal"}
              selected={tab === "personal"}
              fill={tab === "personal"}
              accent={TAB_ACCENT.personal}
              count={unreadCount > 0 ? unreadCount : null}
              onToggle={() => setTab("personal")}
            >
              Personal
            </FilterChip>
            {isAdmin && (
              <FilterChip
                role="tab"
                aria-selected={tab === "admin"}
                selected={tab === "admin"}
                fill={tab === "admin"}
                accent={TAB_ACCENT.admin}
                onToggle={() => setTab("admin")}
              >
                Admin
              </FilterChip>
            )}
            {isOwner && (
              <FilterChip
                role="tab"
                aria-selected={tab === "owner"}
                selected={tab === "owner"}
                fill={tab === "owner"}
                accent={TAB_ACCENT.owner}
                onToggle={() => setTab("owner")}
              >
                Owner
              </FilterChip>
            )}
          </div>
        </div>

        <div className="inbox-overlay__body">
          {tab === "personal" ? (
            <InboxShell
              forceNarrow
              hideBrandHeader
              compact
              density="compact"
              initialThreadId={threadId}
              onThreadChange={setThreadId}
            />
          ) : (
            <div className="inbox-overlay__placeholder">
              <p>{tab === "admin" ? "Admin" : "Owner"} messages are coming soon.</p>
              <span>
                This channel will carry {tab === "admin" ? "moderation and team" : "business and operations"} messages.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
