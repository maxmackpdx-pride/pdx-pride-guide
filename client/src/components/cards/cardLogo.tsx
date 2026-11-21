import type { ReactNode } from "react";

/** Family logo shown in a card header (Tucker, t312u). "ridez-pending" is a
 *  marked placeholder until the RIDEZ logo is drawn: no stand-in art. */
export type CardLogo = { src: string; alt: string } | "ridez-pending";

export const FAMILY_LOGOS = {
  afterz: { src: "/brand/family/afterz.svg", alt: "Afterz" },
  mizzed: { src: "/brand/family/mizzed-connection-mobile.webp", alt: "Mizzed Connections" },
  gigz: { src: "/brand/family/gigz-mobile.webp", alt: "Gigz" },
} as const;

export function CardLogoMark({ logo }: { logo?: CardLogo | null }): ReactNode {
  if (!logo) return null;
  if (logo === "ridez-pending") {
    return <span className="zcard-logo zcard-logo--pending" role="img" aria-label="Ridez">RIDEZ<small>LOGO PENDING</small></span>;
  }
  return <img className="zcard-logo" src={logo.src} alt={logo.alt} />;
}
