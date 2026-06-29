import type { ReactNode } from "react";
import GlitchWord from "@/components/GlitchWord";
import HeroVideoOverlay from "@/components/HeroVideoOverlay";
import type { HeroOverlayId, HeroOverlayPreset } from "@/lib/heroOverlays";

export type PageHeroAccent = "lime" | "magenta" | "rainbow" | "cyan";

type PageHeroTaglineAccent = "magenta" | "cyan" | "lime";

export type PageHeroProps = {
  kicker?: string;
  titleLine1: string;
  /** Accent treatment for line 1 (e.g. rainbow PRIDE on gig board). */
  titleLine1Accent?: PageHeroAccent;
  titleLine2?: string;
  accent?: PageHeroAccent;
  lede?: string;
  tagline?: ReactNode;
  taglineAccent?: PageHeroTaglineAccent;
  actions?: ReactNode;
  bgImage: string;
  bgPosition?: string;
  /** Left-aligned hero on the photo scrim (Gifting / Gigs template). */
  flush?: boolean;
  /** Shorter hero for home promo panels (75% of default height). */
  compact?: boolean;
  /** WebM overlay stack on the hero photo. `false` disables overlays. */
  overlayPreset?: HeroOverlayPreset | false;
  overlays?: HeroOverlayId[];
  /** Mirror light-leaks video horizontally — alternate across panels. */
  flipLightLeaks?: boolean;
  className?: string;
};

export default function PageHero({
  kicker,
  titleLine1,
  titleLine1Accent,
  titleLine2,
  accent = "lime",
  lede,
  tagline,
  taglineAccent = "magenta",
  actions,
  bgImage,
  bgPosition = "center",
  flush = false,
  compact = false,
  overlayPreset = "panel",
  overlays,
  flipLightLeaks = false,
  className = "",
}: PageHeroProps) {
  const classes = [
    "page-hero",
    flush && "page-hero--flush",
    compact && "page-hero--compact",
    className,
  ].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div
        className="page-hero__bg"
        aria-hidden="true"
        style={{ backgroundImage: `url(${bgImage})`, backgroundPosition: bgPosition }}
      />
      {overlayPreset !== false && (
        <HeroVideoOverlay preset={overlayPreset} layers={overlays} flipLightLeaks={flipLightLeaks} />
      )}
      <div className="page-hero__scrim" aria-hidden="true" />
      <div className="page-hero__grain" aria-hidden="true" />
      <div className="page-hero__inner">
        <div className="page-hero__panel">
          {kicker && <div className="board-kicker">{kicker}</div>}
          <h1 className="page-hero__title">
            {titleLine1Accent === "rainbow" ? (
              <span className="page-hero__accent page-hero__accent--rainbow">
                <GlitchWord text={titleLine1} />
              </span>
            ) : (
              <span
                className={
                  titleLine1Accent
                    ? `page-hero__accent page-hero__accent--${titleLine1Accent}`
                    : "page-hero__title-line"
                }
              >
                {titleLine1}
              </span>
            )}
            {titleLine2 && (
              accent === "rainbow" ? (
                <span className="page-hero__accent page-hero__accent--rainbow">
                  <GlitchWord text={titleLine2} />
                </span>
              ) : (
                <span className={`page-hero__accent page-hero__accent--${accent}`}>{titleLine2}</span>
              )
            )}
          </h1>
          {lede && <p className="page-hero__lede">{lede}</p>}
          {tagline && (
            <p className={`page-hero__tagline page-hero__tagline--${taglineAccent}`}>{tagline}</p>
          )}
          {actions && <div className="page-hero__actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
