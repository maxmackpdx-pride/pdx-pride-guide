import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";
import UserAvatar from "@/components/UserAvatar";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Promoters" },
  { href: "/pride-work", label: "Pride Work" },
  { href: "/gifting", label: "Gifting" },
  { href: "/missed-connections", label: "Missed" },
  { href: "/about", label: "About" },
];

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

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count").then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });
  const unreadCount = unread.count || 0;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand" aria-label="PDX Pride Guide home">
            <img src={logoPath} alt="" className="site-brand-logo" />
            <span className="display site-brand-wordmark">
              <span className="site-brand-wordmark__line">PDX</span>
              <span className="site-brand-wordmark__line site-brand-wordmark__line--accent">PRIDE</span>
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
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`site-nav-link${location === l.href ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            {user ? (
              <div className="site-auth">
                <Link
                  href="/inbox"
                  className={`site-nav-link inbox-link${location === "/inbox" ? " active" : ""}${unreadCount > 0 ? " inbox-link--live" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  INBOX{unreadCount > 0 && <span className="site-unread-badge site-unread-badge--pulse">{unreadCount}</span>}
                </Link>
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
            ) : (
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