import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, X } from "lucide-react";
import logoPath from "@assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UserAvatar from "@/components/UserAvatar";
import GlitchLogo from "@/components/GlitchLogo";
import GlitchWord from "@/components/GlitchWord";
import CalmModeToggle from "@/components/CalmModeToggle";
import { PRIMARY_NAV } from "@/lib/siteNav";

type NavItem = { href: string; label: string };

const navEntries = PRIMARY_NAV;

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
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setOpenDropdown(null);
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

  const { data: adminSession } = useQuery<{ isAdmin?: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    retry: false,
    refetchInterval: 120000,
  });

  const isAdmin = Boolean(user?.isAdmin || adminSession?.isAdmin);

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });

  const { data: adminPending = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () => fetch("/api/admin/pending-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: isAdmin,
    refetchInterval: 90000,
  });

  const unreadCount = unread.count || 0;
  const adminPendingCount = adminPending.count || 0;
  const closeMenu = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };
  const hubActive = location === "/dashboard" || location.startsWith("/dashboard?");
  const profilePath = user ? `/u/${encodeURIComponent(user.username)}` : "";
  const profileActive = Boolean(user && (location === profilePath || location.startsWith(`${profilePath}/`)));

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand" aria-label="PDX Pride Guide home">
            <GlitchLogo src={logoPath} alt="" />
            <span className="display site-brand-wordmark">
              <span className="site-brand-wordmark__line">PDX</span>
              <span className="site-brand-wordmark__line site-brand-wordmark__line--accent">
                <GlitchWord text="PRIDE" />
              </span>
              <span className="site-brand-wordmark__line">GUIDE</span>
            </span>
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
                      active={location === entry.href}
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
                {isAdmin && (
                  <NavLink
                    href="/admin"
                    label="ADMIN"
                    active={location === "/admin"}
                    showNotify={adminPendingCount > 0}
                    onClick={closeMenu}
                  />
                )}
                <div className={`site-profile-menu${profileActive ? " site-profile-menu--active" : ""}`} ref={profileRef}>
                  <button
                    type="button"
                    className={`site-profile-menu__trigger${profileOpen ? " site-profile-menu__trigger--open" : ""}`}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-label={
                      unreadCount > 0
                        ? `Profile menu: ${user.displayName || user.username}, ${unreadCount} unread`
                        : `Profile menu: ${user.displayName || user.username}`
                    }
                    onClick={() => setProfileOpen(open => !open)}
                  >
                    <UserAvatar
                      photoUrl={user.photoUrl}
                      avatarChoice={user.avatarChoice}
                      avatarRing={user.avatarRing}
                      displayName={user.displayName}
                      username={user.username}
                    />
                    {unreadCount > 0 && <span className="site-profile-menu__notify-dot" aria-hidden="true" />}
                  </button>
                  {profileOpen && (
                    <div className="site-profile-menu__panel" role="menu">
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
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className={`site-profile-menu__item${hubActive ? " active" : ""}`}
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Hub{unreadCount > 0 ? ` (${unreadCount})` : ""}
                      </Link>
                      <Link
                        href="/inbox"
                        role="menuitem"
                        className="site-profile-menu__item"
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Full inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
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

            {!user && isAdmin && (
              <div className="site-auth">
                <NavLink
                  href="/admin"
                  label="ADMIN"
                  active={location === "/admin"}
                  showNotify={adminPendingCount > 0}
                  onClick={closeMenu}
                />
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
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}