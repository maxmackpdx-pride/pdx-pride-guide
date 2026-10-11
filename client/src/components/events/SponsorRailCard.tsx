import type { CSSProperties } from "react";
import "./SponsorRailCard.css";

/**
 * Sponsor cards sized to sit in the Eventz rails next to compact event cards
 * (136px, 4:5 card, title and line underneath). Two designs per brand:
 * a code ticket and a product spotlight.
 */
export type SponsorKind = "ticket-cockblock" | "spot-mrs" | "spot-cockblock" | "ticket-mrs";
export const SPONSOR_KINDS: SponsorKind[] = ["ticket-cockblock", "spot-mrs", "spot-cockblock", "ticket-mrs"];

const BRANDS = {
  cockblock: {
    name: "CockBlock Toys",
    href: "https://cockblocktoys.com/tucker060",
    accent: "var(--neon-red)",
    logo: "/affiliate/feed/cb-logo-white.png",
    photo: "/affiliate/feed/cb-social.png",
    off: "10% off",
    code: "TUCKERMAX",
    spot: { head: "New: the CockBlock", sub: "Made for two" },
    line: "TUCKERMAX · 10% off",
  },
  mrs: {
    name: "Mr. S Leather",
    href: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
    accent: "var(--neon-cyan)",
    logo: "/affiliate/feed/mrs-logo.webp",
    photo: null,
    off: "Shop gear",
    code: "TUCKERMAX",
    spot: { head: "Harness season", sub: "Made in SF" },
    line: "Gear made in SF",
  },
} as const;

export default function SponsorRailCard({ kind }: { kind: SponsorKind }) {
  const [design, brandKey] = kind.split("-") as ["ticket" | "spot", keyof typeof BRANDS];
  const b = BRANDS[brandKey];
  return (
    <a
      className={`sponsor-rail-card sponsor-rail-card--${design}`}
      href={b.href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      style={{ "--b": b.accent } as CSSProperties}
      aria-label={`Sponsor: ${b.name}. ${design === "ticket" ? `Code ${b.code}, ${b.off}` : b.spot.head}. Opens in a new tab.`}
    >
      {design === "ticket" ? (
        <span className="sponsor-rail-card__box sponsor-rail-card__ticket">
          <span className="sponsor-rail-card__pill"><i aria-hidden="true" />Sponsor</span>
          <span className="sponsor-rail-card__logo"><img src={b.logo} alt="" loading="lazy" /></span>
          <span className="sponsor-rail-card__cut" aria-hidden="true" />
          <span className="sponsor-rail-card__deal"><b>{b.off}</b><code>{b.code}</code></span>
        </span>
      ) : (
        <span className="sponsor-rail-card__box sponsor-rail-card__spot">
          {b.photo
            ? <img className="sponsor-rail-card__photo" src={b.photo} alt="" loading="lazy" />
            : <img className="sponsor-rail-card__photo sponsor-rail-card__photo--logo" src={b.logo} alt="" loading="lazy" />}
          <span className="sponsor-rail-card__pill"><i aria-hidden="true" />Sponsor</span>
          <span className="sponsor-rail-card__spot-copy"><b>{b.spot.head}</b><small>{b.spot.sub}</small></span>
        </span>
      )}
      <span className="sponsor-rail-card__title">{b.name}</span>
      <span className="sponsor-rail-card__meta">{design === "ticket" ? "Use the code at checkout" : b.line}</span>
    </a>
  );
}
