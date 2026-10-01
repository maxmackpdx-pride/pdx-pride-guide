import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FeedbackButton } from "./FeedbackForm";
import PushNotificationToggle from "./PushNotificationToggle";
import CalmModeToggle from "./CalmModeToggle";
import SplitFlapSignoff from "./SplitFlapSignoff";
import TipSupport from "./TipSupport";

type FooterLink = [href: string, label: string];

const FOOTER_FOLDERS: { id: string; title: string; links: FooterLink[] }[] = [
  {
    id: "explore",
    title: "Explore",
    links: [
      ["/events", "EVENTZ"],
      ["/schedule", "My Schedule"],
      ["/map", "Mapz"],
      ["/z", "Z/ List · Communities"],
      ["/directory", "Placez on Mapz"],
      ["/outzide", "Outzide"],
      ["/outzide/rooster-rock", "Rooster Rock"],
      ["/outzide/sauvie-island", "Sauvie Island"],
      ["/mizzed", "MIZZED CONNECTION"],
      ["/gigz", "GIGZ"],
      ["/giftz", "GIFTZ"],
      ["/sellz", "SELLZ"],
      ["/the-hauz", "THE HAÜZ"],
    ],
  },
  {
    id: "participate",
    title: "Participate",
    links: [
      ["/submit", "Submit an Event"],
      ["/submit?mode=claim", "Claim an Event"],
      ["/gigz", "Post a Gig"],
      ["/giftz", "Post a Gift / In Search Of"],
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

function FooterLinks({ folder }: { folder: (typeof FOOTER_FOLDERS)[number] }) {
  return (
    <ul className="site-footer__list">
      {folder.links.map(([href, label]) => (
        <li key={`${folder.id}-${label}`}>
          <Link href={href} className="site-footer__link">{label}</Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__intro">
          <Link href="/" className="site-footer__brand-link" aria-label="Zaylist home">
            <img src="/brand/family/zaylist-primary.svg" alt="Zaylist"
              className="site-footer__logo" width={1200} height={423} decoding="async" />
          </Link>
          <p className="site-footer__tagline">
            <strong>Queer Portland, connected.</strong>
          </p>
        </div>

        <Accordion type="single" collapsible className="site-footer__grid">
          <nav className="site-footer__nav" aria-label="Footer">
            {FOOTER_FOLDERS.map((folder) => (
              <AccordionItem key={folder.id} value={folder.id} className={`site-footer__col site-footer__col--${folder.id}`}>
                <AccordionTrigger className="site-footer__col-title">{folder.title}</AccordionTrigger>
                <AccordionContent><FooterLinks folder={folder} /></AccordionContent>
              </AccordionItem>
            ))}
          </nav>
          <AccordionItem value="support" className="site-footer__col site-footer__support">
            <AccordionTrigger className="site-footer__col-title">Support Zaylist</AccordionTrigger>
            <AccordionContent><TipSupport variant="footer" /></AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="site-footer__utility">
          <div className="site-footer__controls">
            <FeedbackButton />
            <PushNotificationToggle />
            <CalmModeToggle compact />
          </div>
        </div>
        <div className="site-footer__bottom">
          <div className="site-footer__flap"><SplitFlapSignoff /></div>
          <div className="site-footer__legal">
            <span>Made in Portland. Independently built.</span>
            <span>© {new Date().getFullYear()} Zaylist · Free to Browse · Independently Run</span>
            <Link href="/legal" className="site-footer__legal-link">Legal</Link>
          </div>
        </div>
      </div>
      <div className="rainbow-bar rainbow-bar--bleed rainbow-bar--thick" aria-hidden="true" />
    </footer>
  );
}
