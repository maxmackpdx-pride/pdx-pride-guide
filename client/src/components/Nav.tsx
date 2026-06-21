import { Link, useLocation } from "wouter";
import logoPath from "@assets/logo.png";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Promoters" },
  { href: "/pride-work", label: "Pride Work" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const [location] = useLocation();
  return (
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
        </nav>
      </div>
    </header>
  );
}
