/**
 * Infrastructure Grid — 2×2 deep-glass left-accent cards.
 *
 * SoT: docs/handoffs/deep-glass-2026-07-16/ §2.11
 *      screenshots/12-infrastructure-grid.png
 * Tokens: glass.css `.pdx-glass-card` + `.pdx-glass-card--left-accent`
 * Accents: Gigs #6E3DFF · Gifting #CCFF00 · MC #FF00CC · Nude Beaches #FF6600
 * No title glow.
 */

import { Link } from "wouter";
import type { CSSProperties } from "react";
import "./InfrastructureGrid.css";

export type InfraCard = {
  href: string;
  title: string;
  description: string;
  /** Per-card accent — drives --c for glass fill / edge / left bar */
  accent: string;
};

/** Canonical infrastructure tiles (About "Necessary homosexual infrastructure"). */
export const INFRASTRUCTURE_CARDS: readonly InfraCard[] = [
  {
    href: "/pride-work",
    title: "Gigs",
    description:
      "Do you offer a trade, need work, or want to put your talents out there? Check gigs.",
    accent: "#6E3DFF",
  },
  {
    href: "/gifting",
    title: "Gifting",
    description:
      "Need something for Pride week or have old Pride gear collecting dust? Hit gifting.",
    accent: "#CCFF00",
  },
  {
    href: "/spotted",
    title: "Missed connections",
    description:
      "Trying to find someone after a Pride event? That's why missed connections exists.",
    accent: "#FF00CC",
  },
  {
    href: "/nude-beaches",
    title: "Nude beaches",
    description:
      "Want to make new friends at the river or catch a ride there or back? Check out the nude beach section.",
    accent: "#FF6600",
  },
] as const;

type InfrastructureGridProps = {
  /** Override default About tiles (optional). */
  cards?: readonly InfraCard[];
  className?: string;
};

export default function InfrastructureGrid({
  cards = INFRASTRUCTURE_CARDS,
  className,
}: InfrastructureGridProps) {
  return (
    <div
      className={["infra-grid", className].filter(Boolean).join(" ")}
      data-testid="infrastructure-grid"
    >
      {cards.map(card => (
        <Link
          key={card.href}
          href={card.href}
          className="infra-grid__card pdx-glass-card pdx-glass-card--left-accent"
          style={{ ["--c" as string]: card.accent } as CSSProperties}
          data-testid={`infra-card-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <h3 className="infra-grid__title">{card.title}</h3>
          <p className="infra-grid__desc">{card.description}</p>
        </Link>
      ))}
    </div>
  );
}
