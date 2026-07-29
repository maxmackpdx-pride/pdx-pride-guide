import { Link } from "wouter";
import logoWordmark from "@assets/logo-wordmark.png";
import { FeedbackButton } from "./FeedbackForm";
import CalmModeToggle from "./CalmModeToggle";
import PushNotificationToggle from "./PushNotificationToggle";
import SplitFlapSignoff from "./SplitFlapSignoff";
import TipSupport from "./TipSupport";

type FooterLink = [href: string, label: string];

const FOOTER_FOLDERS: { id: string; title: string; links: FooterLink[] }[] = [
  {
    id: "explore",
    title: "Explore",
    links: [
      ["/events", "Events"],
      ["/schedule", "Schedule"],
      ["/directory", "Directory"],
      ["/nude-beaches", "Nude Beaches"],
      ["/spotted", "Missed Connections"],
      ["/pride-work", "Gig Board"],
      ["/gifting", "Gifting"],
      ["/hausing", "HAÜSING"],
    ],
  },
  {
    id: "participate",
    title: "Participate",
    links: [
      ["/submit", "Submit an Event"],
      ["/submit?mode=claim", "Claim an Event"],
      ["/pride-work", "Post a Gig"],
      ["/gifting", "Post a Gift / In Search Of"],
      ["/sponsors", "Sponsor Zaylist"],
    ],
  },
  {
    id: "about",
    title: "About",
    links: [
      ["/about", "About"],
      ["/access", "Access & Safety"],
      ["/contact", "Contact"],
      ["/legal", "Legal"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* Spread grid: brand | nav columns | support */}
        <div className="site-footer__grid">
          <div className="site-footer__brand-col">
            <img
              src={logoWordmark}
              alt="Zaylist"
              className="site-footer__logo"
              width={1200}
              height={423}
              decoding="async"
            />
            <p className="site-footer__tagline">
              Built by one person in Portland. No committee, no corporate parent  -  just someone who loves this scene.
            </p>
            <div className="site-footer__controls">
              <FeedbackButton />
              <PushNotificationToggle />
              <CalmModeToggle />
            </div>
          </div>

          <nav className="site-footer__nav" aria-label="Footer">
            {FOOTER_FOLDERS.map((folder) => (
              <div key={folder.id} className="site-footer__col">
                <div className="site-footer__col-title display">{folder.title}</div>
                <ul className="site-footer__list">
                  {folder.links.map(([href, label]) => (
                    <li key={`${folder.id}-${label}`}>
                      <Link href={href} className="site-footer__link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="site-footer__support">
            <TipSupport variant="footer" />
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__flap">
            <SplitFlapSignoff />
          </div>
          <div className="site-footer__legal">
            <span>Portland, Oregon. Made by Tucker  -  for the community, not shareholders.</span>
            <span className="site-footer__legal-sep" aria-hidden="true">
              ·
            </span>
            <span>© 2026 Zaylist · Free to Browse · Independently Run</span>
            <Link href="/legal" className="site-footer__legal-link">
              Legal
            </Link>
          </div>
        </div>
      </div>
      <div className="rainbow-bar rainbow-bar--bleed rainbow-bar--thick" aria-hidden="true" />
    </footer>
  );
}
