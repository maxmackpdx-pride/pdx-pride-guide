import type { ReactNode } from "react";

export type PageHeroAccent = "lime" | "magenta" | "rainbow" | "cyan";

type PageHeroTaglineAccent = "magenta" | "cyan" | "lime";

type PageHeroProps = {
  kicker?: string;
  titleLine1: string;
  titleLine2?: string;
  accent?: PageHeroAccent;
  lede?: string;
  tagline?: string;
  taglineAccent?: PageHeroTaglineAccent;
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
  taglineAccent = "magenta",
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
          {kicker && <div className="board-kicker">{kicker}</div>}
          <h1 className="page-hero__title">
            <span className="page-hero__title-line">{titleLine1}</span>
            {titleLine2 && (
              <span className={`page-hero__accent page-hero__accent--${accent}`}>{titleLine2}</span>
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