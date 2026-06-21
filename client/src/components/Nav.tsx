import { useState } from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Promoters" },
  { href: "/pride-work", label: "Pride Work" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header style={{ background: "#000", borderBottom: "2px solid #1a1a1a", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src={logoPath} alt="PDX Pride Guide" style={{ height: 44, width: "auto" }} />
            <span className="display" style={{ fontSize: "1.1rem", color: "#fff", letterSpacing: "0.02em" }}>
              PDX <span style={{ color: "var(--neon-yellow)" }}>PRIDE</span> GUIDE
            </span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {links.map(l => (
              <Link key={l.href} href={l.href}
                style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  padding: "6px 12px", textDecoration: "none",
                  color: location === l.href ? "var(--neon-yellow)" : "#aaa",
                  borderBottom: location === l.href ? "2px solid var(--neon-yellow)" : "2px solid transparent",
                  transition: "color 0.1s",
                }}
              >{l.label}</Link>
            ))}

            {/* Auth area */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, paddingLeft: 12, borderLeft: "1px solid #222" }}>
                <Link href="/inbox" style={{ textDecoration: "none" }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem",
                    color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase",
                    padding: "4px 8px",
                  }}>INBOX</span>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.72rem",
                    color: "#CCFF00", letterSpacing: "0.07em", textTransform: "uppercase",
                    padding: "5px 10px", border: "1px solid #CCFF00",
                  }}>
                    {user.displayName || user.username}
                  </span>
                </Link>
                <button onClick={() => logout()} style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.68rem",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  background: "none", border: "none", color: "#555", cursor: "pointer",
                  padding: "4px 6px",
                }}>OUT</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                marginLeft: 12,
                fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.78rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: "#CCFF00", color: "#000", border: "2px solid #CCFF00",
                padding: "7px 16px", cursor: "pointer",
                boxShadow: "2px 2px 0 rgba(204,255,0,0.3)",
              }}>LOG IN / JOIN</button>
            )}
          </nav>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
