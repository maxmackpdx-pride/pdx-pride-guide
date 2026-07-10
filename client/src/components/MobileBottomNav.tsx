import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Menu, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import { PRIMARY_NAV } from "@/lib/siteNav";

function navLinkActive(location: string, href: string) {
  return location === href || location.startsWith(`${href}?`) || location.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [hubExpanded, setHubExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "admin" | "owner">("personal");
  const hubRef = useRef<HTMLDivElement>(null);

  // Close hub menu when navigating
  useEffect(() => {
    setHubExpanded(false);
  }, [location]);

  // Close hub menu on outside click
  useEffect(() => {
    if (!hubExpanded) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!hubRef.current?.contains(event.target as Node)) {
        setHubExpanded(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHubExpanded(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [hubExpanded]);

  // Fetch unread count
  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () =>
      fetch("/api/messages/unread-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0 }
      ),
    enabled: !!user,
    refetchInterval: 90000,
  });

  // Fetch recent conversations (for now, just fetch the inbox metadata)
  // TODO: This will be replaced with actual conversation list from backend
  const { data: conversations = [] } = useQuery<Array<{ id: string; username: string; photoUrl?: string; displayName?: string }>>({
    queryKey: ["/api/inbox/recent"],
    queryFn: async () => {
      // Placeholder: fetch from inbox endpoint
      // For now, return empty array since we need backend support
      return [];
    },
    enabled: !!user && activeTab === "personal",
  });

  const isAdmin = user?.isAdmin || user?.isSuperAdmin;
  const isOwner = user?.username === "tuckerhelms" || user?.isSuperAdmin;
  const inboxActive = location === "/inbox" || location.startsWith("/inbox?");
  const profilePath = user ? `/u/${encodeURIComponent(user.username)}` : "";

  return (
    <div className="site-mobile-nav">
      {/* Left section: Home + Hub */}
      <Link href="/" className={`site-mobile-nav__tab${location === "/" ? " active" : ""}`} aria-label="Home">
        <Home size={24} />
        <span>Home</span>
      </Link>

      <div ref={hubRef} className="site-mobile-nav__hub-wrapper">
        <button
          type="button"
          className={`site-mobile-nav__tab site-mobile-nav__hub-toggle${hubExpanded ? " active" : ""}`}
          onClick={() => setHubExpanded(!hubExpanded)}
          aria-expanded={hubExpanded}
          aria-controls="site-mobile-nav-hub-menu"
          aria-label={hubExpanded ? "Close menu" : "Open menu"}
        >
          {hubExpanded ? <X size={24} /> : <Menu size={24} />}
          <span>Hub</span>
        </button>

        {/* Hub expanded menu */}
        {hubExpanded && (
          <div id="site-mobile-nav-hub-menu" className="site-mobile-nav__hub-expanded">
            {/* Primary navigation items */}
            {PRIMARY_NAV.map(entry => {
              if (entry.type === "link") {
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={`site-mobile-nav__hub-item${navLinkActive(location, entry.href) ? " active" : ""}`}
                  >
                    {entry.label}
                  </Link>
                );
              }

              // Dropdown items
              return (
                <div key={entry.id} className="site-mobile-nav__hub-group">
                  <span className="site-mobile-nav__hub-group-label">{entry.label}</span>
                  {entry.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`site-mobile-nav__hub-item site-mobile-nav__hub-item--sub${location === item.href ? " active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              );
            })}

            {/* User section */}
            {user && (
              <div className="site-mobile-nav__hub-user-section">
                <Link
                  href={profilePath}
                  className={`site-mobile-nav__hub-item${profilePath && location === profilePath ? " active" : ""}`}
                >
                  View profile
                </Link>
                <Link href="/settings/notifications" className="site-mobile-nav__hub-item">
                  Notification settings
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section: Inbox */}
      <div className={`site-mobile-nav__inbox${inboxActive ? " active" : ""}`}>
        {/* Tab switcher */}
        <div className="site-mobile-nav__tabs">
          <button
            type="button"
            className={`site-mobile-nav__tab-switch${activeTab === "personal" ? " active" : ""}`}
            onClick={() => setActiveTab("personal")}
            aria-label="Personal messages"
          >
            Personal
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`site-mobile-nav__tab-switch${activeTab === "admin" ? " active" : ""}`}
              onClick={() => setActiveTab("admin")}
              aria-label="Admin messages"
            >
              Admin
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              className={`site-mobile-nav__tab-switch${activeTab === "owner" ? " active" : ""}`}
              onClick={() => setActiveTab("owner")}
              aria-label="Owner messages"
            >
              Owner
            </button>
          )}
        </div>

        {/* Avatar scroll area */}
        <div className="site-mobile-nav__avatars">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/inbox?thread=${conv.id}`}
                className="site-mobile-nav__avatar-link"
                title={conv.displayName || conv.username}
              >
                <UserAvatar
                  photoUrl={conv.photoUrl}
                  displayName={conv.displayName || conv.username}
                  username={conv.username}
                />
                {unread.count > 0 && (
                  <span className="site-mobile-nav__unread-badge" aria-label={`${unread.count} unread message${unread.count === 1 ? "" : "s"}`} />
                )}
              </Link>
            ))
          ) : (
            <div className="site-mobile-nav__empty">
              <MessageCircle size={20} />
              <span>No messages</span>
            </div>
          )}
        </div>

        {/* Inbox link */}
        <Link href="/inbox" className="site-mobile-nav__inbox-link" aria-label="Open full inbox">
          Inbox
          {unread.count > 0 && <span className="site-mobile-nav__count-badge">{unread.count}</span>}
        </Link>
      </div>
    </div>
  );
}
