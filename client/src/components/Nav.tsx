import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import logoWordmark from "@assets/logo-wordmark.png";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import AuthModal from "./AuthModal";
import UserAvatar from "@/components/UserAvatar";
import CalmModeToggle from "@/components/CalmModeToggle";
import { Divider } from "@/components/ds";
import { PRIMARY_NAV } from "@/lib/siteNav";

type NavItem = { href: string; label: string };

const navEntries = PRIMARY_NAV;

function navLinkActive(location: string, href: string) {
  return location === href || location.startsWith(`${href}?`) || location.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  showNotify,
  notifyLabel,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  showNotify?: boolean;
  notifyLabel?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`site-nav-link${active ? " active" : ""}${showNotify ? " site-nav-link--notify" : ""}`}
      onClick={onClick}
      aria-label={notifyLabel}
    >
      {label}
      {showNotify && <span className="site-nav-notify-dot" aria-hidden="true" />}
    </Link>
  );
}

function NavDropdown({
  id,
  label,
  items,
  location,
  open,
  onToggle,
  onClose,
}: {
  id: string;
  label: string;
  items: NavItem[];
  location: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const active = items.some(item => location === item.href || location.startsWith(`${item.href}/`));
  const panelId = `site-nav-dropdown-${id}`;

  return (
    <div className={`site-nav-dropdown${open ? " open" : ""}`}>
      <button
        type="button"
        className={`site-nav-dropdown__trigger${active ? " active" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={onToggle}
      >
        {label}
        <ChevronDown size={16} className="site-nav-dropdown__chevron" aria-hidden="true" />
      </button>
      <div id={panelId} className="site-nav-dropdown__panel" role="menu">
        <span className="site-nav-dropdown__section" aria-hidden="true">
          {label}
        </span>
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            className={`site-nav-dropdown__item${location === item.href ? " active" : ""}`}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Nav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { openSheet } = useInboxSheet();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const fetching = useIsFetching();

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setOpenDropdown(null);
    setRouteLoading(true);
    const t = window.setTimeout(() => setRouteLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [location]);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!openDropdown) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!navScrollRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDropdown(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown]);

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });

  const unreadCount = unread.count || 0;
  const closeMenu = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };
  const hubActive = location === "/dashboard" || location.startsWith("/dashboard?");
  const profilePath = user ? `/u/${encodeURIComponent(user.username)}` : "";
  const profileActive = Boolean(user && (location === profilePath || location.startsWith(`${profilePath}/`)));

  const seamLoading = routeLoading || fetching > 0;

  return (
    <>
      <header className="site-header site-header--real-seam">
        <div className="site-header-inner">
          <Link href="/" className="site-brand" aria-label="PDX Pride Guide home">
            <img
              src={logoWordmark}
              alt="PDX Pride Guide 2026"
              className="site-brand-lockup"
              width={1504}
              height={688}
              decoding="async"
            />
          </Link>

          <nav
            id="site-nav-menu"
            className={`site-nav${menuOpen ? " open" : ""}`}
            aria-label="Primary navigation"
          >
            <div className="site-nav-scroll" ref={navScrollRef}>
              {navEntries.map(entry => {
                if (entry.type === "link") {
                  return (
                    <NavLink
                      key={entry.href}
                      href={entry.href}
                      label={entry.label}
                      active={navLinkActive(location, entry.href)}
                      onClick={closeMenu}
                    />
                  );
                }

                return (
                  <NavDropdown
                    key={entry.id}
                    id={entry.id}
                    label={entry.label}
                    items={entry.items}
                    location={location}
                    open={openDropdown === entry.id}
                    onToggle={() => setOpenDropdown(current => (current === entry.id ? null : entry.id))}
                    onClose={closeMenu}
                  />
                );
              })}
            </div>

            {user && (
              <div className="site-auth">
                <span className="site-auth__hub">
                  <NavLink
                    href="/dashboard"
                    label="Hub"
                    active={hubActive}
                    showNotify={unreadCount > 0}
                    notifyLabel={
                      unreadCount > 0
                        ? `Hub, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`
                        : undefined
                    }
                    onClick={closeMenu}
                  />
                </span>
                <div className={`site-profile-menu${profileActive ? " site-profile-menu--active" : ""}`} ref={profileRef}>
                  <div className="site-profile-menu__cluster">
                    <Link
                      href="/dashboard?edit=profile"
                      className="site-profile-menu__avatar-link"
                      aria-label="Edit profile"
                      onClick={() => {
                        setProfileOpen(false);
                        setMenuOpen(false);
                      }}
                    >
                      <UserAvatar
                        photoUrl={user.photoUrl}
                        avatarChoice={user.avatarChoice}
                        avatarRing={user.avatarRing}
                        displayName={user.displayName}
                        username={user.username}
                      />
                      {unreadCount > 0 && <span className="site-profile-menu__notify-dot" aria-hidden="true" />}
                    </Link>
                    <button
                      type="button"
                      className={`site-profile-menu__caret${profileOpen ? " site-profile-menu__caret--open" : ""}`}
                      aria-expanded={profileOpen}
                      aria-haspopup="menu"
                      aria-label={
                        unreadCount > 0
                          ? `Profile menu: ${user.displayName || user.username}, ${unreadCount} unread`
                          : `Profile menu: ${user.displayName || user.username}`
                      }
                      onClick={() => setProfileOpen(open => !open)}
                    >
                      <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>
                  {profileOpen && (
                    <div className="site-profile-menu__panel" role="menu">
                      <Link
                        href="/dashboard?edit=profile"
                        role="menuitem"
                        className="site-profile-menu__item"
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Edit profile
                      </Link>
                      <Link
                        href={profilePath}
                        role="menuitem"
                        className="site-profile-menu__identity site-profile-menu__identity--link"
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        <span className="site-profile-menu__name">{user.displayName || user.username}</span>
                        <span className="site-profile-menu__username">@{user.username}</span>
                        <span className="site-profile-menu__identity-hint">View public profile</span>
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className={`site-profile-menu__item site-profile-menu__item--inbox${location === "/inbox" || location.startsWith("/inbox?") ? " active" : ""}`}
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                          openSheet();
                        }}
                      >
                        Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
                      </button>
                      <Link
                        href="/settings/notifications"
                        role="menuitem"
                        className={`site-profile-menu__item${location === "/settings/notifications" || location.startsWith("/settings/notifications?") ? " active" : ""}`}
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Notification settings
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="site-profile-menu__item site-profile-menu__item--logout"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!user && (
              <button
                onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                className="site-login-button"
              >
                LOG IN / JOIN
              </button>
            )}
          </nav>

          <div className="site-header-controls">
            <CalmModeToggle minimal />
            <button
              type="button"
              className="site-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-nav-menu"
              onClick={() => setMenuOpen(open => !open)}
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
              <span>{menuOpen ? "CLOSE" : "MENU"}</span>
            </button>
          </div>
        </div>
        {/* Real rainbow seam under header (replaces ::after). loading enables Seam Charge. */}
        <Divider
          seam
          thin
          loading={seamLoading}
          className="site-header-rainbow-seam"
        />
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}