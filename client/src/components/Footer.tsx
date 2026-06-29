import { Link } from "wouter";
import logoPath from "@assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { FeedbackButton } from "./FeedbackForm";


export default function Footer() {
  const { user } = useAuth();
  return (
    <footer style={{ background: "#000" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div className="display" style={{ fontSize: "1.4rem", marginBottom: 8 }}>
              PDX <span style={{ color: "var(--neon-yellow)" }}>PRIDE</span> GUIDE
            </div>
            <div style={{ color: "var(--text-meta)", fontSize: "0.82rem", maxWidth: 260, lineHeight: 1.6 }}>
              Independently built event directory for Portland Pride & queer events.
            </div>
          </div>
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div>
              <div className="display" style={{ fontSize: "0.75rem", color: "var(--text-meta)", marginBottom: 12, letterSpacing: "0.1em" }}>NAVIGATE</div>
              {[
                ["/events", "Events"],
                ["/submit", "Promoters"],
                ["/pride-work", "Pride Werk"],
                ["/gifting", "Gifting"],
                ["/about", "About"],
                ...(user?.isAdmin ? [["/admin", "Admin Panel"]] : []),
              ].map(([href, label]) => (
                <div key={href} style={{ marginBottom: 8 }}>
                  <Link href={href} style={{ color: "#888", fontSize: "0.82rem", textDecoration: "none" }}>{label}</Link>
                </div>
              ))}
            </div>
            <div>
              <div className="display" style={{ fontSize: "0.75rem", color: "var(--text-meta)", marginBottom: 12, letterSpacing: "0.1em" }}>PARTICIPATE</div>
              {[
                ["/submit", "Submit an Event"],
                ["/submit", "Claim an Event"],
                ["/pride-work", "Post a Gig"],
                ["/gifting", "Post a Gift / In Search Of"],
                ["/about", "Contact"],
              ].map(([href, label]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <Link href={href} style={{ color: "#888", fontSize: "0.82rem", textDecoration: "none" }}>{label}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
        <img src={logoPath} alt="" className="footer-brand-logo" />
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <FeedbackButton />
        </div>
        {/* Subtle donation line — footer only */}
        <div style={{ textAlign: "center", marginBottom: 20, padding: "12px 0", borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
          <span style={{ color: "var(--text-meta)", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
            This guide is free. Keep it that way.{" "}
            <a
              href="https://venmo.com/tucker_pdmax"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--neon-magenta)", textDecoration: "none", fontFamily: "var(--font-display)", fontSize: "0.78rem", letterSpacing: "0.04em" }}
            >
              → Venmo @tucker_pdmax
            </a>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
            Portland, Oregon · Made by Tucker · Queer Owned · Queer-Run Support Welcome
          </div>
          <div style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
            © 2026 PDX Pride Guide · Free to Browse · Independently Run
          </div>
        </div>
      </div>
      <div className="rainbow-bar rainbow-bar--bleed rainbow-bar--thick" aria-hidden="true" />
    </footer>
  );
}
