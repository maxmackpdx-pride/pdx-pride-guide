import { Link } from "wouter";
import logoWordmark from "@assets/logo-wordmark.png";
import { FeedbackButton } from "./FeedbackForm";
import CalmModeToggle from "./CalmModeToggle";
import PushNotificationToggle from "./PushNotificationToggle";


export default function Footer() {
  return (
    <footer style={{ background: "#000" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ color: "var(--text-meta)", fontSize: "0.82rem", maxWidth: 280, lineHeight: 1.6 }}>
            Built by one person in Portland. No committee, no corporate parent, no notes.
          </div>
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div>
              <div className="display" style={{ fontSize: "0.75rem", color: "var(--text-meta)", marginBottom: 12, letterSpacing: "0.1em" }}>NAVIGATE</div>
              {[
                ["/events", "Events"],
                ["/schedule", "Schedule"],
                ["/pride-work", "Gig Board"],
                ["/gifting", "Gifting"],
                ["/spotted", "Spotted!"],
                ["/directory", "Directory"],
                ["/submit", "Submit"],
                ["/about", "About"],
                ["/sponsors", "Sponsors"],
                ["/access", "Access & Safety"],
                ["/contact", "Contact"],
                ["/legal", "Legal"],
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
                ["/sponsors", "Sponsor the Guide"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <Link href={href} style={{ color: "#888", fontSize: "0.82rem", textDecoration: "none" }}>{label}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-brand" aria-label="PDX Pride Guide">
          <img
            src={logoWordmark}
            alt="PDX Pride Guide 2026"
            className="footer-brand-lockup"
            width={1504}
            height={688}
            decoding="async"
          />
        </div>
        <div className="footer-controls">
          <FeedbackButton />
          <PushNotificationToggle />
          <CalmModeToggle />
        </div>
        <div className="footer-coffee">
          <p className="footer-coffee__note">Free forever, but not free to run.</p>
          <a
            href="https://venmo.com/tucker_pdmax"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-coffee__btn"
            data-testid="footer-buy-coffee"
            aria-label="Buy me a coffee on Venmo @tucker_pdmax"
          >
            BUY ME A COFFEE
          </a>
          <p className="footer-coffee__handle">Venmo @tucker_pdmax</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>
            Portland, Oregon. Made by Tucker. Answering to nobody.
          </div>
          <div style={{ color: "var(--text-faint)", fontSize: "0.75rem", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>© 2026 PDX Pride Guide · Free to Browse · Independently Run</span>
            <Link href="/legal" style={{ color: "var(--text-faint)", textDecoration: "underline" }}>Legal</Link>
          </div>
        </div>
      </div>
      <div className="rainbow-bar rainbow-bar--bleed rainbow-bar--thick" aria-hidden="true" />
    </footer>
  );
}
