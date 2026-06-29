import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UserAvatar from "@/components/UserAvatar";
import GlitchWord from "@/components/GlitchWord";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Promoters" },
  { href: "/pride-work", label: "Pride Werk" },
  { href: "/gifting", label: "Gifting" },
  { href: "/spotted", label: "Spotted!" },
  { href: "/about", label: "About" },
];

const adminLinks = [
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "INBOX", notifyKey: "inbox" as const },
  { href: "/admin", label: "ADMIN", notifyKey: "admin" as const },
];

function NavLink({
  href,
  label,
  active,
  showNotify,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  showNotify?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`site-nav-link${active ? " active" : ""}${showNotify ? " site-nav-link--notify" : ""}`}
      onClick={onClick}
    >
      {label}
      {showNotify && <span className="site-nav-notify-dot" aria-label="Notifications" />}
    </Link>
  );
}

export default function Nav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
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

  const { data: adminSession } = useQuery<{ isAdmin?: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    retry: false,
    refetchInterval: 120000,
  });

  const isAdminNav = Boolean(user?.isAdmin || adminSession?.isAdmin);

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });

  const { data: adminPending = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () => fetch("/api/admin/pending-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: isAdminNav,
    refetchInterval: 90000,
  });

  const unreadCount = unread.count || 0;
  const adminPendingCount = adminPending.count || 0;
  const navLinks = isAdminNav ? adminLinks : publicLinks;
  const closeMenu = () => setMenuOpen(false);

  const inboxActive = location === "/dashboard" || location === "/inbox";
  const linkActive = (href: string) => {
    if (href === "/dashboard") return inboxActive;
    return location === href;
  };

  const linkNotify = (key?: "inbox" | "admin") => {
    if (key === "inbox") return unreadCount > 0;
    if (key === "admin") return adminPendingCount > 0;
    return false;
  };

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand" aria-label="PDX Pride Guide home">
            <img src={logoPath} alt="" className="site-brand-logo" />
            <span className="display site-brand-wordmark">
              <span className="site-brand-wordmark__line">PDX</span>
              <span className="site-brand-wordmark__line site-brand-wordmark__line--accent">
                <GlitchWord text="PRIDE" />
              </span>
              <span className="site-brand-wordmark__line">GUIDE</span>
            </span>
          </Link>

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

          <nav
            id="site-nav-menu"
            className={`site-nav${menuOpen ? " open" : ""}`}
            aria-label="Primary navigation"
          >
            {navLinks.map(l => (
              <NavLink
                key={l.href + l.label}
                href={l.href}
                label={l.label}
                active={linkActive(l.href)}
                showNotify={"notifyKey" in l ? linkNotify(l.notifyKey) : false}
                onClick={closeMenu}
              />
            ))}

            {user && !isAdminNav && (
              <div className="site-auth">
                <NavLink
                  href="/dashboard"
                  label="INBOX"
                  active={inboxActive}
                  showNotify={unreadCount > 0}
                  onClick={closeMenu}
                />
                <div className="site-profile-menu" ref={profileRef}>
                  <button
                    type="button"
                    className="site-profile-menu__trigger"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-label={`Profile menu: ${user.displayName || user.username}`}
                    onClick={() => setProfileOpen(open => !open)}
                  >
                    <UserAvatar
                      photoUrl={user.photoUrl}
                      avatarChoice={user.avatarChoice}
                      avatarRing={user.avatarRing}
                      displayName={user.displayName}
                      username={user.username}
                    />
                  </button>
                  {profileOpen && (
                    <div className="site-profile-menu__panel" role="menu">
                      <div className="site-profile-menu__identity">
                        <span className="site-profile-menu__name">{user.displayName || user.username}</span>
                        <span className="site-profile-menu__username">@{user.username}</span>
                      </div>
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className="site-profile-menu__item"
                        onClick={() => {
                          setProfileOpen(false);
                          setMenuOpen(false);
                        }}
                      >
                        Profile
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

            {user && isAdminNav && (
              <div className="site-auth">
                <div className="site-profile-menu" ref={profileRef}>
                  <button
                    type="button"
                    className="site-profile-menu__trigger"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-label={`Profile menu: ${user.displayName || user.username}`}
                    onClick={() => setProfileOpen(open => !open)}
                  >
                    <UserAvatar
                      photoUrl={user.photoUrl}
                      avatarChoice={user.avatarChoice}
                      avatarRing={user.avatarRing}
                      displayName={user.displayName}
                      username={user.username}
                    />
                  </button>
                  {profileOpen && (
                    <div className="site-profile-menu__panel" role="menu">
                      <div className="site-profile-menu__identity">
                        <span className="site-profile-menu__name">{user.displayName || user.username}</span>
                        <span className="site-profile-menu__username">@{user.username}</span>
                      </div>
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
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}