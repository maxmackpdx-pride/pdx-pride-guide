import type { ReactNode } from "react";

export type PageHeroAccent = "lime" | "magenta" | "rainbow" | "cyan";

type PageHeroProps = {
  kicker: string;
  titleLine1: string;
  titleLine2?: string;
  accent?: PageHeroAccent;
  lede: string;
  tagline?: string;
  actions?: ReactNode;
  bgImage: string;
  bgPosition?: string;
};

export default function PageHero({
  kicker,
  titleLine1,
  titleLine2,
  accent = "lime",
  lede,
  tagline,
  actions,
  bgImage,
  bgPosition = "center",
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <div
        className="page-hero__bg"
        aria-hidden="true"
        style={{ backgroundImage: `url(${bgImage})`, backgroundPosition: bgPosition }}
      />
      <div className="page-hero__scrim" aria-hidden="true" />
      <div className="page-hero__grain" aria-hidden="true" />
      <div className="page-hero__inner">
        <div className="page-hero__panel">
          <div className="board-kicker">{kicker}</div>
          <h1 className="display page-hero-title page-hero__title">
            {titleLine1}
            {titleLine2 && (
              <>
                <br />
                <span className={`page-hero__accent page-hero__accent--${accent}`}>{titleLine2}</span>
              </>
            )}
          </h1>
          <p className="page-hero__lede">{lede}</p>
          {tagline && <p className="page-hero__tagline">{tagline}</p>}
          {actions && <div className="page-hero__actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}