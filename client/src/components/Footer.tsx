import { Link } from "wouter";
import logoWordmark from "@assets/logo-wordmark.png";
import { FeedbackButton } from "./FeedbackForm";
import CalmModeToggle from "./CalmModeToggle";
import PushNotificationToggle from "./PushNotificationToggle";
import SplitFlapSignoff from "./SplitFlapSignoff";

type FooterLink = [href: string, label: string];

const FOOTER_FOLDERS: { id: string; title: string; links: FooterLink[] }[] = [
  {
    id: "explore",
    title: "Explore",
    links: [
      ["/events", "Events"],
      ["/schedule", "Schedule"],
      ["/directory", "Directory"],
      ["/spotted", "Spotted!"],
      ["/pride-work", "Gig Board"],
      ["/gifting", "Gifting"],
    ],
  },
  {
    id: "participate",
    title: "Participate",
    links: [
      ["/submit", "Submit an Event"],
      ["/submit", "Claim an Event"],
      ["/pride-work", "Post a Gig"],
      ["/gifting", "Post a Gift / In Search Of"],
      ["/sponsors", "Sponsor the Guide"],
    ],
  },
  {
    id: "guide",
    title: "Guide",
    links: [
      ["/about", "About"],
      ["/sponsors", "Sponsors"],
      ["/access", "Access & Safety"],
      ["/contact", "Contact"],
      ["/legal", "Legal"],
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "#000" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div className="footer-top">
          <div className="footer-tagline">
            Built by one person in Portland. No committee, no corporate parent, no notes.
          </div>
          <nav className="footer-folders" aria-label="Footer">
            {FOOTER_FOLDERS.map((folder) => (
              <details key={folder.id} className="footer-folder">
                <summary className="footer-folder__summary">
                  <span className="footer-folder__title display">{folder.title}</span>
                  <span className="footer-folder__chevron" aria-hidden="true">
                    ▾
                  </span>
                </summary>
                <ul className="footer-folder__list">
                  {folder.links.map(([href, label]) => (
                    <li key={`${folder.id}-${label}`}>
                      <Link href={href} className="footer-folder__link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>
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
        <div style={{ margin: "28px 0 20px" }}>
          <SplitFlapSignoff />
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
