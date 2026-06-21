import { Link } from "wouter";

export default function Footer() {
  return (
    <footer style={{ background: "#000", borderTop: "2px solid #1a1a1a", marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div className="display" style={{ fontSize: "1.4rem", marginBottom: 8 }}>
              PDX <span style={{ color: "var(--neon-yellow)" }}>PRIDE</span> GUIDE
            </div>
            <div style={{ color: "#666", fontSize: "0.82rem", maxWidth: 260, lineHeight: 1.6 }}>
              Community-run event directory for Portland Pride & year-round queer events.
            </div>
          </div>
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div>
              <div className="display" style={{ fontSize: "0.75rem", color: "#555", marginBottom: 12, letterSpacing: "0.1em" }}>NAVIGATE</div>
              {[
                ["/events", "Events"],
                ["/submit", "Promoters"],
                ["/pride-work", "Pride Work"],
                ["/about", "About"],
              ].map(([href, label]) => (
                <div key={href} style={{ marginBottom: 8 }}>
                  <Link href={href} style={{ color: "#888", fontSize: "0.82rem", textDecoration: "none" }}>{label}</Link>
                </div>
              ))}
            </div>
            <div>
              <div className="display" style={{ fontSize: "0.75rem", color: "#555", marginBottom: 12, letterSpacing: "0.1em" }}>PARTICIPATE</div>
              {[
                ["/submit", "Submit an Event"],
                ["/submit", "Claim an Event"],
                ["/pride-work", "Post a Gig"],
                ["/about", "Contact"],
              ].map(([href, label]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <Link href={href} style={{ color: "#888", fontSize: "0.82rem", textDecoration: "none" }}>{label}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="torn-divider" style={{ marginBottom: 20 }} />
        {/* Subtle donation line — footer only */}
        <div style={{ textAlign: "center", marginBottom: 20, padding: "12px 0", borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
          <span style={{ color: "#555", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
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
          <div style={{ color: "#444", fontSize: "0.75rem" }}>
            Portland, Oregon · Community Powered · Queer Owned · Two-Admin Approved
          </div>
          <div style={{ color: "#444", fontSize: "0.75rem" }}>
            © 2026 PDX Pride Guide · Free Forever · Made by Tucker
          </div>
        </div>
      </div>
    </footer>
  );
}
