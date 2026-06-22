import { useEffect, useState } from "react";
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

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

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
              PDX <span style={{ color: "var(--neon-yellow)" }}>PRIDE</span> GUIDE
            </span>
          </Link>

          <button
            type="button"
            className="site-nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav-menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
                  className={`site-nav-link inbox-link${location === "/inbox" ? " active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  INBOX{unreadCount > 0 && <span className="site-unread-badge">{unreadCount}</span>}
                </Link>
                <Link href="/dashboard" className="site-dashboard-link site-dashboard-link--avatar" onClick={() => setMenuOpen(false)}>
                  <UserAvatar
                    photoUrl={user.photoUrl}
                    avatarChoice={user.avatarChoice}
                    avatarRing={user.avatarRing}
                    displayName={user.displayName}
                    username={user.username}
                    size={28}
                  />
                  <span>{user.displayName || user.username}</span>
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="site-logout-button">OUT</button>
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
